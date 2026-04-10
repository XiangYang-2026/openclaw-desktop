import { useState, useEffect } from 'react'

interface Session {
  id: string
  label?: string
  createdAt: string
  lastActivity?: string
}

function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])

  // 获取会话列表
  const fetchSessions = async () => {
    setLoading(true)
    try {
      const result = await window.electron.sessions.list()
      if (result.success) {
        // 解析会话列表（简化处理）
        const lines = result.output.split('\n').filter(line => line.trim())
        const parsed = lines.map((line, i) => ({
          id: `session-${i}`,
          label: line.trim(),
          createdAt: new Date().toISOString(),
        }))
        setSessions(parsed.length > 0 ? parsed : [])
        setLogs(prev => [...prev, '✅ 会话列表已加载'])
      } else {
        setLogs(prev => [...prev, `⚠️ ${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
    setLoading(false)
  }

  // 创建新会话
  const createSession = async () => {
    setLogs(prev => [...prev, '➕ 正在创建新会话...'])
    try {
      const result = await window.electron.sessions.create()
      if (result.success) {
        setLogs(prev => [...prev, '✅ 新会话已创建'])
        fetchSessions()
      } else {
        setLogs(prev => [...prev, `❌ 创建失败：${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
  }

  // 删除会话
  const deleteSession = async (sessionId: string) => {
    if (!confirm('确定删除此会话吗？')) return
    setLogs(prev => [...prev, `🗑️ 正在删除会话 ${sessionId}...`])
    try {
      const result = await window.electron.sessions.delete({ sessionId })
      if (result.success) {
        setLogs(prev => [...prev, '✅ 会话已删除'])
        fetchSessions()
      } else {
        setLogs(prev => [...prev, `❌ 删除失败：${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
  }

  // 查看会话历史
  const viewHistory = async (sessionId: string) => {
    setSelectedSession(sessionId)
    setLogs(prev => [...prev, `📖 正在加载会话历史...`])
    try {
      const result = await window.electron.sessions.history({ sessionId, limit: 50 })
      if (result.success) {
        setHistory(result.output.split('\n'))
        setLogs(prev => [...prev, '✅ 会话历史已加载'])
      } else {
        setLogs(prev => [...prev, `⚠️ ${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>💬 会话管理</h2>

      {/* 操作按钮 */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={createSession}
          style={{
            padding: '10px 20px',
            background: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            marginRight: '10px',
          }}
        >
          ➕ 创建新会话
        </button>
        <button
          onClick={fetchSessions}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#52c41a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          🔄 刷新列表
        </button>
      </div>

      {/* 会话列表 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        marginBottom: '20px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
          📋 会话列表 {sessions.length > 0 && `(${sessions.length}个)`}
        </h3>
        {sessions.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
            暂无会话，点击"创建新会话"开始
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                style={{
                  padding: '15px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    {session.label || session.id}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    创建时间：{new Date(session.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => viewHistory(session.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#1890ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    📖 查看历史
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 会话历史 */}
      {selectedSession && (
        <div style={{
          padding: '20px',
          background: '#fff',
          borderRadius: '8px',
          border: '1px solid #e8e8e8',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              📜 会话历史 - {selectedSession}
            </h3>
            <button
              onClick={() => { setSelectedSession(null); setHistory([]) }}
              style={{
                padding: '6px 12px',
                background: '#f0f0f0',
                color: '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ✕ 关闭
            </button>
          </div>
          <div style={{
            background: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            maxHeight: '400px',
            overflow: 'auto',
            fontFamily: 'Consolas, monospace',
            fontSize: '13px',
          }}>
            {history.length === 0 ? (
              <p style={{ color: '#999' }}>暂无历史记录</p>
            ) : (
              history.map((line, i) => <div key={i}>{line}</div>)
            )}
          </div>
        </div>
      )}

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

export default Sessions
