import { useState, useEffect } from 'react'

interface Skill {
  id: string; name: string; version: string; description: string; author: string
  installed: boolean; builtin: boolean; hasUpdate?: boolean; category?: string
  downloads?: number; help?: string; createdAt?: string
}

const BUILTIN_SKILLS: Omit<Skill, 'id' | 'installed'>[] = [
  { name: 'healthcheck', version: '1.0.0', description: 'OpenClaw 健康检查和安全审计', author: 'OpenClaw', builtin: true, category: 'system', help: '用法：openclaw doctor\n功能：检查网关状态、配置有效性、系统健康度' },
  { name: 'node-connect', version: '1.0.0', description: '节点连接诊断（Android/iOS/macOS）', author: 'OpenClaw', builtin: true, category: 'system', help: '用法：openclaw nodes diagnose\n功能：诊断节点配对失败、QR 码 setup 问题' },
  { name: 'skill-creator', version: '1.0.0', description: '技能创建和编辑工具', author: 'OpenClaw', builtin: true, category: 'dev', help: '用法：openclaw skills create <name>\n功能：创建新技能、编辑 SKILL.md' },
  { name: 'summarize', version: '1.0.0', description: 'URL/文件总结（PDF、图片、音频、YouTube）', author: 'OpenClaw', builtin: true, category: 'productivity', help: '用法：summarize <url|file>\n功能：提取网页内容、总结文档' },
  { name: 'weather', version: '1.0.0', description: '天气预报（wttr.in / Open-Meteo）', author: 'OpenClaw', builtin: true, category: 'utility', help: '用法：weather <city>\n功能：获取当前天气和预报' },
  { name: 'ffmpeg-cli', version: '1.0.0', description: 'FFmpeg 视频/音频处理', author: 'OpenClaw', builtin: true, category: 'media', help: '用法：ffmpeg -i input.mp4 output.mp3\n功能：转码、剪辑、合并、提取音频' },
  { name: 'git-cli', version: '1.0.0', description: 'Git 命令行助手', author: 'OpenClaw', builtin: true, category: 'dev', help: '用法：git status / git commit / git push\n功能：安全 Git 操作、diff、分支管理' },
  { name: 'openclaw-cli', version: '1.0.0', description: 'OpenClaw CLI 操作助手', author: 'OpenClaw', builtin: true, category: 'system', help: '用法：openclaw <command>\n功能：gateway/agent/channels/message 命令' },
]

const CLAWHUB_SKILLS: Omit<Skill, 'id' | 'installed' | 'builtin'>[] = [
  { name: 'browser-automation', version: '1.0.1', description: '浏览器自动化（Playwright），支持网页交互、截图、表单填充', author: 'ClawHub', category: 'automation', downloads: 15234, help: '用法：browser "打开 https://example.com"\n功能：自动化网页操作、数据抓取' },
  { name: 'multi-search-engine', version: '2.0.1', description: '17 个搜索引擎集成（8 中文 +9 全球），支持高级搜索语法', author: 'ClawHub', category: 'search', downloads: 12456, help: '用法：search "query" --engine baidu\n功能：多引擎搜索、site 搜索、时间过滤' },
  { name: 'flux-image', version: '1.0.0', description: 'FLUX AI 图片生成（Black Forest Labs），支持文生图、LoRA', author: 'ClawHub', category: 'media', downloads: 9823, help: '用法：flux "一只在海边的龙虾"\n功能：AI 图片生成、风格迁移' },
  { name: 'pdf-ocr', version: '1.0.0', description: 'PDF 扫描件转 Word，支持中文 OCR，自动裁切页眉页脚', author: 'ClawHub', category: 'document', downloads: 8765, help: '用法：pdf-ocr <file.pdf>\n功能：OCR 识别、Word 导出' },
  { name: 'skill-guard', version: '1.0.0', description: '技能安全扫描，检测恶意代码、提示注入、后门', author: 'ClawHub', category: 'security', downloads: 7654, help: '用法：clawhub install <skill> --scan\n功能：安装前安全审计' },
  { name: 'tavily', version: '1.0.0', description: 'AI 优化搜索引擎（Tavily API）', author: 'ClawHub', category: 'search', downloads: 6543, help: '用法：tavily "query"\n功能：AI 友好搜索结果' },
  { name: 'vector-memory', version: '1.0.0', description: '向量数据库记忆搜索，自动语义检索', author: 'ClawHub', category: 'memory', downloads: 5432, help: '用法：memory_search "query"\n功能：语义记忆检索' },
  { name: 'wechat-auto-reply', version: '1.0.0', description: '微信自动回复（置信度>85% 自动发送）', author: 'ClawHub', category: 'automation', downloads: 4321, help: '用法：wechat-auto-reply "联系人" "消息"\n功能：半自动微信回复' },
  { name: 'ocr-local', version: '1.0.0', description: '本地 OCR（Tesseract.js），支持中英文', author: 'ClawHub', category: 'utility', downloads: 3210, help: '用法：ocr <image.png>\n功能：图片文字提取' },
  { name: 'file-organizer-zh', version: '1.0.0', description: '文件整理器（中文版），按类型自动分类', author: 'ClawHub', category: 'utility', downloads: 2109, help: '用法：file-organizer <dir>\n功能：自动文件分类' },
]

