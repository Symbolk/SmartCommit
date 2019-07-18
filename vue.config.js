const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
  configureWebpack: {
    resolve: {
      symlinks: false
    },
    plugins: [
      new MonacoWebpackPlugin({
        // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
        languages: ['javascript', 'css', 'html', 'typescript', 'json']
      })
    ]
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
          buildResources: 'assets'
        },
        extraFiles: [
          'git-sc'
        ],
        compression: 'maximum',
        nsis: {
          oneClick: false,
          perMachine: false,
          allowToChangeInstallationDirectory: true,
          displayLanguageSelector: true,
          // only run with command
          createDesktopShortcut: false,
          createStartMenuShortcut: false
        }
      }
    }
  }
}
