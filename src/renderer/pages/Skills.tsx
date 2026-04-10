import { useState, useEffect } from 'react'

interface Skill {
  id: string
  name: string
  version: string
  description: string
  author: string
  installed: boolean
  hasUpdate?: boolean
  category?: string
}

function Skills() {
  const [activeTab, setActiveTab] = useState<'installed' | 'browse'>('installed')
  const [installedSkills, setInstalledSkills] = useState<Skill[]>([])
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const fetchInstalledSkills = async () => {
    setLoading(true)
    try {
      const result = await window.electron.skills.list()
      const lines = result.output.split('\n').filter(line => line.trim())
      const skills: Skill[] = lines.length > 0 ? lines.map((line, i) => ({
        id: `skill-${i}`, name: line.split(/\s+/)[0], version: '1.0.0',
        description: '本地技能', author: 'Unknown', installed: true,
      })) : [
        { id: '1', name: 'browser-automation', version: '1.0.1', description: '浏览器自动化', author: 'OpenClaw', installed: true, category: 'automation' },
        { id: '2', name: 'multi-search-engine', version: '2.0.1', description: '多搜索引擎', author: 'OpenClaw', installed: true, category: 'search' },
        { id: '3', name: 'summarize', version: '1.0.0', description: '文档总结', author: 'OpenClaw', installed: true, category: 'productivity' },
      ]
      setInstalledSkills(skills)
    } catch (err) { setLogs(prev => [...prev, `❌ ${err instanceof Error ? err.message : String(err)}`]) }
    setLoading(false)
  }

  const fetchAvailableSkills = async () => {
    setLoading(true)
    try {
      const result = await window.electron.skills.browse()
      const skills: Skill[] = [
        { id: 'a', name: 'flux-image', version: '1.0.0', description: 'FLUX AI 图片生成', author: 'OpenClaw', installed: false, category: 'media' },
        { id: 'b', name: 'ffmpeg-cli', version: '1.0.0', description: 'FFmpeg 视频处理', author: 'OpenClaw', installed: installedSkills.some(s => s.name === 'ffmpeg-cli'), category: 'media' },
        { id: 'c', name: 'pdf-ocr', version: '1.0.0', description: 'PDF 转 Word', author: 'OpenClaw', installed: false, category: 'document' },
        { id: 'd', name: 'weather', version: '1.0.0', description: '天气预报', author: 'OpenClaw', installed: false, category: 'utility' },
        { id: 'e', name: 'skill-guard', version: '1.0.0', description: '安全扫描', author: 'OpenClaw', installed: false, category: 'security' },
      ]
      setAvailableSkills(skills)
    } catch (err) { setLogs(prev => [...prev, `❌ ${err instanceof Error ? err.message : String(err)}`]) }
    setLoading(false)
  }

  const installSkill = async (name: string) => {
    setLoading(true)
    setLogs(prev => [...prev, `📥 安装 ${name}...`])
    try {
      const r = await window.electron.skills.install(name)
      setLogs(prev => [...prev, r.success ? `✅ ${name} 安装成功` : `❌ ${r.error || r.output}`])
      fetchInstalledSkills(); fetchAvailableSkills()
    } catch (err) { setLogs(prev => [...prev, `❌ ${err instanceof Error ? err.message : String(err)}`]) }
    setLoading(false)
  }

  const uninstallSkill = async (name: string) => {
    if (!confirm(`确定卸载 ${name}?`)) return
    setLoading(true)
    setLogs(prev => [...prev, `🗑️ 卸载 ${name}...`])
    try {
      const r = await window.electron.skills.uninstall(name)
      setLogs(prev => [...prev, r.success ? `✅ ${name} 已卸载` : `❌ ${r.error || r.output}`])
      fetchInstalledSkills(); fetchAvailableSkills()
    } catch (err) { setLogs(prev => [...prev, `❌ ${err instanceof Error ? err.message : String(err)}`]) }
    setLoading(false)
  }

  const scanSkill = async (name: string) => {
    setLoading(true)
    setLogs(prev => [...prev, `🔍 扫描 ${name}...`])
    try {
      const r = await window.electron.skills.scan(name)
      setLogs(prev => [...prev, r.success ? `✅ 扫描通过` : `⚠️ ${r.error || r.output}`])
    } catch (err) { setLogs(prev => [...prev, `❌ ${err instanceof Error ? err.message : String(err)}`]) }
    setLoading(false)
  }

  const updateSkill = async (name?: string) => {
    setLoading(true)
    setLogs(prev => [...prev, `🔄 更新${name ? ` ${name}` : '全部'}...`])
    try {
      const r = await window.electron.skills.update(name)
      setLogs(prev => [...prev, r.success ? '✅ 更新完成' : `❌ ${r.error || r.output}`])
      fetchInstalledSkills(); fetchAvailableSkills()
    } catch (err) { setLogs(prev => [...prev, `❌ ${err instanceof Error ? err.message : String(err)}`]) }
    setLoading(false)
  }

  useEffect(() => { fetchInstalledSkills() }, [])
  useEffect(() => { if (activeTab === 'browse') fetchAvailableSkills() }, [activeTab])

  const filter = (skills: Skill[]) => skills.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const catColor = (c?: string) => {
    const map: Record<string, any> = {
      automation: { bg: '#e6f7ff', text: '#1890ff' }, search: { bg: '#f6ffed', text: '#52c41a' },
      media: { bg: '#fff7e6', text: '#fa8c16' }, document: { bg: '#f9f0ff', text: '#722ed1' },
      security: { bg: '#fff1f0', text: '#ff4d4f' },
    }
    return map[c || ''] || { bg: '#f5f5f5', text: '#666' }
  }

  const SkillCard = ({ skill, showAction }: { skill: Skill, showAction: 'install' | 'uninstall' | 'scan' }) => {
    const c = catColor(skill.category)
    return (
      <div style={{ padding: '15px', border: '1px solid #e8e8e8', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <h4 style={{ margin: 0, fontSize: '16px' }}>{skill.name}</h4>
            <span style={{ fontSize: '12px', padding: '2px 8px', background: c.bg, color: c.text, borderRadius: '4px' }}>{skill.category || 'other'}</span>
            <span style={{ fontSize: '12px', color: '#999' }}>v{skill.version}</span>
          </div>
          <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>{skill.description}</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>作者：{skill.author}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {showAction === 'install' && !skill.installed && (
            <button onClick={() => installSkill(skill.name)} disabled={loading}
              style={{ padding: '6px 12px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
              📥 安装
            </button>
          )}
          {showAction === 'uninstall' && (
            <>
              <button onClick={() => scanSkill(skill.name)} disabled={loading}
                style={{ padding: '6px 12px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                🔍 扫描
              </button>
              <button onClick={() => uninstallSkill(skill.name)} disabled={loading}
                style={{ padding: '6px 12px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
                🗑️ 卸载
              </button>
            </>
          )}
          {showAction === 'scan' && (
            <button onClick={() => scanSkill(skill.name)} disabled={loading}
              style={{ padding: '6px 12px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '12px' }}>
              🔍 扫描
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>🧩 技能管理</h2>

      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button onClick={() => setActiveTab('installed')}
            style={{ padding: '10px 20px', marginRight: '10px', background: activeTab === 'installed' ? '#1890ff' : '#f0f0f0', color: activeTab === 'installed' ? '#fff' : '#333', border: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer', fontSize: '14px' }}>
            ✅ 已安装 ({installedSkills.length})
          </button>
          <button onClick={() => setActiveTab('browse')}
            style={{ padding: '10px 20px', background: activeTab === 'browse' ? '#1890ff' : '#f0f0f0', color: activeTab === 'browse' ? '#fff' : '#333', border: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer', fontSize: '14px' }}>
            🌐 ClawHub
          </button>
        </div>
        {activeTab === 'installed' && (
          <button onClick={() => updateSkill()} disabled={loading}
            style={{ padding: '8px 16px', background: '#52c41a', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px' }}>
            🔄 更新全部
          </button>
        )}
      </div>

      <input type="text" placeholder="搜索技能..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '100%', padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px', marginBottom: '20px' }} />

      <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e8e8e8', minHeight: '400px' }}>
        {activeTab === 'installed' ? (
          filter(installedSkills).length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>📭 暂无已安装技能</div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>{filter(installedSkills).map(s => <SkillCard key={s.id} skill={s} showAction="uninstall" />)}</div>
          )
        ) : (
          filter(availableSkills).length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>🌐 暂无可用技能</div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>{filter(availableSkills).map(s => <SkillCard key={s.id} skill={s} showAction="install" />)}</div>
          )
        )}
      </div>

      <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '15px', borderRadius: '8px', fontFamily: 'Consolas', fontSize: '13px', minHeight: '150px', marginTop: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#569cd6' }}>📋 操作日志</h3>
        {logs.length === 0 ? <p style={{ color: '#6a9955' }}>暂无日志</p> : logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}

export default Skills
