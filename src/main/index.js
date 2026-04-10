const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')

let mainWindow

function createWindow() {
  const isPackaged = app.isPackaged
  const preloadPath = isPackaged
    ? path.join(process.resourcesPath, 'app', 'src', 'preload', 'index.js')
    : path.join(__dirname, '../../preload/index.js')
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
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
    const appPath = app.getAppPath()
    let indexPath
    
    // 尝试多个可能的路径
    const possiblePaths = [
      path.join(appPath, 'dist', 'index.html'),
      path.join(path.dirname(appPath), 'dist', 'index.html'),
      path.join(process.resourcesPath, 'app', 'dist', 'index.html'),
    ]
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        indexPath = p
        break
      }
    }
    
    if (indexPath) {
      mainWindow.loadFile(indexPath)
    } else {
      console.error('Could not find index.html in any of:', possiblePaths)
    }
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

// ============ 节点管理 ============

// 获取配对码
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

// 刷新配对码
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

// 获取节点列表
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

// ============ 频道管理 ============

// 获取频道列表
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

// 获取频道状态
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

// 发送测试消息
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

// ============ 技能管理 ============

// 获取已安装技能列表
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

// 浏览 ClawHub 技能
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

// 安装技能
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

// 卸载技能
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

// 技能安全扫描
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

// 更新技能
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

// ============ 会话管理 ============

// 获取会话列表
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

// 创建新会话
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

// 删除会话
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

// 获取会话历史
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

// ============ 系统信息 ============

// 获取 OpenClaw 版本
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

// 获取系统信息
ipcMain.handle('system:info', async () => {
  const os = require('os')
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

// 获取 CPU 和内存使用率
ipcMain.handle('system:usage', async () => {
  const os = require('os')
  const cpus = os.cpus()
  
  // CPU 使用率（简化计算）
  let totalIdle = 0
  let totalTick = 0
  for (const cpu of cpus) {
    totalIdle += cpu.times.idle
    totalTick += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq
  }
  const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100)
  
  // 内存使用率
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
