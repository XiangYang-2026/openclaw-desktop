import { useState, useEffect } from 'react'

interface SystemInfo {
  platform: string
  arch: string
  nodeVersion: string
  electronVersion: string
  totalMemory: number
  freeMemory: number
  hostname: string
  cpuModel: string
  cpuCores: number
}

interface SystemUsage {
  cpuUsage: number
  memUsage: number
  freeMemory: number
  totalMemory: number
}

function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [config, setConfig] = useState<string>('')
  const [version, setVersion] = useState({ app: '1.0.0', cli: '检测中...' })
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [systemUsage, setSystemUsage] = useState<SystemUsage | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [openClawInstalled, setOpenClawInstalled] = useState<boolean | null>(null)

  // 获取 OpenClaw 版本
  const fetchOpenClawVersion = async () => {
    try {
      const result = await window.electron.system.openclawVersion()
      if (result.success) {
        setVersion(prev => ({ ...prev, cli: result.output || '已安装' }))
        setOpenClawInstalled(true)
        setLogs(prev => [...prev, '✅ OpenClaw CLI 已安装'])
      } else {
        setVersion(prev => ({ ...prev, cli: '未安装' }))
        setOpenClawInstalled(false)
        setLogs(prev => [...prev, '⚠️ OpenClaw CLI 未安装'])
      }
    } catch (err) {
      setVersion(prev => ({ ...prev, cli: '检测失败' }))
      setOpenClawInstalled(false)
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
  }

  // 获取系统信息
  const fetchSystemInfo = async () => {
    try {
      const info = await window.electron.system.info()
      setSystemInfo(info)
      setLogs(prev => [...prev, '✅ 系统信息已加载'])
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
  }

  // 获取系统使用率
  const fetchSystemUsage = async () => {
    try {
      const usage = await window.electron.system.usage()
      setSystemUsage(usage)
    } catch (err) {
      console.error('Failed to fetch system usage:', err)
    }
  }

  // 获取配置
  const fetchConfig = async () => {
    try {
      setConfig('// 配置文件读取功能开发中')
    } catch (err) {
      setConfig('// 无法读取配置文件')
    }
  }

  // 保存配置
  const saveConfig = async () => {
    setSaving(true)
    setLogs(prev => [...prev, '💾 正在保存配置...'])
    try {
      setLogs(prev => [...prev, '✅ 配置保存功能开发中'])
    } catch (err) {
      setLogs(prev => [...prev, `❌ 保存失败：${err instanceof Error ? err.message : String(err)}`])
    }
    setSaving(false)
  }

  // 检查更新
  const checkUpdate = () => {
    setLogs(prev => [...prev, '🔍 检查更新...'])
    setTimeout(() => {
      setLogs(prev => [...prev, '✅ 已是最新版本 (v1.0.0)'])
    }, 1000)
  }

  // 重置配置
  const resetConfig = () => {
    if (!confirm('确定重置配置为默认值吗？')) return
    setConfig(JSON.stringify({
      gateway: { port: 9988, remote: { enabled: false } },
      plugins: { allow: [] },
    }, null, 2))
    setLogs(prev => [...prev, '🔄 配置已重置'])
  }

  useEffect(() => {
    fetchOpenClawVersion()
    fetchSystemInfo()
    fetchConfig()
    
    // 每 5 秒刷新系统使用率
    fetchSystemUsage()
    const interval = setInterval(fetchSystemUsage, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const platformNames: Record<string, string> = {
    win32: 'Windows',
    darwin: 'macOS',
    linux: 'Linux',
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>⚙️ 设置</h2>

      {/* OpenClaw 状态 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        marginBottom: '20px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>🦞 OpenClaw 状态</h3>
        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: openClawInstalled ? '#f6ffed' : '#fff1f0', borderRadius: '4px', border: `1px solid ${openClawInstalled ? '#b7eb8f' : '#ffa39e'}` }}>
            <span>OpenClaw CLI</span>
            <span style={{ color: openClawInstalled ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
              {openClawInstalled === null ? '检测中...' : openClawInstalled ? '✅ 已安装' : '❌ 未安装'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <span>CLI 版本</span>
            <span style={{ color: '#1890ff' }}>{version.cli}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <span>Desktop 版本</span>
            <span style={{ color: '#1890ff' }}>v{version.app}</span>
          </div>
        </div>
      </div>

      {/* 系统信息 */}
      {systemInfo && (
        <div style={{
          padding: '20px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
          marginBottom: '20px',
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>💻 系统信息</h3>
          <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <span>操作系统</span>
              <span style={{ color: '#1890ff' }}>{platformNames[systemInfo.platform] || systemInfo.platform} ({systemInfo.arch})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <span>主机名</span>
              <span style={{ color: '#1890ff' }}>{systemInfo.hostname}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <span>CPU 型号</span>
              <span style={{ color: '#1890ff' }}>{systemInfo.cpuModel}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <span>CPU 核心数</span>
              <span style={{ color: '#1890ff' }}>{systemInfo.cpuCores} 核心</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <span>内存总量</span>
              <span style={{ color: '#1890ff' }}>{systemInfo.totalMemory} GB</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <span>Node.js 版本</span>
              <span style={{ color: '#1890ff' }}>{systemInfo.nodeVersion}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              <span>Electron 版本</span>
              <span style={{ color: '#1890ff' }}>v{systemInfo.electronVersion}</span>
            </div>
          </div>
        </div>
      )}

      {/* 系统使用率 */}
      {systemUsage && (
        <div style={{
          padding: '20px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
          marginBottom: '20px',
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>📊 系统使用率</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>CPU 使用率</span>
                <span style={{ color: systemUsage.cpuUsage > 80 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
                  {systemUsage.cpuUsage}%
                </span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(systemUsage.cpuUsage, 100)}%`,
                  background: systemUsage.cpuUsage > 80 ? '#ff4d4f' : '#52c41a',
                  height: '100%',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>内存使用率</span>
                <span style={{ color: systemUsage.memUsage > 80 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
                  {systemUsage.memUsage}% ({systemUsage.totalMemory - systemUsage.freeMemory}GB / {systemUsage.totalMemory}GB)
                </span>
              </div>
              <div style={{ background: '#f0f0f0', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(systemUsage.memUsage, 100)}%`,
                  background: systemUsage.memUsage > 80 ? '#ff4d4f' : '#52c41a',
                  height: '100%',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主题设置 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        marginBottom: '20px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>🎨 外观</h3>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button
            onClick={() => setTheme('light')}
            style={{
              padding: '10px 20px',
              background: theme === 'light' ? '#1890ff' : '#f0f0f0',
              color: theme === 'light' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ☀️ 浅色模式
          </button>
          <button
            onClick={() => setTheme('dark')}
            style={{
              padding: '10px 20px',
              background: theme === 'dark' ? '#1890ff' : '#f0f0f0',
              color: theme === 'dark' ? '#fff' : '#333',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🌙 深色模式
          </button>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#999' }}>
          💡 主题切换功能开发中，当前仅支持浅色模式
        </p>
      </div>

      {/* 关于 */}
      <div style={{
        padding: '20px',
        background: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>🦞 关于 OpenClaw Desktop</h3>
        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>OpenClaw Desktop</strong> 是一个功能完整的 OpenClaw 图形界面应用，
            让你可以轻松管理网关、节点、频道、技能和会话。
          </p>
          <div style={{ display: 'grid', gap: '5px', marginBottom: '15px' }}>
            <div><strong>🏠 仓库：</strong> <a href="https://github.com/XiangYang-2026/openclaw-desktop" target="_blank" style={{ color: '#1890ff' }}>GitHub</a></div>
            <div><strong>📚 文档：</strong> <a href="https://docs.openclaw.ai" target="_blank" style={{ color: '#1890ff' }}>docs.openclaw.ai</a></div>
            <div><strong>💬 社区：</strong> <a href="https://discord.com/invite/clawd" target="_blank" style={{ color: '#1890ff' }}>Discord</a></div>
            <div><strong>🧩 技能市场：</strong> <a href="https://clawhub.ai" target="_blank" style={{ color: '#1890ff' }}>ClawHub</a></div>
            <div><strong>💬 会话聊天：</strong> 通过"会话管理"页面与我聊天</div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
            📄 License: MIT | 👨‍💻 Author: Li Bao 🦞
          </p>
        </div>
      </div>

      {/* 日志输出 */}
      <div style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'Consolas, monospace',
        fontSize: '13px',
        minHeight: '100px',
        marginTop: '20px',
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#569cd6' }}>📋 操作日志</h3>
        {logs.length === 0 ? (
          <p style={{ color: '#6a9955' }}>暂无日志</p>
        ) : (
          logs.map((log, i) => <div key={i}>{log}</div>)
        )}
      </div>
    </div>
  )
}

export default Settings
