// 关键点1: 不设置node resolve plugin, 避免后续第三方js入口误引入第三方依赖, 保证zero dep
// 关键点2: 输出iife, 当前线上已经使用了iife, 无法退回esm了, 只能将错就错, 长期iife
// 关键点3: 不要有hash, 不要有缓存, 确保第三方js可以实时通过协商缓存更新
// 关键点4: sdk代码比较简单, 没有引入polyfill, 如果打entry级别polyfill 输出内容会比较大

import path from 'node:path';
import url from 'node:url';

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
