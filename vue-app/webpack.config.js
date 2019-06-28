const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
// const path = require('path')
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
    ]
};