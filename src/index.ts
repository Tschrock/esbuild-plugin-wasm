import fs from 'fs';
import path from 'path';
import { OnLoadResult, OnResolveResult, Plugin, PluginBuild } from "esbuild";

import { generateWasmModule } from './module';

const  WASM_MODULE_NAMESPACE = "wasm-module";
const  WASM_DEFERRED_NAMESPACE = "wasm-deferred";
const  WASM_EMBEDDED_NAMESPACE = "wasm-embedded";

/**
 * Options for loading WASM files.
 */
interface WasmOptions {
    /**
     * The bundling mode for the WASM binary.
     * - `deferred` (Default) The WASM binary will be copied to the output directory and then downloaded at runtime. This is the preferred option.
     *
     *   **Note:** This option requires top-level await support, which is currently only available when bundling in `esm` format. See https://github.com/evanw/esbuild/issues/253
     *
     *
     * - `embedded` The WASM binary will be embedded into the resulting JS bundle.
     *
     *   **Note:** This embeds the file using base64, which will bloat the file size by an extra 30% compared to `deferred` mode.
     */
    mode?: 'deferred' | 'embedded';
}

/**
 * Loads `.wasm` files as a js module.
 */
function wasmLoader(options?: WasmOptions): Plugin {
    const embed = options?.mode?.toLowerCase() == "embedded";
    return {
        name: "wasm",
        setup(build: PluginBuild) {
            // Catch "*.wasm" files in the resolve phase and redirect them to our custom namespaces
            build.onResolve({ filter: /\.(?:wasm)$/ }, (args): OnResolveResult | undefined => {
                // If it's already in the virtual module namespace, redirect to the file loader
                if (args.namespace === WASM_MODULE_NAMESPACE) {
                    return { path: args.path, namespace: embed ? WASM_EMBEDDED_NAMESPACE : WASM_DEFERRED_NAMESPACE }
                }

                // Ignore unresolvable paths
                if (args.resolveDir === '') return;

                // Redirect to the virtual module namespace
                return {
                    path: path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path),
                    namespace: WASM_MODULE_NAMESPACE,
                }
            });

            // For virtual module loading, build a virtual module for the wasm file
            build.onLoad({ filter: /.*/, namespace: WASM_MODULE_NAMESPACE }, async (args): Promise<OnLoadResult> => {
                return {
                    contents: await generateWasmModule(args.path),
                    resolveDir: path.dirname(args.path)
                };
            });

            // For deffered file loading, get the wasm binary data and pass it to esbuild's built-in `file` loader
            build.onLoad({ filter: /.*/, namespace: WASM_DEFERRED_NAMESPACE }, async (args) => ({
                contents: await fs.promises.readFile(args.path),
                loader: 'file'
            }));

            // For embedded file loading, get the wasm binary data and pass it to esbuild's built-in `binary` loader
            build.onLoad({ filter: /.*/, namespace: WASM_EMBEDDED_NAMESPACE }, async (args) => ({
                contents: await fs.promises.readFile(args.path),
                loader: 'binary'
            }));
        }
    };
}

export { wasmLoader, wasmLoader as default };
