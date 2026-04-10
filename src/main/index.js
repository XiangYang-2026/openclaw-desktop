const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')

let mainWindow
let openClawPath = null

// ============ 跨平台 OpenClaw 检测 ============

function detectOpenClaw() {
  const platform = process.platform
  const pathsToTry = []
  
  if (platform === 'win32') {
    // Windows
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    pathsToTry.push(
      path.join(appData, 'npm', 'openclaw.cmd'),
      path.join('C:', 'Users', os.userInfo().username, 'AppData', 'Roaming', 'npm', 'openclaw.cmd'),
      'openclaw.cmd',
      'openclaw'
    )
  } else if (platform === 'darwin') {
    // macOS
    pathsToTry.push(
      '/usr/local/bin/openclaw',
      '/opt/homebrew/bin/openclaw',
      path.join(os.homedir(), '.nvm', 'versions', 'node', 'current', 'bin', 'openclaw'),
      'openclaw'
    )
  } else {
    // Linux / WSL
    pathsToTry.push(
      '/usr/local/bin/openclaw',
      '/usr/bin/openclaw',
      path.join(os.homedir(), '.nvm', 'versions', 'node', 'current', 'bin', 'openclaw'),
      'openclaw'
    )
  }
  
  // 尝试每个路径
  for (const p of pathsToTry) {
    try {
      const { execSync } = require('child_process')
      execSync(`${p} --version`, { stdio: 'ignore' })
      console.log('OpenClaw found at:', p)
      return p
    } catch (e) {
      // 继续尝试下一个
    }
  }
  
  console.warn('OpenClaw not found, using default command')
  return platform === 'win32' ? 'openclaw.cmd' : 'openclaw'
}

// ============ 窗口创建 ============

function createWindow() {
  const appPath = app.getAppPath()
  
  // 开发模式 vs 生产模式
  const isDev = process.env.VITE_DEV_SERVER_URL
  
  // 生产模式：从 resources/app/dist 加载
  // 开发模式：从项目根目录/dist 加载
  const preloadPath = isDev
    ? path.join(__dirname, '../preload/index.js')
    : path.join(appPath, 'src', 'preload', 'index.js')
  
  const distPath = isDev
    ? path.join(__dirname, '../dist/index.html')
    : path.join(appPath, 'dist', 'index.html')
  
  console.log('App path:', appPath)
  console.log('Is dev:', isDev)
  console.log('Preload path:', preloadPath)
  console.log('Preload exists:', fs.existsSync(preloadPath))
  console.log('Dist path:', distPath)
  console.log('Dist exists:', fs.existsSync(distPath))
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(distPath)
  }
}

app.whenReady().then(() => {
  openClawPath = detectOpenClaw()
  console.log('Using OpenClaw at:', openClawPath)
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ============ OpenClaw CLI 封装 ============

function runOpenClawCommand(args, callback) {
  const cmd = openClawPath || (process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw')
  console.log('Running command:', cmd, args.join(' '))
  
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
    console.error('Process error:', err)
    if (callback) callback('error', err.message)
  })

  return proc
}

// ============ IPC Handlers ============

// 网关状态
ipcMain.handle('gateway:status', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['gateway', 'status'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

// 网关启动
ipcMain.handle('gateway:start', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['gateway', 'start'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

// 网关停止
ipcMain.handle('gateway:stop', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['gateway', 'stop'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

// 系统状态
ipcMain.handle('system:status', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['status'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

// 节点管理
ipcMain.handle('nodes:pairingCode', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['node', 'pairing-code'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('nodes:refreshPairing', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['node', 'pairing-code', '--refresh'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('nodes:list', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['node', 'list'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

// 频道管理
ipcMain.handle('channels:list', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['channels', 'list'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('channels:status', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['channels', 'status'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('channels:testMessage', async (event, { channel, target, message }) => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    const args = ['message', 'send', '--channel', channel, '--target', target, '--message', message]
    runOpenClawCommand(args, (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

// 技能管理
ipcMain.handle('skills:list', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['skills', 'list'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('skills:browse', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['skills', 'browse'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('skills:install', async (event, { skillName }) => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['skills', 'install', skillName], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('skills:uninstall', async (event, { skillName }) => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['skills', 'uninstall', skillName], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('skills:scan', async (event, { skillName }) => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['skills', 'scan', skillName], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('skills:update', async (event, { skillName }) => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    const args = skillName ? ['skills', 'update', skillName] : ['skills', 'update']
    runOpenClawCommand(args, (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

// 会话管理
ipcMain.handle('sessions:list', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['sessions', 'list'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('sessions:create', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['sessions', 'create'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('sessions:delete', async (event, { sessionId }) => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['sessions', 'delete', sessionId], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('sessions:history', async (event, { sessionId, limit = 50 }) => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['sessions', 'history', sessionId, '--limit', limit.toString()], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result, error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

// 系统信息
ipcMain.handle('system:openclawVersion', async () => {
  return new Promise((resolve) => {
    let result = ''
    let errorResult = ''
    runOpenClawCommand(['--version'], (type, data) => {
      if (type === 'close') {
        resolve({ success: data.code === 0, output: result.trim(), error: errorResult })
      } else if (type === 'output') {
        result += data
      } else if (type === 'error') {
        errorResult += data
      }
    })
  })
})

ipcMain.handle('system:info', async () => {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
    freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
    hostname: os.hostname(),
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    cpuCores: os.cpus().length,
  }
})

ipcMain.handle('system:usage', async () => {
  const cpus = os.cpus()
  let totalIdle = 0
  let totalTick = 0
  for (const cpu of cpus) {
    totalIdle += cpu.times.idle
    totalTick += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq
  }
  const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100)
  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100)
  return {
    cpuUsage,
    memUsage,
    freeMemory: Math.round(freeMem / 1024 / 1024 / 1024),
    totalMemory: Math.round(totalMem / 1024 / 1024 / 1024),
  }
})

console.log('OpenClaw Desktop Main Process Started')