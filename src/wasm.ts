import fs from 'fs';

export interface WasmMetadata {
    imports: WebAssembly.ModuleImportDescriptor[];
    exports: WebAssembly.ModuleExportDescriptor[];
}

/**
 * Gets metadata for a WASM binary.
 * @param path The path to the WASM binary.
 * @returns Metadata for the WASM binary.
 */
export async function getWasmMetadata(path: string): Promise<WasmMetadata> {
    const module = await WebAssembly.compile(await fs.promises.readFile(path));
    return {
        imports: WebAssembly.Module.imports(module),
        exports: WebAssembly.Module.exports(module)
    }
}
