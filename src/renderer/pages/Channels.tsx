import { useState, useEffect } from 'react'

interface Channel {
  id: string
  name: string
  type: 'wechat' | 'telegram' | 'discord' | 'signal' | 'unknown'
  status: 'online' | 'offline' | 'pending'
  target?: string
  lastActive?: string
}

function Channels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [testMessage, setTestMessage] = useState('这是一条测试消息')
  const [selectedChannel, setSelectedChannel] = useState<string>('')

  // 获取频道列表
  const fetchChannels = async () => {
    setLoading(true)
    try {
      const result = await window.electron.channels.list()
      if (result.success) {
        // 解析频道列表输出（简化处理）
        const lines = result.output.split('\n').filter(line => line.trim())
        const parsedChannels: Channel[] = lines.map((line, index) => ({
          id: `channel-${index}`,
          name: line.split(/\s+/)[0] || 'Unknown',
          type: 'wechat',
          status: 'online',
          target: line.split(/\s+/)[1] || '',
          lastActive: new Date().toLocaleString('zh-CN'),
        }))
        
        // 如果没有频道，添加示例数据
        if (parsedChannels.length === 0) {
          parsedChannels.push({
            id: 'channel-wechat',
            name: '微信',
            type: 'wechat',
            status: 'online',
            target: 'o9cq8063cMIvGnwoV91_zNWzQ3j4@im.wechat',
            lastActive: new Date().toLocaleString('zh-CN'),
          })
        }
        
        setChannels(parsedChannels)
        setLogs(prev => [...prev, `✅ 获取到 ${parsedChannels.length} 个频道`])
        
        // 自动选择第一个频道
        if (parsedChannels.length > 0 && !selectedChannel) {
          setSelectedChannel(parsedChannels[0].target || '')
        }
      } else {
        setLogs(prev => [...prev, `❌ 获取失败：${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
    setLoading(false)
  }

  // 获取频道状态
  const fetchChannelStatus = async () => {
    try {
      const result = await window.electron.channels.status()
      if (result.success) {
        setLogs(prev => [...prev, '✅ 频道状态检查完成'])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
  }

  // 发送测试消息
  const sendTestMessage = async () => {
    if (!selectedChannel) {
      setLogs(prev => [...prev, '❌ 请先选择一个频道'])
      return
    }
    
    setLoading(true)
    setLogs(prev => [...prev, `📤 正在发送测试消息到 ${selectedChannel}...`])
    
    try {
      const result = await window.electron.channels.testMessage(
        'openclaw-weixin',
        selectedChannel,
        testMessage
      )
      if (result.success) {
        setLogs(prev => [...prev, '✅ 测试消息发送成功'])
      } else {
        setLogs(prev => [...prev, `❌ 发送失败：${result.error || result.output}`])
      }
    } catch (err) {
      setLogs(prev => [...prev, `❌ 错误：${err instanceof Error ? err.message : String(err)}`])
    }
    setLoading(false)
  }

  // 初始化加载
  useEffect(() => {
    fetchChannels()
    fetchChannelStatus()
  }, [])

  const getChannelIcon = (type: Channel['type']) => {
    switch (type) {
      case 'wechat': return '💬'
      case 'telegram': return '✈️'
      case 'discord': return '🎮'
      case 'signal': return '📱'
      default: return '📺'
    }
  }

  const getStatusBadge = (status: Channel['status']) => {
    switch (status) {
      case 'online':
        return { bg: '#f6ffed', border: '#b7eb8f', color: '#52c41a', text: '🟢 在线' }
      case 'offline':
        return { bg: '#f5f5f5', border: '#d9d9d9', color: '#999', text: '⚪ 离线' }
      case 'pending':
        return { bg: '#fff7e6', border: '#ffd591', color: '#fa8c16', text: '🟡 待确认' }
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>📺 频道管理</h2>

      {/* 频道列表 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#666' }}>已登录频道</h3>
          <button
            onClick={fetchChannels}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
            }}
          >
            🔄 刷新
          </button>
        </div>

        {channels.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            background: '#f5f5f5',
            borderRadius: '8px',
            color: '#999',
          }}>
            <p style={{ fontSize: '16px' }}>📭 暂无已登录的频道</p>
            <p style={{ fontSize: '13px', marginTop: '10px' }}>
              使用 OpenClaw CLI 配置新频道
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {channels.map((channel) => {
              const badge = getStatusBadge(channel.status)
              return (
                <div
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.target || '')}
                  style={{
                    padding: '15px',
                    background: selectedChannel === channel.target ? '#e6f7ff' : '#fff',
                    border: `1px solid ${selectedChannel === channel.target ? '#1890ff' : '#e8e8e8'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                      width: '45px',
                      height: '45px',
                      background: '#f0f2f5',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                    }}>
                      {getChannelIcon(channel.type)}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{channel.name}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                        {channel.target}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    padding: '5px 12px',
                    background: badge.bg,
                    border: `1px solid ${badge.border}`,
                    borderRadius: '4px',
                    color: badge.color,
                    fontSize: '13px',
                  }}>
                    {badge.text}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 测试消息 */}
      <div style={{
        padding: '20px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
        marginBottom: '20px',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>📤 发送测试消息</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
            选择频道：
          </label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.target || ''}>
                {channel.name} ({channel.target})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#666' }}>
            消息内容：
          </label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>

        <button
          onClick={sendTestMessage}
          disabled={loading || !selectedChannel}
          style={{
            padding: '10px 20px',
            background: '#52c41a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || !selectedChannel) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          📤 发送测试
        </button>
      </div>

      {/* 配置指南 */}
      <div style={{
        padding: '20px',
        background: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e8e8e8',
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>📖 配置新频道</h3>
        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
          <p style={{ margin: '0 0 10px 0' }}>使用 OpenClaw CLI 配置新频道：</p>
          <code style={{
            display: 'block',
            background: '#1e1e1e',
            color: '#d4d4d4',
            padding: '15px',
            borderRadius: '4px',
            fontFamily: 'Consolas, monospace',
            fontSize: '12px',
            overflowX: 'auto',
          }}>
            openclaw channels add --channel wechat<br/>
            openclaw channels add --channel telegram<br/>
            openclaw channels add --channel discord
          </code>
          <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#999' }}>
            💡 配置完成后点击「刷新」按钮更新列表
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

export default Channels
