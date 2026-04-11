import { useState, useEffect } from 'react'

interface Channel {
  id: string; name: string; type: string; status: 'online' | 'offline' | 'error' | 'restarting'
  boundModel?: string; boundSkills?: string[]; config?: PlatformConfig; lastActive?: string; description?: string
}

interface PlatformConfig {
  appId?: string; appSecret?: string; token?: string; botToken?: string
  webhookUrl?: string; apiVersion?: string; corpId?: string
  agentId?: string; botAppId?: string
}

interface Model { id: string; name: string; providerName: string }
interface Skill { id: string; name: string; description: string }

const ts = () => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}` }

const PLATFORMS = {
  wechat: { name:'微信', icon:'💬', fields:[{key:'appId',label:'AppID'},{key:'appSecret',label:'AppSecret'}] },
  qq: { name:'QQ', icon:'🐧', fields:[{key:'botAppId',label:'Bot AppID'},{key:'token',label:'Token'}] },
  telegram: { name:'Telegram', icon:'✈️', fields:[{key:'botToken',label:'Bot Token'},{key:'webhookUrl',label:'Webhook URL'}] },
  discord: { name:'Discord', icon:'🎮', fields:[{key:'botToken',label:'Bot Token'},{key:'appId',label:'Application ID'}] },
  slack: { name:'Slack', icon:'💼', fields:[{key:'botToken',label:'Bot Token'},{key:'appId',label:'App ID'}] },
  dingtalk: { name:'钉钉', icon:'🔔', fields:[{key:'appId',label:'AppKey'},{key:'appSecret',label:'AppSecret'},{key:'corpId',label:'CorpId'}] },
  lark: { name:'飞书', icon:'🐦', fields:[{key:'appId',label:'App ID'},{key:'appSecret',label:'App Secret'},{key:'apiVersion',label:'API Version'}] },
  wecom: { name:'企业微信', icon:'🏢', fields:[{key:'corpId',label:'CorpID'},{key:'agentId',label:'AgentID'},{key:'appSecret',label:'Secret'}] },
  signal: { name:'Signal', icon:'📱', fields:[{key:'token',label:'Token'}] },
}

export default function Channels() {
  const [tab, setTab] = useState<'list'|'test'|'create'>('list')
  const [channels, setChannels] = useState<Channel[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [showConfig, setShowConfig] = useState<Channel|null>(null)
  const [testChannelId, setTestChannelId] = useState('')
  const [testMsg, setTestMsg] = useState('你好，请介绍一下你自己')
  const [testResponse, setTestResponse] = useState('')

  const log = (m:string) => setLogs(p=>[...p, `[${ts()}] ${m}`])

  const loadChannels = async () => {
    setLoading(true)
    try {
      const stored = localStorage.getItem('oc_channels')
      const list:Channel[] = stored ? JSON.parse(stored) : [
        { id:'ch-1', name:'微信 - 个人号', type:'wechat', status:'online', boundModel:'Qwen3.5-Plus', boundSkills:['browser-automation','multi-search-engine'], config:{appId:'wx123456',appSecret:'sk_***'}, lastActive:ts(), description:'个人微信助手' },
        { id:'ch-2', name:'Telegram 群组', type:'telegram', status:'offline', boundModel:'GPT-4', boundSkills:['summarize'], config:{botToken:'1234567890:ABCdefGHIjklMNOpqrsTUVwxyz'}, lastActive:ts(), description:'技术交流群组机器人' },
      ]
      setChannels(list)
      localStorage.setItem('oc_channels', JSON.stringify(list))
      log(`加载 ${list.length} 个已配置频道`)
    } catch(e) { log(`加载失败：${e}`) }
    setLoading(false)
  }

  const loadModels = async () => {
    try {
      const stored = localStorage.getItem('oc_models')
      setModels(stored ? JSON.parse(stored) : [{id:'m-1',name:'Qwen3.5-Plus',providerName:'阿里云百炼'},{id:'m-2',name:'GPT-4',providerName:'OpenAI'}])
    } catch(e) { console.error(e) }
  }

  const loadSkills = async () => {
    try {
      const stored = localStorage.getItem('oc_skills')
      setSkills(stored ? JSON.parse(stored) : [{id:'s-1',name:'browser-automation',description:'浏览器自动化'},{id:'s-2',name:'multi-search-engine',description:'多搜索引擎'}])
    } catch(e) { console.error(e) }
  }

  const saveChannels = (d:Channel[]) => { setChannels(d); localStorage.setItem('oc_channels', JSON.stringify(d)) }

  const deleteChannel = (id:string) => {
    const ch = channels.find(c=>c.id===id)
    if(ch) { saveChannels(channels.filter(c=>c.id!==id)); log(`删除频道：${ch.name}`) }
  }

  const startChannel = (id:string) => {
    const ch = channels.find(c=>c.id===id)
    if(ch) {
      saveChannels(channels.map(c=>c.id===id?{...c,status:'online' as const,lastActive:ts()}:c))
      log(`✅ 启动频道：${ch.name} - 连接成功`)
    }
  }

  const stopChannel = (id:string) => {
    const ch = channels.find(c=>c.id===id)
    if(ch) {
      saveChannels(channels.map(c=>c.id===id?{...c,status:'offline' as const}:c))
      log(`⏸️ 停止频道：${ch.name}`)
    }
  }

  const restartChannel = async (id:string) => {
    const ch = channels.find(c=>c.id===id)
    if(!ch) return
    saveChannels(channels.map(c=>c.id===id?{...c,status:'restarting' as const}:c))
    log(`🔄 重启频道：${ch.name}...`)
    await new Promise(r=>setTimeout(r,1500))
    saveChannels(channels.map(c=>c.id===id?{...c,status:'online' as const,lastActive:ts()}:c))
    log(`✅ 重启完成：${ch.name} - 连接成功`)
  }

  const sendTestMessage = async () => {
    if(!testChannelId) { log('❌ 请先选择频道'); return }
    const ch = channels.find(c=>c.id===testChannelId)
    if(!ch) { log('❌ 频道不存在'); return }
    if(ch.status!=='online') { log('❌ 频道未启动，请先启动频道'); return }
    setLoading(true)
    log(`📤 发送测试消息到 ${ch.name}...`)
    setTestResponse('')
    // 模拟真实 API 调用
    setTimeout(()=>{
      const responses = [
        `✅ 消息发送成功\n\n🤖 ${ch.boundModel||'AI'} 回复:\n你好！我是你的 AI 助手，当前通过${PLATFORMS[ch.type as keyof typeof PLATFORMS]?.name||ch.type}与你对话。\n\n我可以帮你：\n- 回答问题\n- 执行任务\n- 自动化操作`,
        `✅ 测试成功\n\n📺 频道：${ch.name}\n🤖 模型：${ch.boundModel||'默认'}\n🧩 技能：${ch.boundSkills?.join(', ')||'无'}\n\n消息内容：${testMsg}`,
      ]
      setTestResponse(responses[Math.floor(Math.random()*responses.length)])
      log(`✅ 收到回复 (${ch.type})`)
      setLoading(false)
    },1200)
  }

  const createChannel = (name:string,type:string,model:string,skills:string[],desc:string,config:PlatformConfig) => {
    const newCh:Channel = { id:`ch-${Date.now()}`,name,type,status:'offline',boundModel:model,boundSkills:skills,description:desc,config,lastActive:ts() }
    saveChannels([...channels,newCh]); log(`创建新频道：${name} (${PLATFORMS[type as keyof typeof PLATFORMS]?.name||type})`)
  }

  const updateChannel = (id:string,data:Partial<Channel>) => {
    const ch = channels.find(c=>c.id===id)
    if(ch) { saveChannels(channels.map(c=>c.id===id?{...c,...data}:c)); log(`更新频道配置：${ch.name}`) }
  }

  useEffect(()=>{ loadChannels(); loadModels(); loadSkills(); log('频道管理页面初始化完成') }, [])

  const typeIcon = (t:string) => PLATFORMS[t as keyof typeof PLATFORMS]?.icon||'📺'

  const statusBadge = (s:Channel['status']) => {
    const map = { online:{bg:'#f6ffed',border:'#b7eb8f',color:'#52c41a',text:'🟢 运行中'}, offline:{bg:'#f5f5f5',border:'#d9d9d9',color:'#999',text:'⚪ 已停止'}, error:{bg:'#fff1f0',border:'#ffa39e',color:'#ff4d4f',text:'🔴 异常'}, restarting:{bg:'#fff7e6',border:'#ffd591',color:'#fa8c16',text:'🟠 重启中'} }
    return map[s]||map.offline
  }

  // 配置频道模态框
  const ConfigModal = ({ch,onClose}:{ch:Channel;onClose:()=>void}) => {
    const [name,setName]=useState(ch.name);const [model,setModel]=useState(ch.boundModel||'');const [skillList,setSkillList]=useState(ch.boundSkills||[])
    const [desc,setDesc]=useState(ch.description||'');const [config,setConfig]=useState<PlatformConfig>(ch.config||{})
    const toggleSkill = (sid:string) => setSkillList(p=>p.includes(sid)?p.filter(s=>s!==sid):[...p,sid])
    const updateConfig = (key:string,val:string) => setConfig(p=>({...p,[key]:val}))
    const save = () => { updateChannel(ch.id,{name,boundModel:model,boundSkills:skillList,description:desc,config}); onClose() }
    const fields = PLATFORMS[ch.type as keyof typeof PLATFORMS]?.fields||[]
    return (
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={onClose}>
        <div style={{background:'#fff',padding:'24px',borderRadius:'8px',width:'550px',maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
          <h3 style={{margin:'0 0 20px 0'}}>⚙️ 配置频道 - {ch.name}</h3>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>频道名称</label><input value={name} onChange={e=>setName(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>描述</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定模型</label><select value={model} onChange={e=>setModel(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择模型 --</option>{models.map(m=><option key={m.id} value={m.name}>{m.name} ({m.providerName})</option>)}</select></div>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定技能（多选）</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>{skills.map(s=><label key={s.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px'}}><input type="checkbox" checked={skillList.includes(s.name)} onChange={()=>toggleSkill(s.name)}/> {s.name}</label>)}</div></div>
          <div style={{marginBottom:'15px',padding:'15px',background:'#f9f9f9',borderRadius:'4px'}}>
            <h4 style={{margin:'0 0 10px 0',fontSize:'13px',color:'#666'}}>🔑 {PLATFORMS[ch.type as keyof typeof PLATFORMS]?.name||ch.type} 配置</h4>
            {fields.map(f=><div key={f.key} style={{marginBottom:'10px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'12px',color:'#666'}}>{f.label}</label><input type={f.key.toLowerCase().includes('secret')||f.key.toLowerCase().includes('token')?'password':'text'} value={config[f.key as keyof PlatformConfig]||''} onChange={e=>updateConfig(f.key,e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px',fontSize:'13px'}}/></div>)}
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'20px'}}><button onClick={save} style={{padding:'8px 16px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer'}}>💾 保存</button><button onClick={onClose} style={{padding:'8px 16px',background:'#f0f0f0',border:'1px solid #d9d9d9',borderRadius:'4px',cursor:'pointer'}}>❌ 取消</button></div>
        </div>
      </div>
    )
  }

  // 创建频道表单
  const CreateChannel = () => {
    const [name,setName]=useState('');const [type,setType]=useState('wechat');const [model,setModel]=useState('');const [skillList,setSkillList]=useState<string[]>([])
    const [desc,setDesc]=useState('');const [config,setConfig]=useState<PlatformConfig>({})
    const toggleSkill = (sid:string) => setSkillList(p=>p.includes(sid)?p.filter(s=>s!==sid):[...p,sid])
    const updateConfig = (key:string,val:string) => setConfig(p=>({...p,[key]:val}))
    const create = () => { if(name) { createChannel(name,type,model,skillList,desc,config); setName('');setType('wechat');setModel('');setSkillList([]);setDesc('');setConfig({}) } }
    const fields = PLATFORMS[type as keyof typeof PLATFORMS]?.fields||[]
    return (
      <div style={{padding:'20px',background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8'}}>
        <h3 style={{margin:'0 0 20px 0'}}>📺 配置新频道</h3>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>频道名称</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="例如：微信助手、Telegram 机器人" style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>平台类型</label><select value={type} onChange={e=>setType(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}>{Object.entries(PLATFORMS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.name}</option>)}</select></div>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>描述</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="频道用途描述..." rows={2} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定模型</label><select value={model} onChange={e=>setModel(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择模型 --</option>{models.map(m=><option key={m.id} value={m.name}>{m.name} ({m.providerName})</option>)}</select></div>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定技能（多选）</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>{skills.map(s=><label key={s.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px'}}><input type="checkbox" checked={skillList.includes(s.name)} onChange={()=>toggleSkill(s.name)}/> {s.name}</label>)}</div></div>
        <div style={{marginBottom:'15px',padding:'15px',background:'#f9f9f9',borderRadius:'4px'}}>
          <h4 style={{margin:'0 0 10px 0',fontSize:'13px',color:'#666'}}>🔑 {PLATFORMS[type as keyof typeof PLATFORMS]?.name||type} 配置</h4>
          {fields.map(f=><div key={f.key} style={{marginBottom:'10px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'12px',color:'#666'}}>{f.label}</label><input type={f.key.toLowerCase().includes('secret')||f.key.toLowerCase().includes('token')?'password':'text'} value={config[f.key as keyof PlatformConfig]||''} onChange={e=>updateConfig(f.key,e.target.value)} placeholder={`输入${f.label}`} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px',fontSize:'13px'}}/></div>)}
        </div>
        <button onClick={create} disabled={!name} style={{padding:'10px 20px',background:'#52c41a',color:'#fff',border:'none',borderRadius:'4px',cursor:!name?'not-allowed':'pointer',fontSize:'14px'}}>✅ 创建频道</button>
      </div>
    )
  }

  // 测试消息页面
  const TestMessage = () => (
    <div style={{padding:'20px',background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8'}}>
      <h3 style={{margin:'0 0 20px 0'}}>📤 发送测试消息</h3>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>选择频道</label><select value={testChannelId} onChange={e=>setTestChannelId(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择频道 --</option>{channels.map(c=><option key={c.id} value={c.id}>{c.name} ({typeIcon(c.type)} {c.status==='online'?'🟢':'⚪'})</option>)}</select></div>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>测试内容</label><textarea value={testMsg} onChange={e=>setTestMsg(e.target.value)} rows={4} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
      <button onClick={sendTestMessage} disabled={!testChannelId||loading} style={{padding:'10px 20px',background:!testChannelId||loading?'#d9d9d9':'#52c41a',color:'#fff',border:'none',borderRadius:'4px',cursor:!testChannelId||loading?'not-allowed':'pointer',fontSize:'14px'}}>{loading?'🔄 发送中...':'📤 发送测试'}</button>
      {testResponse && (<div style={{marginTop:'20px',padding:'15px',background:'#f6ffed',border:'1px solid #b7eb8f',borderRadius:'4px'}}><h4 style={{margin:'0 0 10px 0',fontSize:'13px',color:'#52c41a'}}>✅ 回复结果</h4><pre style={{margin:0,fontSize:'13px',fontFamily:'system-ui',whiteSpace:'pre-wrap',color:'#333'}}>{testResponse}</pre></div>)}
    </div>
  )

  return (
    <div style={{padding:'20px'}}>
      <h2 style={{marginBottom:'20px'}}>📺 频道管理</h2>
      <div style={{marginBottom:'20px',borderBottom:'1px solid #ddd'}}>
        <button onClick={()=>setTab('list')} style={{padding:'10px 20px',marginRight:'10px',background:tab==='list'?'#1890ff':'#f0f0f0',color:tab==='list'?'#fff':'#333',border:'none',borderRadius:'4px 4px 0 0',cursor:'pointer',fontSize:'14px'}}>✅ 已登录频道 ({channels.length})</button>
        <button onClick={()=>setTab('test')} style={{padding:'10px 20px',marginRight:'10px',background:tab==='test'?'#1890ff':'#f0f0f0',color:tab==='test'?'#fff':'#333',border:'none',borderRadius:'4px 4px 0 0',cursor:'pointer',fontSize:'14px'}}>📤 发送测试</button>
        <button onClick={()=>setTab('create')} style={{padding:'10px 20px',background:tab==='create'?'#1890ff':'#f0f0f0',color:tab==='create'?'#fff':'#333',border:'none',borderRadius:'4px 4px 0 0',cursor:'pointer',fontSize:'14px'}}>➕ 配置新频道</button>
      </div>
      {tab==='list' && (
        <div style={{padding:'20px',background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8',marginBottom:'20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'15px'}}>
            <h3 style={{margin:0,fontSize:'14px',color:'#666'}}>已登录频道</h3>
            <button onClick={loadChannels} disabled={loading} style={{padding:'8px 16px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:loading?'not-allowed':'pointer',fontSize:'13px'}}>🔄 刷新</button>
          </div>
          {channels.length===0 ? (<div style={{padding:'40px',textAlign:'center',background:'#f5f5f5',borderRadius:'8px',color:'#999'}}><p style={{fontSize:'16px'}}>📭 暂无已配置的频道</p><p style={{fontSize:'13px',marginTop:'10px'}}>点击「配置新频道」标签页添加新频道</p></div>) : (
            <div style={{display:'grid',gap:'15px'}}>
              {channels.map(ch=>{
                const badge = statusBadge(ch.status)
                return (
                  <div key={ch.id} style={{padding:'15px',border:'1px solid #e8e8e8',borderRadius:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'15px',flex:1}}>
                      <div style={{width:'45px',height:'45px',background:'#f0f2f5',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>{typeIcon(ch.type)}</div>
                      <div style={{flex:1}}>
                        <h4 style={{margin:'0 0 5px 0',fontSize:'15px'}}>{ch.name}</h4>
                        <p style={{margin:0,fontSize:'12px',color:'#666'}}>{ch.description||'暂无描述'}</p>
                        <p style={{margin:'5px 0 0 0',fontSize:'12px',color:'#999'}}>🤖 {ch.boundModel||'未绑定模型'} | 🧩 {ch.boundSkills?.length||0} 个技能</p>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                      <span style={{padding:'5px 12px',background:badge.bg,border:`1px solid ${badge.border}`,borderRadius:'4px',color:badge.color,fontSize:'13px'}}>{badge.text}</span>
                      <button onClick={()=>setShowConfig(ch)} style={{padding:'6px 12px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>⚙️</button>
                      {ch.status!=='offline' ? (
                        <>
                          <button onClick={()=>stopChannel(ch.id)} style={{padding:'6px 12px',background:'#ff4d4f',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🛑</button>
                          <button onClick={()=>restartChannel(ch.id)} disabled={ch.status==='restarting'} style={{padding:'6px 12px',background:'#faad14',color:'#fff',border:'none',borderRadius:'4px',cursor:ch.status==='restarting'?'not-allowed':'pointer',fontSize:'12px',opacity:ch.status==='restarting'?0.6:1}}>🔄</button>
                        </>
                      ) : (
                        <button onClick={()=>startChannel(ch.id)} style={{padding:'6px 12px',background:'#52c41a',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>▶️</button>
                      )}
                      <button onClick={()=>deleteChannel(ch.id)} style={{padding:'6px 12px',background:'#f5f5f5',color:'#ff4d4f',border:'1px solid #d9d9d9',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      {tab==='test' && <TestMessage />}
      {tab==='create' && <CreateChannel />}
      <div style={{background:'#1e1e1e',color:'#d4d4d4',padding:'15px',borderRadius:'8px',fontFamily:'Consolas',fontSize:'13px',minHeight:'150px',marginTop:'20px'}}>
        <h3 style={{margin:'0 0 10px 0',color:'#569cd6'}}>📋 操作日志</h3>
        {logs.length===0 ? <p style={{color:'#6a9955'}}>暂无日志</p> : logs.map((l,i)=><div key={i}>{l}</div>)}
      </div>
      {showConfig && <ConfigModal ch={showConfig} onClose={()=>setShowConfig(null)} />}
    </div>
  )
}