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
  transpileDependencies: [/\bvue-awesome\b/],
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: 'edu.pku.smartcommit',
        productName: 'SmartCommit',
        copyright: 'Copyright © 2019 Bo Shen',
        directories: {
          buildResources: 'build'
        }
      }
    }
  }
}