const ts = () => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}` }

export default function Skills() {
  const [tab, setTab] = useState<'installed'|'browse'|'create'>('installed')
  const [installed, setInstalled] = useState<Skill[]>([])
  const [hubSkills, setHubSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [showHelp, setShowHelp] = useState<Skill|null>(null)
  const [sortBy, setSortBy] = useState<'hot'|'name'|'newest'>('hot')
  const [hubPage, setHubPage] = useState(1)
  const [pageError, setPageError] = useState<string|null>(null)
  const [installing, setInstalling] = useState<string|null>(null)

  const log = (m:string) => setLogs(p=>[...p, `[${ts()}] ${m}`])
  const logError = (m:string,e?:any) => { 
    const msg = e instanceof Error ? e.message : String(e)
    setLogs(p=>[...p, `[${ts()}] ❌ ${m}: ${msg}`])
    setPageError(m)
  }

  const loadInstalled = async () => {
    setLoading(true); setPageError(null)
    try {
      const r = await window.electron.skills.list()
      const lines = r.output.split('\n').filter(l=>l.trim())
      const parsed = lines.map((l,i) => {
        const parts = l.trim().split(/\s+/)
        return { id:`inst-${i}`, name:parts[0]||'unknown', version:parts[1]||'1.0.0', description:'已安装技能', author:'Unknown', installed:true, builtin:false, category:'other', help:'', downloads:0 }
      })
      const builtinNames = BUILTIN_SKILLS.map(s=>s.name)
      const merged = [...BUILTIN_SKILLS.map((s,i)=>({...s, id:`builtin-${i}`, installed:true})), ...parsed.filter(p=>!builtinNames.includes(p.name))]
      setInstalled(merged)
      log(`加载 ${merged.length} 个已安装技能（${BUILTIN_SKILLS.length} 内置 + ${parsed.length} 第三方）`)
    } catch(e) { logError('加载已安装技能失败',e) }
    setLoading(false)
  }

  const loadHub = async (page=1) => {
    setLoading(true); setPageError(null)
    try {
      const pageSize = 10
      const start = (page-1)*pageSize
      const end = Math.min(start+pageSize, CLAWHUB_SKILLS.length)
      const paginated = CLAWHUB_SKILLS.slice(start, end)
      const installedNames = installed.map(s=>s.name)
      const merged = paginated.map((s,i)=>({...s, id:`hub-${start+i}`, installed:installedNames.includes(s.name), builtin:false}))
      setHubSkills(page===1 ? merged : [...hubSkills, ...merged])
      log(`加载 ClawHub 第${page}页（${merged.length}个技能）`)
    } catch(e) { logError('加载 ClawHub 失败',e) }
    setLoading(false)
  }

  const loadMoreHub = async () => {
    if(loading) return
    const maxPages = Math.ceil(CLAWHUB_SKILLS.length/10)
    if(hubPage >= maxPages) { log('📄 已加载全部技能'); return }
    const nextPage = hubPage + 1
    setHubPage(nextPage)
    await loadHub(nextPage)
  }

  const install = async (name:string) => {
    if(installing) return
    setInstalling(name)
    log(`📥 安装 ${name}...`)
    try {
      const r = await window.electron.skills.install(name)
      log(r.success ? `✅ ${name} 安装成功` : `❌ ${r.error||r.output}`)
      await loadInstalled()
      if(tab==='browse') { setHubPage(1); await loadHub(1) }
    } catch(e) { logError(`安装 ${name} 失败`,e) }
    setInstalling(null)
  }

  const uninstall = async (name:string, builtin:boolean) => {
    if(builtin) { log(`⚠️ 内置技能不能卸载`); return }
    if(!confirm(`确定卸载 ${name}?`)) return
    setLoading(true)
    log(`🗑️ 卸载 ${name}...`)
    try {
      const r = await window.electron.skills.uninstall(name)
      log(r.success ? `✅ ${name} 已卸载` : `❌ ${r.error||r.output}`)
      await loadInstalled()
      if(tab==='browse') { setHubPage(1); await loadHub(1) }
    } catch(e) { logError(`卸载 ${name} 失败`,e) }
    setLoading(false)
  }

  const scan = async (name:string) => {
    setLoading(true)
    log(`🔍 扫描 ${name}...`)
    try {
      const r = await window.electron.skills.scan(name)
      log(r.success ? `✅ 扫描通过` : `⚠️ ${r.error||r.output}`)
    } catch(e) { logError(`扫描 ${name} 失败`,e) }
    setLoading(false)
  }

  const update = async (name?:string) => {
    setLoading(true)
    log(`🔄 更新${name?` ${name}`:'全部'}...`)
    try {
      const r = await window.electron.skills.update(name)
      log(r.success ? `✅ 更新完成` : `❌ ${r.error||r.output}`)
      await loadInstalled()
      if(tab==='browse') { setHubPage(1); await loadHub(1) }
    } catch(e) { logError('更新失败',e) }
    setLoading(false)
  }

  useEffect(()=>{ 
    loadInstalled().catch(e=>logError('初始化失败',e))
    log('技能管理页面初始化完成')
  }, [])
  
  useEffect(()=>{ 
    if(tab==='browse') { setHubPage(1); setHubSkills([]); loadHub(1).catch(e=>logError('加载 ClawHub 失败',e)) }
  }, [tab])

  const filter = (skills:Skill[]) => skills.filter(s=>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase()) ||
    s.author.toLowerCase().includes(search.toLowerCase())
  )

  const sort = (skills:Skill[]) => {
    const arr = [...skills]
    if(sortBy==='hot') arr.sort((a,b)=>(b.downloads||0)-(a.downloads||0))
    if(sortBy==='name') arr.sort((a,b)=>a.name.localeCompare(b.name))
    if(sortBy==='newest') arr.sort((a,b)=>new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime())
    return arr
  }

  const catColor = (c?:string) => {
    const map:Record<string,{bg:string,text:string}> = {
      system:{bg:'#e6f7ff',text:'#1890ff'}, automation:{bg:'#f6ffed',text:'#52c41a'},
      search:{bg:'#fff7e6',text:'#fa8c16'}, media:{bg:'#f9f0ff',text:'#722ed1'},
      document:{bg:'#fff1f0',text:'#ff4d4f'}, security:{bg:'#f0f5ff',text:'#2f54eb'},
      utility:{bg:'#f5f5f5',text:'#666'}, dev:{bg:'#e6fffb',text:'#13c2c2'},
      memory:{bg:'#fff0f6',text:'#eb2f96'}, other:{bg:'#f5f5f5',text:'#999'},
    }
    return map[c||'other']
  }

  const HelpModal = ({skill,onClose}:{skill:Skill;onClose:()=>void}) => (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={onClose}>
      <div style={{background:'#fff',padding:'24px',borderRadius:'8px',width:'500px',maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <h3 style={{margin:'0 0 10px 0'}}>{skill.name}</h3>
        <div style={{marginBottom:'15px'}}>
          <span style={{fontSize:'12px',padding:'2px 8px',background:catColor(skill.category).bg,color:catColor(skill.category).text,borderRadius:'4px'}}>{skill.category}</span>
          <span style={{fontSize:'12px',color:'#999',marginLeft:'10px'}}>v{skill.version}</span>
          {skill.builtin && <span style={{fontSize:'12px',padding:'2px 8px',background:'#1890ff',color:'#fff',borderRadius:'4px',marginLeft:'10px'}}>🔒 内置</span>}
        </div>
        <p style={{fontSize:'14px',color:'#666',marginBottom:'15px'}}>{skill.description}</p>
        <div style={{background:'#f5f5f5',padding:'15px',borderRadius:'4px',marginBottom:'15px'}}>
          <h4 style={{margin:'0 0 10px 0',fontSize:'13px'}}>📖 使用帮助</h4>
          <pre style={{margin:0,fontSize:'12px',fontFamily:'Consolas',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{skill.help||'暂无帮助文档'}</pre>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end'}}><button onClick={onClose} style={{padding:'8px 16px',background:'#f0f0f0',border:'1px solid #d9d9d9',borderRadius:'4px',cursor:'pointer'}}>❌ 关闭</button></div>
      </div>
    </div>
  )

  const SkillCard = ({skill,mode}:{skill:Skill;mode:'installed'|'browse'}) => {
    const c = catColor(skill.category)
    const isInstalling = installing === skill.name
    return (
      <div style={{padding:'15px',border:'1px solid #e8e8e8',borderRadius:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'5px'}}>
            <h4 style={{margin:0,fontSize:'16px'}}>{skill.name}</h4>
            <span style={{fontSize:'12px',padding:'2px 8px',background:c.bg,color:c.text,borderRadius:'4px'}}>{skill.category}</span>
            <span style={{fontSize:'12px',color:'#999'}}>v{skill.version}</span>
            {skill.builtin && <span style={{fontSize:'12px',padding:'2px 8px',background:'#1890ff',color:'#fff',borderRadius:'4px'}}>🔒 内置</span>}
            {mode==='browse' && <span style={{fontSize:'12px',color:'#666'}}>📥 {skill.downloads||0}</span>}
          </div>
          <p style={{margin:'0 0 5px 0',fontSize:'13px',color:'#666'}}>{skill.description}</p>
          <p style={{margin:0,fontSize:'12px',color:'#999'}}>作者：{skill.author}</p>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <button onClick={()=>setShowHelp(skill)} style={{padding:'6px 12px',background:'#f0f0f0',color:'#333',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>📖 帮助</button>
          {mode==='installed' ? (
            <>
              <button onClick={()=>scan(skill.name)} disabled={loading} style={{padding:'6px 12px',background:'#f0f0f0',color:'#333',border:'none',borderRadius:'4px',cursor:loading?'not-allowed':'pointer',fontSize:'12px'}}>🔍 扫描</button>
              {!skill.builtin && <button onClick={()=>uninstall(skill.name,skill.builtin||false)} disabled={loading||isInstalling} style={{padding:'6px 12px',background:'#ff4d4f',color:'#fff',border:'none',borderRadius:'4px',cursor:(loading||isInstalling)?'not-allowed':'pointer',fontSize:'12px'}}>🗑️ 卸载</button>}
            </>
          ) : (
            isInstalling ? (
              <span style={{padding:'6px 12px',background:'#1890ff',color:'#fff',borderRadius:'4px',fontSize:'12px'}}>🔄 安装中...</span>
            ) : skill.installed ? (
              <span style={{padding:'6px 12px',background:'#52c41a',color:'#fff',borderRadius:'4px',fontSize:'12px'}}>✅ 已安装</span>
            ) : (
              <button onClick={()=>install(skill.name)} disabled={loading} style={{padding:'6px 12px',background:'#52c41a',color:'#fff',border:'none',borderRadius:'4px',cursor:loading?'not-allowed':'pointer',fontSize:'12px'}}>📥 安装</button>
            )
          )}
        </div>
      </div>
    )
  }

  const CreateSkill = () => {
    const [name,setName] = useState('');const [desc,setDesc] = useState('');const [category,setCategory] = useState('utility')
    const [trigger,setTrigger] = useState('');const [result,setResult] = useState('')
    const genPrompt = () => {
      const prompt = `# ${name}\n\n## 描述\n${desc}\n\n## 触发词\n${trigger||name}\n\n## 功能\n${desc}\n\n## 使用示例\n${name} <参数>\n\n## 注意事项\n- 本技能由用户自定义创建\n- 需要配置相应的 API 密钥或依赖`
      setResult(prompt)
      log(`生成技能创建提示词：${name}`)
    }
    const copy = () => { navigator.clipboard.writeText(result); log('✅ 提示词已复制到剪贴板') }
    return (
      <div style={{padding:'20px',background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8'}}>
        <h3 style={{margin:'0 0 20px 0'}}>🛠️ 创建自定义技能</h3>
        <div style={{marginBottom:'15px'}}>
          <label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>技能名称</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="例如：my-custom-tool" style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px',fontSize:'14px'}}/>
        </div>
        <div style={{marginBottom:'15px'}}>
          <label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>功能描述</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="描述技能的功能..." rows={3} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px',fontSize:'14px'}}/>
        </div>
        <div style={{marginBottom:'15px'}}>
          <label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>分类</label>
          <select value={category} onChange={e=>setCategory(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px',fontSize:'14px'}}>
            <option value="utility">工具</option><option value="automation">自动化</option><option value="search">搜索</option>
            <option value="media">媒体</option><option value="document">文档</option><option value="security">安全</option>
            <option value="dev">开发</option><option value="memory">记忆</option>
          </select>
        </div>
        <div style={{marginBottom:'15px'}}>
          <label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>触发词（可选）</label>
          <input value={trigger} onChange={e=>setTrigger(e.target.value)} placeholder="默认使用技能名称" style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px',fontSize:'14px'}}/>
        </div>
        <button onClick={genPrompt} disabled={!name||!desc} style={{padding:'10px 20px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:!name||!desc?'not-allowed':'pointer',fontSize:'14px'}}>✨ 生成提示词</button>
        {result && (
          <div style={{marginTop:'20px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
              <h4 style={{margin:0,fontSize:'14px'}}>📋 技能安装提示词</h4>
              <button onClick={copy} style={{padding:'5px 12px',background:'#52c41a',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>📋 复制</button>
            </div>
            <pre style={{background:'#1e1e1e',color:'#d4d4d4',padding:'15px',borderRadius:'4px',fontFamily:'Consolas',fontSize:'12px',overflowX:'auto',whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{result}</pre>
          </div>
        )}
      </div>
    )
  }

  const builtinCount = installed.filter(s=>s.builtin).length
  const thirdPartyCount = installed.filter(s=>!s.builtin).length
  const maxPages = Math.ceil(CLAWHUB_SKILLS.length/10)

  return (
    <div style={{padding:'20px'}}>
      <h2 style={{marginBottom:'20px'}}>🧩 技能管理</h2>
      <div style={{marginBottom:'20px',borderBottom:'1px solid #ddd',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <button onClick={()=>setTab('installed')} style={{padding:'10px 20px',marginRight:'10px',background:tab==='installed'?'#1890ff':'#f0f0f0',color:tab==='installed'?'#fff':'#333',border:'none',borderRadius:'4px 4px 0 0',cursor:'pointer',fontSize:'14px'}}>
            ✅ 已安装 ({installed.length})
          </button>
          <button onClick={()=>setTab('browse')} style={{padding:'10px 20px',background:tab==='browse'?'#1890ff':'#f0f0f0',color:tab==='browse'?'#fff':'#333',border:'none',borderRadius:'4px 4px 0 0',cursor:'pointer',fontSize:'14px'}}>
            🌐 ClawHub
          </button>
          <button onClick={()=>setTab('create')} style={{padding:'10px 20px',marginLeft:'10px',background:tab==='create'?'#1890ff':'#f0f0f0',color:tab==='create'?'#fff':'#333',border:'none',borderRadius:'4px 4px 0 0',cursor:'pointer',fontSize:'14px'}}>
            🛠️ 创建技能
          </button>
        </div>
        {tab==='installed' && (
          <button onClick={()=>update()} disabled={loading} style={{padding:'8px 16px',background:'#52c41a',color:'#fff',border:'none',borderRadius:'4px',cursor:loading?'not-allowed':'pointer',fontSize:'13px'}}>🔄 更新全部</button>
        )}
      </div>
      {pageError && <div style={{padding:'10px',background:'#fff1f0',border:'1px solid #ffa39e',borderRadius:'4px',marginBottom:'15px',color:'#ff4d4f',fontSize:'13px'}}>⚠️ {pageError}</div>}
      <input type="text" placeholder="搜索技能名称、描述、作者..." value={search} onChange={e=>setSearch(e.target.value)} style={{width:'100%',padding:'10px',border:'1px solid #d9d9d9',borderRadius:'4px',fontSize:'14px',marginBottom:'20px'}}/>
      {tab==='installed' && installed.length>0 && (
        <div style={{marginBottom:'15px',fontSize:'13px',color:'#666'}}>
          📊 统计：<span style={{color:'#1890ff'}}>{builtinCount} 内置</span> | <span style={{color:'#52c41a'}}>{thirdPartyCount} 第三方</span> | 总计 {installed.length}
        </div>
      )}
      {tab==='browse' && (
        <div style={{marginBottom:'20px',display:'flex',gap:'10px',alignItems:'center'}}>
          <span style={{fontSize:'13px',color:'#666'}}>排序：</span>
          <button onClick={()=>setSortBy('hot')} style={{padding:'5px 12px',background:sortBy==='hot'?'#1890ff':'#f0f0f0',color:sortBy==='hot'?'#fff':'#333',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🔥 热度</button>
          <button onClick={()=>setSortBy('name')} style={{padding:'5px 12px',background:sortBy==='name'?'#1890ff':'#f0f0f0',color:sortBy==='name'?'#fff':'#333',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>📃 名称</button>
          <button onClick={()=>setSortBy('newest')} style={{padding:'5px 12px',background:sortBy==='newest'?'#1890ff':'#f0f0f0',color:sortBy==='newest'?'#fff':'#333',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🕐 最新</button>
          <span style={{fontSize:'13px',color:'#999',marginLeft:'auto'}}>第{hubPage}/{maxPages}页</span>
        </div>
      )}
      <div style={{padding:'20px',background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8',minHeight:'400px'}}>
        {loading && <div style={{textAlign:'center',padding:'40px',color:'#999'}}>🔄 加载中...</div>}
        {!loading && tab==='installed' ? (
          filter(installed).length===0 ? (
            <div style={{padding:'40px',textAlign:'center',color:'#999'}}>{installed.length===0?'📭 暂无已安装技能':'🔍 搜索结果为空'}</div>
          ) : (
            <div style={{display:'grid',gap:'15px'}}>{filter(installed).map(s=> <SkillCard key={s.id} skill={s} mode="installed" />)}</div>
          )
        ) : !loading && tab==='browse' ? (
          filter(sort(hubSkills)).length===0 ? (
            <div style={{padding:'40px',textAlign:'center',color:'#999'}}>🌐 暂无可用技能</div>
          ) : (
            <>
              <div style={{display:'grid',gap:'15px'}}>{filter(sort(hubSkills)).map(s=> <SkillCard key={s.id} skill={s} mode="browse" />)}</div>
              {hubPage < maxPages && <div style={{textAlign:'center',marginTop:'20px'}}><button onClick={loadMoreHub} disabled={loading} style={{padding:'10px 20px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:loading?'not-allowed':'pointer',fontSize:'14px'}}>📥 加载更多</button></div>}
            </>
          )
        ) : !loading && (
          <CreateSkill />
        )}
      </div>
      <div style={{background:'#1e1e1e',color:'#d4d4d4',padding:'15px',borderRadius:'8px',fontFamily:'Consolas',fontSize:'13px',minHeight:'150px',marginTop:'20px'}}>
        <h3 style={{margin:'0 0 10px 0',color:'#569cd6'}}>📋 操作日志</h3>
        {logs.length===0 ? <p style={{color:'#6a9955'}}>暂无日志</p> : logs.slice(-50).map((l,i)=><div key={i}>{l}</div>)}
      </div>
      {showHelp && <HelpModal skill={showHelp} onClose={()=>setShowHelp(null)} />}
    </div>
  )
}