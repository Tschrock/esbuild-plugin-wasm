/* eslint-disable @typescript-eslint/no-var-requires */
import { promises as fs } from 'fs'
import path from 'path'

import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised';
import * as esbuild from 'esbuild'

import { wasmLoader } from '../src'
import type { Mode } from '../src'

chai.use(chaiAsPromised);

function doBuild(mode: Mode, format: esbuild.Format, platform: esbuild.Platform, outfile: string) {
    return esbuild.build({
        entryPoints: ['./test/app.ts'],
        bundle: true,
        outfile,
        plugins: [wasmLoader({ mode })],
        format,
        platform,
        external: ['chai'],
        assetNames: 'assets/[name]-[hash]',
        logLevel: 'silent'
    })
}

const originalFetch = fetch
function monkeypatchFetch() {
    globalThis.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
        if (typeof url === 'string' && url.startsWith('file://')) {
            url = new URL(url)
        }
        if (url instanceof URL && url.protocol === 'file:') {
            const filePath = path.resolve('./dist-test/', url.pathname)
            return new Response(
                await fs.readFile(filePath),
                url.pathname.endsWith('.wasm') ? {
                    headers: { 'Content-Type': 'application/wasm' }
                } : {}
            )
        }
        return originalFetch(url, init)
    }
}

function restoreFetch() {
    globalThis.fetch = originalFetch
}

describe('esbuild', () => {
    it("should bundle without errors ('embedded', 'esm', 'browser')", async () => {
        const results = await doBuild('embedded', 'esm', 'browser', './dist-test/app-browser-embedded.mjs')
        expect(results.errors).to.be.empty;
        expect(results.warnings).to.be.empty;
    })
    it("should bundle without errors ('deferred', 'esm', 'browser')", async () => {
        const results = await doBuild('deferred', 'esm', 'browser', './dist-test/app-browser-deferred.mjs')
        expect(results.errors).to.be.empty;
        expect(results.warnings).to.be.empty;
    })
    it("should bundle without errors ('embedded', 'esm', 'node')", async () => {
        const results = await doBuild('embedded', 'esm', 'node', './dist-test/app-node-embedded.mjs')
        expect(results.errors).to.be.empty;
        expect(results.warnings).to.be.empty;
    })
    it("should bundle without errors ('deferred', 'esm', 'node')", async () => {
        const results = await doBuild('deferred', 'esm', 'node', './dist-test/app-node-deferred.mjs')
        expect(results.errors).to.be.empty;
        expect(results.warnings).to.be.empty;
    })

    it("should complain about TLA ('embedded', 'cjs', 'browser')", async () => {
        const build = doBuild('embedded', 'cjs', 'browser', './dist-test/app-browser-embedded.cjs')
        return expect(build).to.be.rejectedWith('Top-level await is currently not supported with the "cjs" output format')
    })
    it("should complain about TLA ('deferred', 'cjs', 'browser')", async () => {
        const build = doBuild('deferred', 'cjs', 'browser', './dist-test/app-browser-deferred.cjs')
        return expect(build).to.be.rejectedWith('Top-level await is currently not supported with the "cjs" output format')
    })
    it("should complain about TLA ('embedded', 'cjs', 'node')", async () => {
        const build = doBuild('embedded', 'cjs', 'node', './dist-test/app-node-embedded.cjs')
        return expect(build).to.be.rejectedWith('Top-level await is currently not supported with the "cjs" output format')
    })
    it("should complain about TLA ('deferred', 'cjs', 'node')", async () => {
        const build = doBuild('deferred', 'cjs', 'node', './dist-test/app-node-deferred.cjs')
        return expect(build).to.be.rejectedWith('Top-level await is currently not supported with the "cjs" output format')
    })

    it("should complain about TLA ('embedded', 'iife', 'browser')", async () => {
        const build = doBuild('embedded', 'iife', 'browser', './dist-test/app-browser-embedded-iife.cjs')
        return expect(build).to.be.rejectedWith('Top-level await is currently not supported with the "iife" output format')
    })
    it("should complain about TLA ('deferred', 'iife', 'browser')", async () => {
        const build = doBuild('deferred', 'iife', 'browser', './dist-test/app-browser-deferred-iife.cjs')
        return expect(build).to.be.rejectedWith('Top-level await is currently not supported with the "iife" output format')
    })
    it("should complain about TLA ('embedded', 'iife', 'node')", async () => {
        const build = doBuild('embedded', 'iife', 'node', './dist-test/app-node-embedded-iife.cjs')
        return expect(build).to.be.rejectedWith('Top-level await is currently not supported with the "iife" output format')
    })
    it("should complain about TLA ('deferred', 'iife', 'node')", async () => {
        const build = doBuild('deferred', 'iife', 'node', './dist-test/app-node-deferred-iife.cjs')
        return expect(build).to.be.rejectedWith('Top-level await is currently not supported with the "iife" output format')
    })

    after(async () => {
        const { test: testBrowserEmbedded } = await eval("import('../dist-test/app-node-embedded.mjs')");
        await testBrowserEmbedded('node-embedded');

        const { test: testNodeDeferred } = await eval("import('../dist-test/app-node-deferred.mjs')");
        await testNodeDeferred('node-deferred');

        const { test: testNodeEmbedded } = await eval("import('../dist-test/app-browser-embedded.mjs')");
        await testNodeEmbedded('browser-embedded');

        monkeypatchFetch()

        const { test: testBrowserDeferred } = await eval("import('../dist-test/app-browser-deferred.mjs')");
        await testBrowserDeferred('browser-deferred');

        restoreFetch()
    });
})
