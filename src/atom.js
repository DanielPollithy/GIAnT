//const spawn = require('child_process').spawn;
//const server = spawn('node', [app.getAppPath() + '/src/server.js'], { cwd: app.getAppPath() });

var server = require('./server');
var log = require('electron-log');

function main() {

}

const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
console.log(app.getAppPath())

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
  if (process.platform !== 'darwin') {
    app.exit();
    //server.kill('SIGINT');
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

server.run();

/*
server.stdout.on('data', (data) => {
  var data = data.toString();
  if (data.includes('READY')) {
      log.info('reload window');
      win.loadURL(url.format({
        pathname: path.join('localhost:4000'),
        protocol: 'http:',
        slashes: true
      }));
  }
  console.log(data.toString());
})

server.stderr.on('data', (data) => {
  console.log(data.toString());
})

server.on('close', (code) => {
  if (code) {
    code = code.toString();
  }
  log.info('child process exited with code ' + code);
}) */
