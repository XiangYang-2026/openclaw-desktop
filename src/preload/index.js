const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electron', {
  // 网关操作
  gateway: {
    status: () => ipcRenderer.invoke('gateway:status'),
    start: () => ipcRenderer.invoke('gateway:start'),
    stop: () => ipcRenderer.invoke('gateway:stop'),
  },
  
  // 系统操作
  system: {
    status: () => ipcRenderer.invoke('system:status'),
    info: () => ipcRenderer.invoke('system:info'),
    usage: () => ipcRenderer.invoke('system:usage'),
    openclawVersion: () => ipcRenderer.invoke('system:openclawVersion'),
  },
  
  // 节点管理
  nodes: {
    pairingCode: () => ipcRenderer.invoke('nodes:pairingCode'),
    refreshPairing: () => ipcRenderer.invoke('nodes:refreshPairing'),
    list: () => ipcRenderer.invoke('nodes:list'),
  },
  
  // 频道管理
  channels: {
    list: () => ipcRenderer.invoke('channels:list'),
    status: () => ipcRenderer.invoke('channels:status'),
    testMessage: (channel, target, message) => ipcRenderer.invoke('channels:testMessage', { channel, target, message }),
  },
  
  // 技能管理
  skills: {
    list: () => ipcRenderer.invoke('skills:list'),
    browse: () => ipcRenderer.invoke('skills:browse'),
    install: (skillName) => ipcRenderer.invoke('skills:install', { skillName }),
    uninstall: (skillName) => ipcRenderer.invoke('skills:uninstall', { skillName }),
    scan: (skillName) => ipcRenderer.invoke('skills:scan', { skillName }),
    update: (skillName) => ipcRenderer.invoke('skills:update', { skillName }),
  },
  
  // 通用命令执行（支持实时输出）
  command: {
    exec: (args, callbacks) => {
      const commandId = Date.now().toString()
      
      ipcRenderer.on(`command:${commandId}`, (event, message) => {
        if (message.type === 'output' && callbacks.onOutput) {
          callbacks.onOutput(message.data)
        } else if (message.type === 'error' && callbacks.onError) {
          callbacks.onError(message.data)
        } else if (message.type === 'close' && callbacks.onClose) {
          callbacks.onClose(message.data)
        }
      })
      
      ipcRenderer.send('command:exec', { commandId, args })
      
      // 返回取消函数
      return () => {
        ipcRenderer.removeAllListeners(`command:${commandId}`)
      }
    },
  },
  
  // 会话管理
  sessions: {
    list: () => ipcRenderer.invoke('sessions:list'),
    create: () => ipcRenderer.invoke('sessions:create'),
    delete: (sessionId) => ipcRenderer.invoke('sessions:delete', { sessionId }),
    history: (sessionId, limit) => ipcRenderer.invoke('sessions:history', { sessionId, limit }),
  },
  
  // 平台信息
  platform: process.platform,
})

console.log('Preload script loaded')
