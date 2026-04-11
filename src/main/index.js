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

// 获取操作系统详细信息
function getOSInfo() {
  const platform = process.platform
  const release = os.release()
  
  if (platform === 'win32') {
    // Windows 版本检测
    const { execSync } = require('child_process')
    try {
      const output = execSync('wmic os get Caption,Version /format:list', { encoding: 'utf8' })
      const lines = output.split('\r\n')
      let caption = 'Windows'
      let version = ''
      for (const line of lines) {
        if (line.startsWith('Caption=')) {
          caption = line.substring(8)
        } else if (line.startsWith('Version=')) {
          version = line.substring(8)
        }
      }
      return `${caption} ${version}`
    } catch (e) {
      return `Windows ${release}`
    }
  } else if (platform === 'darwin') {
    // macOS 版本检测
    const { execSync } = require('child_process')
    try {
      const output = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim()
      const macosVersions = {
        '14': 'Sonoma',
        '13': 'Ventura',
        '12': 'Monterey',
        '11': 'Big Sur',
        '10.15': 'Catalina',
        '10.14': 'Mojave',
        '10.13': 'High Sierra',
      }
      const majorVersion = output.split('.')[0] + '.' + (output.split('.')[1] || '0')
      const codename = macosVersions[majorVersion] || macosVersions[majorVersion.split('.')[0]] || ''
      return `macOS ${codename ? codename + ' ' : ''}${output}`
    } catch (e) {
      return `macOS ${release}`
    }
  } else {
    // Linux 版本检测
    const { execSync } = require('child_process')
    try {
      const output = execSync('cat /etc/os-release', { encoding: 'utf8' })
      const lines = output.split('\n')
      let name = 'Linux'
      let version = ''
      for (const line of lines) {
        if (line.startsWith('PRETTY_NAME=')) {
          return line.substring(12).replace(/"/g, '')
        } else if (line.startsWith('NAME=')) {
          name = line.substring(5).replace(/"/g, '')
        } else if (line.startsWith('VERSION=')) {
          version = line.substring(8).replace(/"/g, '')
        }
      }
      return version ? `${name} ${version}` : name
    } catch (e) {
      return `Linux ${release}`
    }
  }
}

// 获取 OpenClaw 安装路径
function getOpenClawInstallPath() {
  const platform = process.platform
  const { execSync } = require('child_process')
  
  try {
    // 使用 npm list 查找全局安装路径
    const output = execSync('npm list -g openclaw', { encoding: 'utf8' })
    const match = output.match(/-> openclaw@([\d.]+)/)
    if (match) {
      if (platform === 'win32') {
        const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
        return path.join(appData, 'npm', 'node_modules', 'openclaw')
      } else {
        return '/usr/local/lib/node_modules/openclaw'
      }
    }
  } catch (e) {
    // npm list 失败，尝试其他方法
  }
  
  // 备用方法：检查常见安装路径
  const pathsToTry = [
    path.join(os.homedir(), '.nvm', 'versions', 'node', 'current', 'lib', 'node_modules', 'openclaw'),
    path.join(os.homedir(), '.nvm', 'versions', 'node', process.version, 'lib', 'node_modules', 'openclaw'),
    '/usr/local/lib/node_modules/openclaw',
    '/usr/lib/node_modules/openclaw',
  ]
  
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
    pathsToTry.unshift(path.join(appData, 'npm', 'node_modules', 'openclaw'))
  }
  
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      return p
    }
  }
  
  // 如果都找不到，返回当前使用的命令路径
  if (openClawPath && !openClawPath.includes(' ')) {
    try {
      const realPath = fs.realpathSync(openClawPath)
      return path.dirname(realPath)
    } catch (e) {
      // 忽略错误
    }
  }
  
  return '未知（未找到安装路径）'
}

// 系统状态（增强版）
ipcMain.handle('system:status', async () => {
  const osInfo = getOSInfo()
  const installPath = getOpenClawInstallPath()
  
  // 检查网关状态
  const gatewayResult = await new Promise((resolve) => {
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
  
  return {
    success: true,
    osInfo,
    installPath,
    gatewayRunning: gatewayResult.success,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
  }
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