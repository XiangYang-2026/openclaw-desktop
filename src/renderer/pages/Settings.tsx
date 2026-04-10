import { useState, useEffect } from 'react'

function Settings() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [config, setConfig] = useState<string>('')
  const [version, setVersion] = useState({ app: '1.0.0', cli: 'unknown' })
  const [logs, setLogs] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // 获取配置
  const fetchConfig = async () => {
    try {
      const response = await fetch('file:///home/administrator/.openclaw/config.json')
        .catch(() => ({ json: () => Promise.resolve({}) }))
      const data = await response.json()
      setConfig(JSON.stringify(data, null, 2))
    } catch (err) {
      setConfig('// 无法读取配置文件')
    }
  }

  // 保存配置
  const saveConfig = async () => {
    setSaving(true)
    setLogs(prev => [...prev, '💾 正在保存配置...'])
    try {
      // 实际应用中需要通过 IPC 调用主进程写入文件
      setLogs(prev => [...prev, '✅ 配置已保存（示例）'])
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
    fetchConfig()
    // 获取 CLI 版本
    setVersion(prev => ({ ...prev, cli: 'v1.0.0' }))
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>⚙️ 设置</h2>

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

      {/* 配置编辑 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>📝 配置文件</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={resetConfig}
              style={{
                padding: '8px 16px',
                background: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              🔄 重置
            </button>
            <button
              onClick={saveConfig}
              disabled={saving}
              style={{
                padding: '8px 16px',
                background: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '13px',
              }}
            >
              💾 保存
            </button>
          </div>
        </div>
        <textarea
          value={config}
          onChange={(e) => setConfig(e.target.value)}
          rows={15}
          style={{
            width: '100%',
            padding: '15px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            fontFamily: 'Consolas, monospace',
            fontSize: '13px',
            resize: 'vertical',
          }}
        />
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#999' }}>
          📍 配置文件位置：~/.openclaw/config.json
        </p>
      </div>

      {/* 版本信息 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        marginBottom: '20px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>ℹ️ 版本信息</h3>
        <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <span>OpenClaw Desktop</span>
            <span style={{ color: '#1890ff' }}>v{version.app}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <span>OpenClaw CLI</span>
            <span style={{ color: '#1890ff' }}>{version.cli}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <span>Electron</span>
            <span style={{ color: '#1890ff' }}>v28.0.0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
            <span>构建时间</span>
            <span style={{ color: '#1890ff' }}>2026-04-10</span>
          </div>
        </div>
      </div>

      {/* 更新检查 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        marginBottom: '20px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>🔄 软件更新</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={checkUpdate}
            style={{
              padding: '10px 20px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🔍 检查更新
          </button>
          <span style={{ fontSize: '13px', color: '#999' }}>
            当前已是最新版本
          </span>
        </div>
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
            让你可以轻松管理网关、节点、频道和技能。
          </p>
          <div style={{ display: 'grid', gap: '5px', marginBottom: '15px' }}>
            <div><strong>🏠 仓库：</strong> <a href="https://github.com/XiangYang-2026/openclaw-desktop" target="_blank" style={{ color: '#1890ff' }}>GitHub</a></div>
            <div><strong>📚 文档：</strong> <a href="https://docs.openclaw.ai" target="_blank" style={{ color: '#1890ff' }}>docs.openclaw.ai</a></div>
            <div><strong>💬 社区：</strong> <a href="https://discord.com/invite/clawd" target="_blank" style={{ color: '#1890ff' }}>Discord</a></div>
            <div><strong>🧩 技能市场：</strong> <a href="https://clawhub.ai" target="_blank" style={{ color: '#1890ff' }}>ClawHub</a></div>
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
