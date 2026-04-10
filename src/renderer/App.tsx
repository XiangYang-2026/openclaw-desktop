import { useState, useEffect } from 'react'
import Nodes from './pages/Nodes'
import Channels from './pages/Channels'
import Skills from './pages/Skills'
import Settings from './pages/Settings'
import Sessions from './pages/Sessions'

type Page = 'gateway' | 'nodes' | 'channels' | 'skills' | 'sessions' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('gateway')
  const [gatewayStatus, setGatewayStatus] = useState<string>('未检查')
  const [systemStatus, setSystemStatus] = useState<string>('未检查')
  const [loading, setLoading] = useState(false)

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

  // 渲染页面内容
  const renderPage = () => {
    switch (currentPage) {
      case 'gateway':
        return <GatewayPage 
          gatewayStatus={gatewayStatus} 
          systemStatus={systemStatus}
          loading={loading}
          setLoading={setLoading}
          checkGatewayStatus={checkGatewayStatus}
        />
      case 'nodes':
        return <Nodes />
      case 'channels':
        return <Channels />
      case 'skills':
        return <Skills />
      case 'sessions':
        return <Sessions />
      case 'settings':
        return <Settings />
      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* 侧边栏导航 */}
      <div style={{
        width: '220px',
        background: '#001529',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '0 20px 20px',
          borderBottom: '1px solid #002140',
          marginBottom: '20px',
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>🦞 OpenClaw</h1>
          <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#888' }}>Desktop</p>
        </div>

        <nav style={{ flex: 1 }}>
          <NavItem 
            icon="🏠" 
            label="网关管理" 
            active={currentPage === 'gateway'} 
            onClick={() => setCurrentPage('gateway')} 
          />
          <NavItem 
            icon="📱" 
            label="节点管理" 
            active={currentPage === 'nodes'} 
            onClick={() => setCurrentPage('nodes')} 
          />
          <NavItem 
            icon="📺" 
            label="频道管理" 
            active={currentPage === 'channels'} 
            onClick={() => setCurrentPage('channels')} 
          />
          <NavItem 
            icon="🧩" 
            label="技能管理" 
            active={currentPage === 'skills'} 
            onClick={() => setCurrentPage('skills')} 
          />
          <NavItem 
            icon="💬" 
            label="会话管理" 
            active={currentPage === 'sessions'} 
            onClick={() => setCurrentPage('sessions')} 
          />
          <NavItem 
            icon="⚙️" 
            label="设置" 
            active={currentPage === 'settings'} 
            onClick={() => setCurrentPage('settings')} 
          />
        </nav>

        <div style={{
          padding: '15px 20px',
          borderTop: '1px solid #002140',
          fontSize: '12px',
          color: '#888',
        }}>
          <div style={{ marginBottom: '5px' }}>网关：{gatewayStatus}</div>
          <div>系统：{systemStatus}</div>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f0f2f5' }}>
        {renderPage()}
      </div>
    </div>
  )
}

// 导航项组件
function NavItem({ icon, label, active, onClick, disabled }: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        padding: '12px 20px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? '#1890ff' : 'transparent',
        color: disabled ? '#444' : active ? '#fff' : '#aaa',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <span>{label}</span>
    </div>
  )
}

// 网关管理页面组件
function GatewayPage({ 
  gatewayStatus, 
  systemStatus, 
  loading, 
  setLoading,
  checkGatewayStatus,
}: {
  gatewayStatus: string
  systemStatus: string
  loading: boolean
  setLoading: (v: boolean) => void
  checkGatewayStatus: () => void
}) {
  const [logs, setLogs] = useState<string[]>([])

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

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>🏠 网关管理</h2>

      {/* 状态卡片 */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{
          flex: 1,
          padding: '20px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>网关状态</h3>
          <p style={{ fontSize: '18px', margin: 0 }}>{gatewayStatus}</p>
        </div>

        <div style={{
          flex: 1,
          padding: '20px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>系统状态</h3>
          <p style={{ fontSize: '18px', margin: 0 }}>{systemStatus}</p>
        </div>
      </div>

      {/* 控制按钮 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        marginBottom: '20px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>快速操作</h3>
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
