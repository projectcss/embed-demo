import {babel} from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

const pluginConfig = [
    babel({
        babelHelpers: 'bundled',
        presets: [
            '@babel/preset-env',
            '@babel/preset-typescript'
        ],
        plugins: [
            ['@babel/plugin-proposal-decorators', {version: '2023-11'}]
        ],
        targets: ['chrome >= 80', 'firefox >= 80', 'Safari >= 16'],
        extensions: ['.ts']
    }),
    terser()
];

/** @type {import('rollup').RollupOptions} */
const config = [
    {
        input: './sdk.ts',
        output: [
            {
                dir: './output',
                format: 'iife',
                sourcemap: false
            }
        ],
        plugins: pluginConfig
    },
];

export default config;
