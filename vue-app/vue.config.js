module.exports = {
    configureWebpack: {
        resolve: {
            symlinks: false
        }
    },
    devServer: {
        // host:'0.0.0.0',
        port: 8999
    },
    transpileDependencies: [
        /\bvue-awesome\b/
    ]
}