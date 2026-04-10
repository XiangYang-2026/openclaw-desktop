const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 开发模式加载 Vite 服务器
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    // 生产模式加载构建文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ============ OpenClaw CLI 封装 ============

function runOpenClawCommand(args, callback) {
  // Windows 下需要 .cmd 后缀
  const cmd = process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw'
  const proc = spawn(cmd, args, {
    shell: true,
    env: { ...process.env },
  })

  let output = ''
  let errorOutput = ''

  proc.stdout.on('data', (data) => {
    const text = data.toString()
    output += text
    if (callback) callback('output', text)
  })

  proc.stderr.on('data', (data) => {
    const text = data.toString()
    errorOutput += text
    if (callback) callback('error', text)
  })

  proc.on('close', (code) => {
    if (callback) callback('close', { code, output, error: errorOutput })
  })

  proc.on('error', (err) => {
    if (callback) callback('error', err.message)
  })

  return proc
}

// ============ IPC  handlers ============

// 网关状态
ipcMain.handle('gateway:status', async () => {
  return new Promise((resolve) => {
    let result = ''
    runOpenClawCommand(['gateway', 'status'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: data.error })
      } else if (type === 'output') {
        result += data
      }
    })
  })
})

// 网关启动
ipcMain.handle('gateway:start', async () => {
  return new Promise((resolve) => {
    let result = ''
    runOpenClawCommand(['gateway', 'start'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: data.error })
      } else if (type === 'output') {
        result += data
      }
    })
  })
})

// 网关停止
ipcMain.handle('gateway:stop', async () => {
  return new Promise((resolve) => {
    let result = ''
    runOpenClawCommand(['gateway', 'stop'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: data.error })
      } else if (type === 'output') {
        result += data
      }
    })
  })
})

// 通用命令执行（支持实时输出）
ipcMain.on('command:exec', (event, { commandId, args }) => {
  runOpenClawCommand(args, (type, data) => {
    event.reply(`command:${commandId}`, { type, data })
  })
})

// 系统状态
ipcMain.handle('system:status', async () => {
  return new Promise((resolve) => {
    let result = ''
    runOpenClawCommand(['status'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: data.error })
      } else if (type === 'output') {
        result += data
      }
    })
  })
})

console.log('OpenClaw Desktop Main Process Started')
