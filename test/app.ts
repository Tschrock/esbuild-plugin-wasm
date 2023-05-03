import { expect } from 'chai';
import { add, addToNumber } from './wasm/basic.wasm';

export function test(method: string) {
    describe(`${method} basic.wasm`, () => {
        it('should add two numbers', () => {
            const result = add(12, 34);
            expect(result).to.equal(46);
        })
        it('should get the number and add to it', () => {
            const result = addToNumber(3);
            expect(result).to.equal(45);
        })
    })
}
