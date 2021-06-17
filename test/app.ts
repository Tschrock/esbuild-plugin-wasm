/* eslint-disable @typescript-eslint/no-var-requires */

// Since we need to build as esm but run as cjs, external modules need to be dynamically required
const { expect } = require('chai');

import { add, addToNumber } from './wasm/basic.wasm';

describe('basic.wasm', () => {
    it('should add two numbers', () => {
        const result = add(12, 34);
        expect(result).to.equal(46);
    })
    it('should get the number and add to it', () => {
        const result = addToNumber(3);
        expect(result).to.equal(45);
    })
})
