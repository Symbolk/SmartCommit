const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const optionDefinitions = [
    { name: 'repo', alias: 'r', type: String, defaultOption: "" }
    // { name: 'src', type: String, multiple: true, defaultOption: true },
    // { name: 'timeout', alias: 't', type: Number }
]
// const commandLineArgs = require('command-line-args')

function createWindow() {
    // BUG cannot parse args correctly from .exe, with commandLineArgs or minimist
    // var argv = require('minimist')(process.argv.slice(2));
    // const options = commandLineArgs(optionDefinitions) 
    // console.log(options.repo);

    const {
        width,
        height
    } = electron.screen.getPrimaryDisplay().workAreaSize

	// const width = 800, height =600
    let mainWindow = new BrowserWindow({
        width: width,
        height: height,
        webPreferences: {
            nodeIntegration: true
        }
    })
    mainWindow.maximize()
    // const {
    //     PythonShell
    // } = require("python-shell")

    // PythonShell.run(
    //     "ui/engine.py", null,
    //     function (err, results) {
    //         if (err) throw err
    //         console.log('flask running')
    //         console.log('results', results)
    //     }
    // )
    // PythonShell.run(
    //     "core/hello.py", null,
    //     function (err, results) {
    //         if (err) throw err
    //         console.log('hello.py running')
    //         console.log('results', results)
    //     }
    // )

    // mainWindow.setMenu(null);

    // load static file
    mainWindow.loadURL(`file://${__dirname}/index.html`)
    // win.loadFile("ui/templates/home.html")

    // load dynamicly rendered file
    // win.loadURL('http://127.0.0.1:5858/')

    // since it seems impossible to detect NODE_ENV in packaged app, therefore use development checking is more reasonable
    process.env.NODE_ENV == 'development' && mainWindow.webContents.openDevTools();
    mainWindow.on('closed', function () {
        mainWindow = null
    })
}


app.on("ready", createWindow)


app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})