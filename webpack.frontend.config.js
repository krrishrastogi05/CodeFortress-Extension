//@ts-check

'use strict';

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

/** @type {import('webpack').Configuration} */
module.exports = {
  target: 'web',
  entry: './src/webview/frontend/App.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'frontend.js'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.(tsx|ts)$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/webview/frontend/index.html', to: 'index.html' },
        { from: 'src/webview/frontend/app.css', to: 'app.css' },
        { from: 'node_modules/@vscode/codicons/dist/codicon.css', to: 'codicon.css' },
        { from: 'node_modules/@vscode/codicons/dist/codicon.ttf', to: 'codicon.ttf' }
      ]
    })
  ],
  devtool: false
};
