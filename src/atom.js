/**
* The cross platform electron interface: This is the main entry file for the desktop application.
* <br>
* It controls: <br>
* 1) the electron app <br>
* 2) And the server <br>
*
* We use electron-log to write logs to the hard drive. Uncaught exceptions are finally caught here.
* <br>
* After creating the Electron Window, this file starts the SERVER!
*

* @class Atom
*/


var process = require('process');
var log = require('electron-log');

process.on('uncaughtException', function(err) {
  log.error((err && err.stack) ? err.stack : err);
});

var server = require('./server');
var database = require('./database');

const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
log.info(app.getAppPath())

// var server = require(app.getAppPath() + '/src/server');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600});
  log.info('Electron window opened');

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join('localhost:4000'),
    protocol: 'http:',
    slashes: true
  }));

  // Open the DevTools.
  // win.webContents.openDevTools();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
      log.info('window closed');
      win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
    log.info('Electron windows closed');
    database.logout();
    app.exit();
  //if (process.platform !== 'darwin') {
    //server.kill('SIGINT');
  //}
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
});

// Start the server
server.run();