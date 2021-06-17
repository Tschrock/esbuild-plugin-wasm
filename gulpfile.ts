import del from 'del';
import * as esbuild from 'esbuild';
import Mocha from 'mocha';

import gulp, { TaskFunctionCallback } from 'gulp';
import gulp_typescript from 'gulp-typescript';

/**
 * Cleans the build directories
 */
 export function clean() {
    return del([
        "./dist",
        "./dist-test"
    ])
}
clean.description = 'Cleans the build directories';

/**
 * Bundles the plugin.
 */
export function bundle() {
    return esbuild.build({
        entryPoints: ['./src/index.js'],
        bundle: true,
        minify: true,
        outfile: './dist/index.js',
        format: 'cjs',
        platform: 'node',
        target: 'node10'
    })
}
clean.description = 'Bundles the plugin';

/**
 * Generates type definitions for the plugin.
 */
export function types() {
    const project = gulp_typescript.createProject('tsconfig.json');
    return project.src()
        .pipe(project())
        .pipe(gulp.dest('dist'));
}
clean.description = 'Generates type definitions for the plugin';

/**
 * Runs tests
 */
export function test(done: TaskFunctionCallback) {
    const mocha = new Mocha();
    mocha.addFile('./test/test.ts');
    mocha.run((failCount) => {
        if(failCount) {
            done(new Error(`${failCount} tests failed.`));
        }
        else {
            done();
        }
    })
}
test.description = 'Runs tests';

export const build = gulp.series(clean, gulp.parallel(bundle, types));
export default build;
