import { useState, useEffect } from 'react'

function App() {
  const [gatewayStatus, setGatewayStatus] = useState<string>('未检查')
  const [systemStatus, setSystemStatus] = useState<string>('未检查')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  // 检查网关状态
  const checkGatewayStatus = async () => {
    setLoading(true)
    try {
      const result = await window.electron.gateway.status()
      setGatewayStatus(result.success ? '✅ 运行中' : `❌ ${result.error || result.output}`)
    } catch (err) {
      setGatewayStatus(`❌ 错误：${err instanceof Error ? err.message : String(err)}`)
    }
    setLoading(false)
  }

  // 启动网关
  const startGateway = async () => {
    setLogs(prev => [...prev, '🚀 正在启动网关...'])
    try {
      const result = await window.electron.gateway.start()
      if (result.success) {
        setLogs(prev => [...prev, '✅ 网关启动成功'])
        checkGatewayStatus()
      } else {
        setLogs(prev => [...prev, `❌ 启动失败：${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
  }

  // 停止网关
  const stopGateway = async () => {
    setLogs(prev => [...prev, '🛑 正在停止网关...'])
    try {
      const result = await window.electron.gateway.stop()
      if (result.success) {
        setLogs(prev => [...prev, '✅ 网关已停止'])
        checkGatewayStatus()
      } else {
        setLogs(prev => [...prev, `❌ 停止失败：${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
  }

  // 检查系统状态
  const checkSystemStatus = async () => {
    setLoading(true)
    try {
      const result = await window.electron.system.status()
      setSystemStatus(result.success ? '✅ 正常' : `⚠️ ${result.output}`)
    } catch (err) {
      setSystemStatus(`❌ 错误：${err instanceof Error ? err.message : String(err)}`)
    }
    setLoading(false)
  }

  // 初始化加载
  useEffect(() => {
    checkGatewayStatus()
    checkSystemStatus()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '30px' }}>🦞 OpenClaw Desktop</h1>

      {/* 状态卡片 */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{
          flex: 1,
          padding: '20px',
          background: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>网关状态</h3>
          <p style={{ fontSize: '18px', margin: 0 }}>{gatewayStatus}</p>
        </div>

        <div style={{
          flex: 1,
          padding: '20px',
          background: '#f5f5f5',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>系统状态</h3>
          <p style={{ fontSize: '18px', margin: 0 }}>{systemStatus}</p>
        </div>
      </div>

      {/* 控制按钮 */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={startGateway}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#52c41a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          🚀 启动网关
        </button>

        <button
          onClick={stopGateway}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: '#ff4d4f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          🛑 停止网关
        </button>

        <button
          onClick={checkGatewayStatus}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          🔄 刷新状态
        </button>
      </div>

      {/* 日志输出 */}
      <div style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Consolas, monospace',
        fontSize: '13px',
        minHeight: '200px',
        maxHeight: '400px',
        overflowY: 'auto',
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#569cd6' }}>📋 操作日志</h3>
        {logs.length === 0 ? (
          <p style={{ color: '#6a9955' }}>暂无日志</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '5px' }}>{log}</div>
          ))
        )}
      </div>
    </div>
  )
}

export default App
