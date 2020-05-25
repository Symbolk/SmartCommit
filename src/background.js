'use strict'

const electron = require('electron')
const log = require('electron-log')
import * as path from 'path'
import { autoUpdater } from 'electron-updater'
import { app, protocol, BrowserWindow } from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
const isDevelopment = process.env.NODE_ENV !== 'production'
import * as Splashscreen from '@trodi/electron-splashscreen'

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
autoUpdater.logger.transports.console.level = false
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,
      standard: true
    }
  }
])

function createWindow() {
  // const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize

  // Create the browser window.
  // win = new BrowserWindow({
  //   width: width,
  //   height: height,
  //   webPreferences: {
  //     nodeIntegration: true
  //     // webSecurity: false
  //   }
  // })

  win.maximize()
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    // win.setMenu(null)
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('closed', () => {
    app.quit()
  })
}

// auto-updating events
autoUpdater.on('update-available', info => {
  console.log('Update available: ' + info.version)
})

autoUpdater.on('update-not-available', info => {
  console.log('Current is the latest version: ' + app.getVersion())
})

autoUpdater.on('error', err => {
  autoUpdater.logger.error('Error in auto-updater: ' + err)
})

autoUpdater.on('download-progress', progressObj => {
  console.log('Downloading the update...')
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  log_message =
    log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
  autoUpdater.logger.info(log_message)
})

autoUpdater.on('update-downloaded', info => {
  console.log('Update downloaded and will be installed after quitting.')
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  // show the splash screen
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize
  const windowOptions = {
    width: width,
    height: height,
    show: false,
    webPreferences: {
      nodeIntegration: true
      // webSecurity: false
    }
  }
  win = Splashscreen.initSplashScreen({
    windowOpts: windowOptions,
    templateUrl: path.join(__dirname, '..', 'assets/icon.svg'),
    // templateUrl: `${__dirname}/icon.svg`,
    // templateUrl: `file://${path.join(__dirname, "icon.svg")}`,
    delay: 0, // force show immediately since example will load fast
    minVisible: 1000, // show for 1.5s so example is obvious
    splashScreenOpts: {
      height: 250,
      width: 250,
      transparent: true
    }
  })
  // setTimeout(() => {win.close(); console.log("CLOSE")}, 2500)

  createWindow()
})

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
