
const
    path = require('path'),
    webpack = require('webpack');
//    terser = require('terser-webpack-plugin');

const config = {
  entry: './src/scripts/build.js',
  mode: 'production',
  output: {
    path: path.resolve(__dirname, 'docs/build/'),
    filename: 'rmr-map.bundle.js'
  },
  plugins : [
//     new terser({
//       extractComments: false,
//       test: /\.js(\?.*)?$/i
//     })
  ],
  watch: true,
  module: {
    rules: [
//       {
//         test: /\.js$/,
//         use: [{
//           loader: 'babel-loader',
//           options: {
//             presets: [
//             ['es2015' ]
//             ]
//           }
//         }]
//       }
    ]
  }
};

module.exports = config;
