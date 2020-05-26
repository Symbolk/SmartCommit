const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
// const path = require('path')
const npmPackage = require('./package.json')
module.exports = {
  // entry: './main.js',
  // output: {
  //   path: path.resolve(__dirname, 'dist'),
  //   filename: 'app.js'
  // },
  // module: {
  //   rules: [{
  //     test: /\.css$/,
  //     use: ['style-loader', 'css-loader']
  //   }]
  // },
  plugins: [
    new MonacoWebpackPlugin({
      // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
      languages: ['javascript', 'css', 'html', 'typescript', 'json']
    })
  ],
  externals: [
    ...Object.keys(npmPackage.dependencies),
    "require('simple-git/promise')"
  ]
  // externals: {
  //   'simple-git/promise': "require('simple-git/promise')"
  // }
}
