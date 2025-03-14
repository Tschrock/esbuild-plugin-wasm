import { getWasmMetadata } from './wasm';

const json = JSON.stringify;
const importList = (module: string, identifiers: string[]) => `import { ${identifiers.join(', ')} } from ${json(module)};`;
const mapFn = <T extends unknown[], U>(items: Iterable<T>, callbackfn: (...args: T) => U, thisArg?: unknown) => Array.from(items).map(x => callbackfn.apply(thisArg, x));

/**
 * Generates JS module imports for a list of WASM exports.
 * @param identifier The variable to store the imports in.
 * @param exports A list of WASM imports.
 * @returns A string containing the generated import code.
 */
function generateWasmImports(identifier: string, wasmImports: WebAssembly.ModuleImportDescriptor[]) {
    // Group all the wasm imports by module
    const jsImports = new Map<string, string[]>();
    for (const wasmImport of wasmImports) {
        const jsImport = jsImports.get(wasmImport.module);
        if (jsImport) jsImport.push(wasmImport.name);
        else jsImports.set(wasmImport.module, [wasmImport.name])
    }

    // Build the template
    return `
        // Import from JS modules
        ${mapFn(jsImports, importList).join('\n')}

        // Build the WASM import object
        const ${identifier} = {
            ${mapFn(jsImports, (module, imports) => `[${json(module)}]: {
                ${imports.join(',\n')}
            }`).join(',\n')}
        };`;
}

/**
 * Generates JS module exports for a list of WASM exports.
 * @param identifier The identifier of the WASM exports object.
 * @param wasmExports A list of WASM exports.
 * @returns A string containing the generated export code.
 */
function generateWasmExports(identifier: string, wasmExports: WebAssembly.ModuleExportDescriptor[]) {
    return wasmExports.map(e => `export const ${e.name} = ${identifier}.${e.name};`).join('\n');
}

/**
 * Generates a JS module wrapper around a WASM file.
 * @param path The path to the WASM file.
 * @returns A string containing the generated module.
 */
export async function generateWasmModule(
    path: string,
    { platform, embed }: { platform?: string; embed?: boolean }
): Promise<string> {
    // Get the WASM metadata
    const { imports, exports } = await getWasmMetadata(path);

    // Build the template
    return `
        import wasmModule from ${JSON.stringify(path)};

        ${generateWasmImports('imports', imports)}

        async function loadWasm(module, imports) {
            ${
                embed
                    ? ''
                    : `if (typeof module === 'string') {

                // Resolve relative urls from the runtime script path
                if (module.startsWith('./') || module.startsWith('../')) {
                    module = new URL(module, import.meta.url).href
                }

                ${
                    platform === 'node'
                        ? `
                    // Special handling for file URLs outside the browser
                    if (module.startsWith('file://')) {
                        const fs = await import('fs')
                        module = await fs.promises.readFile(new URL(module))
                    } else {
                `
                        : ''
                }

                const moduleRequest = await fetch(module);
                if (typeof WebAssembly.instantiateStreaming === 'function') {
                    try {
                        return await WebAssembly.instantiateStreaming(moduleRequest, imports);
                    } catch (e) {
                        if (moduleRequest.headers.get('Content-Type') != 'application/wasm') {
                            console.warn(e);
                        } else {
                            throw e;
                        }
                    }
                }
                module = await moduleRequest.arrayBuffer();

                ${platform === 'node' ? '}' : ''}
            }`
            }
            return await WebAssembly.instantiate(module, imports);
        }

        export const { instance, module } = await loadWasm(wasmModule, imports);

        ${generateWasmExports('instance.exports', exports)}
    `;
}
