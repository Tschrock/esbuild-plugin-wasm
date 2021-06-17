import { expect } from 'chai';
import * as esbuild from 'esbuild';
import wasmLoader from "../src";


describe('esbuild', () => {
    it('should bundle the wasm module without errors', async () => {
        const results = await esbuild.build({
            entryPoints: ['./test/app.ts'],
            bundle: true,
            outfile: './dist-test/app.js',
            plugins: [
                wasmLoader({ mode: 'embedded' })
            ],
            format: 'esm',
            external: ['chai'],
            banner: { 'js': 'exports.test = async function test() {' },
            footer: { 'js': '}' },
        });
        expect(results.errors).to.be.empty;
        expect(results.warnings).to.be.empty;
    })
    after(async () => {
        const { test } = require('../dist-test/app');
        await test();
    });
})
