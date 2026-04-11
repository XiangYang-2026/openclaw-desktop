import { useState, useEffect } from 'react'

interface Channel {
  id: string; name: string; type: string; status: 'online' | 'offline' | 'error'
  boundModel?: string; boundSkills?: string[]; permissions?: string[]; forwardRules?: any
  lastActive?: string; description?: string
}

interface Model { id: string; name: string; providerName: string }
interface Skill { id: string; name: string; description: string }

const ts = () => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}` }

export default function Channels() {
  const [tab, setTab] = useState<'list'|'test'|'create'>('list')
  const [channels, setChannels] = useState<Channel[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [showConfig, setShowConfig] = useState<Channel|null>(null)

  const log = (m:string) => setLogs(p=>[...p, `[${ts()}] ${m}`])

  // 加载频道列表
  const loadChannels = async () => {
    setLoading(true)
    try {
      const stored = localStorage.getItem('oc_channels')
      const list:Channel[] = stored ? JSON.parse(stored) : [
        { id:'ch-1', name:'微信 - 个人号', type:'wechat', status:'online', boundModel:'Qwen3.5-Plus', boundSkills:['browser-automation','multi-search-engine'], lastActive:ts(), description:'个人微信助手' },
        { id:'ch-2', name:'Telegram 群组', type:'telegram', status:'offline', boundModel:'GPT-4', boundSkills:['summarize'], lastActive:ts(), description:'技术交流群组机器人' },
      ]
      setChannels(list)
      localStorage.setItem('oc_channels', JSON.stringify(list))
      log(`加载 ${list.length} 个已配置频道`)
    } catch(e) { log(`加载失败：${e}`) }
    setLoading(false)
  }

  // 加载模型列表（从模型管理）
  const loadModels = async () => {
    try {
      const stored = localStorage.getItem('oc_models')
      const list = stored ? JSON.parse(stored) : [
        { id:'m-1', name:'Qwen3.5-Plus', providerName:'阿里云百炼' },
        { id:'m-2', name:'GPT-4', providerName:'OpenAI' },
        { id:'m-3', name:'Claude-3.5', providerName:'Anthropic' },
      ]
      setModels(list)
    } catch(e) { console.error(e) }
  }

  // 加载技能列表（从技能管理）
  const loadSkills = async () => {
    try {
      const stored = localStorage.getItem('oc_skills')
      const list = stored ? JSON.parse(stored) : [
        { id:'s-1', name:'browser-automation', description:'浏览器自动化' },
        { id:'s-2', name:'multi-search-engine', description:'多搜索引擎' },
        { id:'s-3', name:'summarize', description:'文档总结' },
        { id:'s-4', name:'flux-image', description:'图片生成' },
      ]
      setSkills(list)
    } catch(e) { console.error(e) }
  }

  const saveChannels = (d:Channel[]) => { setChannels(d); localStorage.setItem('oc_channels', JSON.stringify(d)) }

  const deleteChannel = (id:string) => {
    const ch = channels.find(c=>c.id===id)
    if(ch) { saveChannels(channels.filter(c=>c.id!==id)); log(`删除频道：${ch.name}`) }
  }

  const toggleChannel = (id:string) => {
    const ch = channels.find(c=>c.id===id)
    if(ch) {
      const updated = channels.map(c=>c.id===id?{...c,status:(c.status==='online'?'offline':'online') as 'online'|'offline'}:c)
      saveChannels(updated)
      log(`${ch.name} 已${ch.status==='online'?'停止':'启动'}`)
    }
  }

  useEffect(()=>{ loadChannels(); loadModels(); loadSkills(); log('频道管理页面初始化完成') }, [])

  const typeIcon = (t:string) => {
    const map:Record<string,string> = { wechat:'💬', telegram:'✈️', discord:'🎮', signal:'📱', slack:'💼', dingtalk:'🔔', lark:'🐦', other:'📺' }
    return map[t]||'📺'
  }

  const statusBadge = (s:Channel['status']) => {
    const map = { online:{bg:'#f6ffed',border:'#b7eb8f',color:'#52c41a',text:'🟢 运行中'}, offline:{bg:'#f5f5f5',border:'#d9d9d9',color:'#999',text:'⚪ 已停止'}, error:{bg:'#fff1f0',border:'#ffa39e',color:'#ff4d4f',text:'🔴 异常'} }
    return map[s]||map.offline
  }

  // 配置频道模态框
  const ConfigModal = ({ch,onClose}:{ch:Channel;onClose:()=>void}) => {
    const [name,setName]=useState(ch.name);const [model,setModel]=useState(ch.boundModel||'');const [skillList,setSkillList]=useState(ch.boundSkills||[])
    const [desc,setDesc]=useState(ch.description||'')
    const toggleSkill = (sid:string) => { setSkillList(p=>p.includes(sid)?p.filter(s=>s!==sid):[...p,sid]) }
    const save = () => {
      const updated = channels.map(c=>c.id===ch.id?{...c,name,boundModel:model,boundSkills:skillList,description:desc}:c)
      saveChannels(updated); log(`更新频道配置：${name}`); onClose()
    }
    return (
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={onClose}>
        <div style={{background:'#fff',padding:'24px',borderRadius:'8px',width:'500px',maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
          <h3 style={{margin:'0 0 20px 0'}}>⚙️ 配置频道 - {ch.name}</h3>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>频道名称</label><input value={name} onChange={e=>setName(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>描述</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定模型</label><select value={model} onChange={e=>setModel(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择模型 --</option>{models.map(m=><option key={m.id} value={m.name}>{m.name} ({m.providerName})</option>)}</select></div>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定技能（多选）</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>{skills.map(s=><label key={s.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px'}}><input type="checkbox" checked={skillList.includes(s.name)} onChange={()=>toggleSkill(s.name)}/> {s.name}</label>)}</div></div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'20px'}}><button onClick={save} style={{padding:'8px 16px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer'}}>💾 保存</button><button onClick={onClose} style={{padding:'8px 16px',background:'#f0f0f0',border:'1px solid #d9d9d9',borderRadius:'4px',cursor:'pointer'}}>❌ 取消</button></div>
        </div>
      </div>
    )
  }

  // 创建频道表单
  const CreateChannel = () => {
    const [name,setName]=useState('');const [type,setType]=useState('wechat');const [model,setModel]=useState('');const [skillList,setSkillList]=useState<string[]>([])
    const [desc,setDesc]=useState('')
    const toggleSkill = (sid:string) => { setSkillList(p=>p.includes(sid)?p.filter(s=>s!==sid):[...p,sid]) }
    const create = () => {
      const newCh:Channel = { id:`ch-${Date.now()}`,name,type,status:'offline',boundModel:model,boundSkills:skillList,description:desc,lastActive:ts() }
      saveChannels([...channels,newCh]); log(`创建新频道：${name}`); setName('');setType('wechat');setModel('');setSkillList([]);setDesc('')
    }
    return (
      <div style={{padding:'20px',background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8'}}>
        <h3 style={{margin:'0 0 20px 0'}}>📺 配置新频道</h3>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>频道名称</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="例如：微信助手、Telegram 机器人" style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>频道类型</label><select value={type} onChange={e=>setType(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="wechat">💬 微信</option><option value="telegram">✈️ Telegram</option><option value="discord">🎮 Discord</option><option value="signal">📱 Signal</option><option value="slack">💼 Slack</option><option value="dingtalk">🔔 钉钉</option><option value="lark">🐦 飞书</option><option value="other">📺 其他</option></select></div>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>描述</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="频道用途描述..." rows={2} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定模型</label><select value={model} onChange={e=>setModel(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择模型 --</option>{models.map(m=><option key={m.id} value={m.name}>{m.name} ({m.providerName})</option>)}</select></div>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定技能（多选）</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>{skills.map(s=><label key={s.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px'}}><input type="checkbox" checked={skillList.includes(s.name)} onChange={()=>toggleSkill(s.name)}/> {s.name}</label>)}</div></div>
        <button onClick={create} disabled={!name} style={{padding:'10px 20px',background:'#52c41a',color:'#fff',border:'none',borderRadius:'4px',cursor:!name?'not-allowed':'pointer',fontSize:'14px'}}>✅ 创建频道</button>
      </div>
    )
  }

  // 测试消息页面
  const TestMessage = () => {
    const [selected,setSelected]=useState('');const [msg,setMsg]=useState('你好，请介绍一下你自己');const [response,setResponse]=useState('')
    const send = async () => {
      if(!selected) { log('❌ 请先选择频道'); return }
      setLoading(true); log(`📤 发送测试消息到 ${channels.find(c=>c.id===selected)?.name}...`)
      setResponse('')
      // 模拟模型响应（实际应调用真实 API）
      setTimeout(()=>{
        const resp = `✅ 测试消息发送成功\n\n🤖 模型响应:\n你好！我是你的 AI 助手，当前绑定模型为 ${channels.find(c=>c.id===selected)?.boundModel||'未知'}。\n\n我可以帮你：\n- 回答问题\n- 执行任务\n- 自动化操作`
        setResponse(resp); log('✅ 收到模型响应')
      },1500)
      setLoading(false)
    }
    return (
      <div style={{padding:'20px',background:'#fff',borderRadius:'8px',border:'1px solid #e8e8e8'}}>
        <h3 style={{margin:'0 0 20px 0'}}>📤 发送测试消息</h3>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>选择频道</label><select value={selected} onChange={e=>setSelected(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择频道 --</option>{channels.map(c=><option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}</select></div>
        <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>测试内容</label><textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
        <button onClick={send} disabled={!selected||loading} style={{padding:'10px 20px',background:'#52c41a',color:'#fff',border:'none',borderRadius:'4px',cursor:!selected||loading?'not-allowed':'pointer',fontSize:'14px'}}>📤 发送测试</button>
        {response && (
          <div style={{marginTop:'20px',padding:'15px',background:'#f6ffed',border:'1px solid #b7eb8f',borderRadius:'4px'}}>
            <h4 style={{margin:'0 0 10px 0',fontSize:'13px',color:'#52c41a'}}>✅ 模型响应</h4>
            <pre style={{margin:0,fontSize:'13px',fontFamily:'system-ui',whiteSpace:'pre-wrap',color:'#333'}}>{response}</pre>
          </div>
        )}
      </div>
    )
  }

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
          {channels.length===0 ? (
            <div style={{padding:'40px',textAlign:'center',background:'#f5f5f5',borderRadius:'8px',color:'#999'}}>
              <p style={{fontSize:'16px'}}>📭 暂无已配置的频道</p>
              <p style={{fontSize:'13px',marginTop:'10px'}}>点击「配置新频道」标签页添加新频道</p>
            </div>
          ) : (
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
                    <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
                      <span style={{padding:'5px 12px',background:badge.bg,border:`1px solid ${badge.border}`,borderRadius:'4px',color:badge.color,fontSize:'13px'}}>{badge.text}</span>
                      <button onClick={()=>setShowConfig(ch)} style={{padding:'6px 12px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>⚙️ 配置</button>
                      <button onClick={()=>toggleChannel(ch.id)} style={{padding:'6px 12px',background:ch.status==='online'?'#ff4d4f':'#52c41a',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>{ch.status==='online'?'🛑 停止':'▶️ 启动'}</button>
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