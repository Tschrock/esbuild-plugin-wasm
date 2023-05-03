esbuild-plugin-wasm
===================

An asynchronous `.wasm` file loader for [esbuild](https://esbuild.github.io/). This allows you to directly import `.wasm` files as if they were a javascript module, similar to how it works in Webpack.

This plugin follows the [WebAssembly/ES Module Integration](https://github.com/WebAssembly/esm-integration) proposal for loading WebAssembly from a JavaScript import statement.

## Requirements
- esbuild >= 0.11.0
- node >= 10.0.0

### ⚠️ Important Note ⚠️

This loader makes use of top-level await, which only has partial support in esbuild. For now, it is only supported with the `esm` output format, not the `iife` or `cjs` formats. See https://github.com/evanw/esbuild/issues/253

## Installation

```
npm install --save-dev esbuild-plugin-wasm
```

or

```
yarn add --dev esbuild-plugin-wasm
```

## Usage
1. Add it to your esbuild plugins list

    <details>
    <summary>CommonJS</summary>

    ```js
    // build.js
    const esbuild = require('esbuild')
    const { wasmLoader } = require('esbuild-plugin-wasm')

    esbuild.build({
    ...
    plugins: [
        wasmLoader()
    ]
    ...
    });
    ```

    </details>

    <details>
    <summary>ESM</summary>

    ```js
    // build.js
    import esbuild from 'esbuild'
    import { wasmLoader } from 'esbuild-plugin-wasm'

    esbuild.build({
    ...
    plugins: [
        wasmLoader()
    ]
    ...
    });
    ```

    </details>

    <details>
    <summary>Typescript</summary>

    ```ts
    // build.ts
    import esbuild from 'esbuild'
    import { wasmLoader } from 'esbuild-plugin-wasm'

    esbuild.build({
    ...
    plugins: [
        wasmLoader()
    ]
    ...
    });
    ```

    </details>


2. Then import ad use your wasm in your project


    <details>
    <summary>CommonJS</summary>

    ```js
    // app.js
    const wasm = require("./lib.wasm");

    console(wasm.add(1, 2));
    ```

    </details>

    <details>
    <summary>ESM</summary>

    ```js
    // app.js
    import wasm from "./lib.wasm";

    console(wasm.add(1, 2));
    ```

    </details>

    <details>
    <summary>Typescript</summary>

    ```ts
    // app.ts
    import wasm from "./lib.wasm";

    console(wasm.add(1, 2));
    ```

    </details>


## Configuration

```ts
wasmLoader({
    // (Default) Deferred mode copies the WASM binary to the output directory,
    // and then `fetch()`s it at runtime. This is the default mode.
    mode: 'deferred'

    // Embedded mode embeds the WASM binary in the javascript bundle as a
    // base64 string. Note this will greatly bloat the resulting bundle
    // (the binary will take up about 30% more space this way)
    mode: 'embedded'
})
```
