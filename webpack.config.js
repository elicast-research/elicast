const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
    editor: './src/editor.js',
    player: './src/player.js'
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common'
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/assets/index.html'
    }),
    new HtmlWebpackPlugin({
      chunks: ['editor', 'common'],
      filename: 'editor.html',
      template: 'src/assets/editor.html'
    }),
    new HtmlWebpackPlugin({
      chunks: ['player', 'common'],
      filename: 'player.html',
      template: 'src/assets/player.html'
    })
  ]
};
