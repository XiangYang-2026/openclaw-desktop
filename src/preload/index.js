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
  
  // 平台信息
  platform: process.platform,
})

console.log('Preload script loaded')
