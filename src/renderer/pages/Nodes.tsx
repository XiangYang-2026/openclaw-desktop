import { useState, useEffect } from 'react'

interface Node {
  id: string
  name: string
  type: string
  status: 'online' | 'offline' | 'unknown'
  lastSeen?: string
}

function Nodes() {
  const [pairingCode, setPairingCode] = useState<string>('')
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'pairing' | 'list'>('pairing')

  // 获取配对码
  const fetchPairingCode = async () => {
    setLoading(true)
    try {
      const result = await window.electron.nodes.pairingCode()
      if (result.success) {
        setPairingCode(result.output)
        setLogs(prev => [...prev, '✅ 配对码获取成功'])
      } else {
        setLogs(prev => [...prev, `❌ 获取失败：${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
    setLoading(false)
  }

  // 刷新配对码
  const refreshPairingCode = async () => {
    setLogs(prev => [...prev, '🔄 正在刷新配对码...'])
    try {
      const result = await window.electron.nodes.refreshPairing()
      if (result.success) {
        setPairingCode(result.output)
        setLogs(prev => [...prev, '✅ 配对码已刷新'])
        fetchPairingCode()
      } else {
        setLogs(prev => [...prev, `❌ 刷新失败：${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
  }

  // 获取节点列表
  const fetchNodes = async () => {
    setLoading(true)
    try {
      const result = await window.electron.nodes.list()
      if (result.success) {
        // 解析节点列表输出（简化处理）
        const lines = result.output.split('\n').filter(line => line.trim())
        const parsedNodes: Node[] = lines.map((line, index) => ({
          id: `node-${index}`,
          name: line.split(/\s+/)[0] || 'Unknown',
          type: 'mobile',
          status: 'unknown',
          lastSeen: new Date().toLocaleString('zh-CN'),
        }))
        setNodes(parsedNodes)
        setLogs(prev => [...prev, `✅ 获取到 ${parsedNodes.length} 个节点`])
      } else {
        setLogs(prev => [...prev, `❌ 获取失败：${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
    setLoading(false)
  }

  // 初始化加载
  useEffect(() => {
    fetchPairingCode()
    fetchNodes()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>📱 节点管理</h2>

      {/* 标签页切换 */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('pairing')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: activeTab === 'pairing' ? '#1890ff' : '#f0f0f0',
            color: activeTab === 'pairing' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🔗 设备配对
        </button>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'list' ? '#1890ff' : '#f0f0f0',
            color: activeTab === 'list' ? '#fff' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          📋 节点列表
        </button>
      </div>

      {/* 配对码页面 */}
      {activeTab === 'pairing' && (
        <div>
          <div style={{
            background: '#f5f5f5',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px',
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>📲 扫码配对设备</h3>
            
            {/* 二维码区域（占位） */}
            <div style={{
              width: '200px',
              height: '200px',
              margin: '0 auto 20px',
              background: '#fff',
              border: '2px solid #ddd',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#999',
            }}>
              {pairingCode ? (
                <div style={{ fontSize: '12px', wordBreak: 'break-all', padding: '10px' }}>
                  配对码：<br/>
                  <strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    {pairingCode.substring(0, 50)}...
                  </strong>
                </div>
              ) : (
                '加载中...'
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={refreshPairingCode}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  marginRight: '10px',
                }}
              >
                🔄 刷新配对码
              </button>
              <button
                onClick={fetchPairingCode}
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
                🔄 重新获取
              </button>
            </div>

            <div style={{
              fontSize: '13px',
              color: '#666',
              textAlign: 'left',
              background: '#fff',
              padding: '15px',
              borderRadius: '4px',
            }}>
              <h4 style={{ margin: '0 0 10px 0' }}>📋 配对步骤：</h4>
              <ol style={{ margin: 0, paddingLeft: '20px' }}>
                <li>在手机上打开 OpenClaw App</li>
                <li>点击「添加设备」或「扫码配对」</li>
                <li>扫描上方二维码 或 手动输入配对码</li>
                <li>确认配对信息，点击「允许」</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* 节点列表页面 */}
      {activeTab === 'list' && (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={fetchNodes}
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
              🔄 刷新列表
            </button>
          </div>

          {nodes.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              background: '#f5f5f5',
              borderRadius: '8px',
              color: '#999',
            }}>
              <p style={{ fontSize: '16px' }}>📭 暂无已配对的节点</p>
              <p style={{ fontSize: '13px', marginTop: '10px' }}>
                点击「设备配对」标签页添加新设备
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {nodes.map((node) => (
                <div
                  key={node.id}
                  style={{
                    padding: '20px',
                    background: '#fff',
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      background: '#1890ff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                    }}>
                      📱
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{node.name}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                        类型：{node.type} | 最后在线：{node.lastSeen}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    padding: '5px 12px',
                    background: node.status === 'online' ? '#f6ffed' : '#f5f5f5',
                    border: `1px solid ${node.status === 'online' ? '#b7eb8f' : '#d9d9d9'}`,
                    borderRadius: '4px',
                    color: node.status === 'online' ? '#52c41a' : '#999',
                    fontSize: '13px',
                  }}>
                    {node.status === 'online' ? '🟢 在线' : '⚪ 离线'}
                  </div>
                </div>
              ))}
            </div>
          )}
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
        minHeight: '150px',
        maxHeight: '200px',
        overflowY: 'auto',
        marginTop: '20px',
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

export default Nodes
