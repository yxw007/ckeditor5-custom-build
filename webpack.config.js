/**
 * @license Copyright (c) 2014-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

'use strict';

/* eslint-env node */

const path = require('path');
const webpack = require('webpack');
const { merge } = require("webpack-merge");
const { bundler, styles } = require('@ckeditor/ckeditor5-dev-utils');
const CKEditorWebpackPlugin = require('@ckeditor/ckeditor5-dev-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const FileManagerPlugin = require("filemanager-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const mode = process.argv.includes('--mode')
	? process.argv[process.argv.indexOf('--mode') + 1]
	: 'development';

const isDev = mode !== "production";
const cwdPath = process.cwd();

const automaticPlugins = isDev ? [new CKEditorWebpackPlugin({
	// UI language. Language codes follow the https://en.wikipedia.org/wiki/ISO_639-1 format.
	// When changing the built-in language, remember to also change it in the editor's configuration (src/ckeditor.js).
	language: 'en',
	additionalLanguages: ["zh-cn", "en-gb", "en-au"]
})] : [];

const config = merge({}, {
	mode: mode,
	devtool: 'source-map',
	performance: { hints: false },
	entry: path.resolve(__dirname, 'src', 'ckeditor.js'),
	output: {
		library: {
			type: "umd",
			name: "ClassicEditor"
		},
		path: path.resolve(__dirname, 'dist'),
		filename: 'index.js',
		// libraryTarget: 'umd',
		libraryExport: 'default'
	},

	optimization: {
		minimizer: [
			new TerserWebpackPlugin({
				sourceMap: isDev,
				terserOptions: {
					output: {
						// Preserve CKEditor 5 license comments.
						comments: /^!/
					}
				},
				extractComments: false
			})
		]
	},

	plugins: [
		new CleanWebpackPlugin({
			output: {
				path: path.join(cwdPath, "dist")
			}
		}),
		new CKEditorWebpackPlugin({
			// UI language. Language codes follow the https://en.wikipedia.org/wiki/ISO_639-1 format.
			// When changing the built-in language, remember to also change it in the editor's configuration (src/ckeditor.js).
			language: 'en',
			additionalLanguages: ["zh-cn", "en-gb", "en-au"]
		}),
		new webpack.BannerPlugin({
			banner: bundler.getLicenseBanner(),
			raw: true
		}),
		new FileManagerPlugin({
			events: {
				onEnd: {
					copy: [
						{ source: path.resolve(cwdPath, "src/styles.css"), destination: path.join(cwdPath, "dist/styles.css") }
					]
				}
			}
		})
	],

	module: {
		rules: [
			{
				test: /\.svg$/,
				use: ['raw-loader']
			},
			{
				test: /\.css$/,
				use: [
					{
						loader: 'style-loader',
						options: {
							injectType: 'singletonStyleTag',
							attributes: {
								'data-cke': true
							}
						}
					},
					{
						loader: 'css-loader'
					},
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: styles.getPostCssConfig({
								themeImporter: {
									themePath: require.resolve('@ckeditor/ckeditor5-theme-lark')
								},
								minify: true
							})
						}
					},
				]
			}
		]
	}
});

if (isDev) {
	config.plugins.splice(1, 0, new HtmlWebpackPlugin({
		template: path.resolve(cwdPath, "playground/index.html"),
		inject: "head",
		scriptLoading: "blocking"
	}));
}

module.exports = config;
