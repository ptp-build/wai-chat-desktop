const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'src/assets'),
        to: path.resolve(__dirname, '.webpack/main/assets'),
      },
      {
        from: path.resolve(__dirname, 'src/js'),
        to: path.resolve(__dirname, '.webpack/main/js'),
      },
    ],
  }),
];
