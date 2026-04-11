import { useState, useEffect, useRef } from 'react'

interface Session {
  id: string; name: string; model?: string; channel?: string; skills?: string[]
  createdAt: string; lastActivity?: string; messages: Message[]
}

interface Message { id: string; role: 'user'|'assistant'|'system'; content: string; timestamp: string }
interface Model { id: string; name: string; providerName: string }
interface Channel { id: string; name: string; type: string }
interface Skill { id: string; name: string; description: string }
interface GatewayStatus { running: boolean; version?: string; port?: number }

const ts = () => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}` }

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [gateway, setGateway] = useState<GatewayStatus>({running:false})
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [showConfig, setShowConfig] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [editName, setEditName] = useState('')
  const [pageError, setPageError] = useState<string|null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const log = (m:string) => setLogs(p=>[...p, `[${ts()}] ${m}`])
  const logError = (m:string,e?:any) => { 
    const msg = e instanceof Error ? e.message : String(e)
    setLogs(p=>[...p, `[${ts()}] ❌ ${m}: ${msg}`])
    setPageError(m)
  }
  const selected = sessions.find(s=>s.id===selectedId)

  const loadModels = async () => {
    try {
      const stored = localStorage.getItem('oc_models')
      setModels(stored ? JSON.parse(stored) : [{id:'m-1',name:'Qwen3.5-Plus',providerName:'阿里云百炼'},{id:'m-2',name:'GPT-4',providerName:'OpenAI'}])
    } catch(e) { logError('加载模型失败',e) }
  }

  const loadChannels = async () => {
    try {
      const stored = localStorage.getItem('oc_channels')
      setChannels(stored ? JSON.parse(stored) : [{id:'ch-1',name:'微信 - 个人号',type:'wechat'},{id:'ch-2',name:'Telegram 群组',type:'telegram'}])
    } catch(e) { logError('加载频道失败',e) }
  }

  const loadSkills = async () => {
    try {
      const stored = localStorage.getItem('oc_skills')
      setSkills(stored ? JSON.parse(stored) : [{id:'s-1',name:'browser-automation',description:'浏览器自动化'},{id:'s-2',name:'multi-search-engine',description:'多搜索引擎'}])
    } catch(e) { logError('加载技能失败',e) }
  }

  const checkGateway = async () => {
    try {
      const res = await window.electron.system.status()
      setGateway({running:res.gatewayRunning||false})
      if(res.gatewayRunning) log('✅ 网关已启动')
      else log('⚠️ 网关未启动，聊天功能暂不可用')
    } catch(e) { logError('检测网关状态失败',e) }
  }

  const loadSessions = async () => {
    try {
      const stored = localStorage.getItem('oc_sessions')
      let list:Session[] = stored ? JSON.parse(stored) : []
      
      // 自动创建 main 会话（如果不存在）
      if(!list.some(s=>s.id==='main')) {
        const mainSession:Session = { 
          id:'main', name:'💬 主对话', model:'Qwen3.5-Plus', channel:'', skills:[],
          createdAt:ts(), lastActivity:ts(), messages:[] 
        }
        list = [mainSession, ...list]
        localStorage.setItem('oc_sessions', JSON.stringify(list))
        log('✨ 自动创建主对话会话')
      }
      
      setSessions(list)
      
      // 自动选择 main 会话（如果没有选中或选中的不存在）
      if(!selectedId || !list.some(s=>s.id===selectedId)) {
        setSelectedId('main')
        log('📬 自动加载主对话')
      }
      
      log(`📋 加载 ${list.length} 个会话`)
    } catch(e) { logError('加载会话失败',e) }
  }

  const saveSessions = (data:Session[]) => { 
    try {
      setSessions(data)
      localStorage.setItem('oc_sessions', JSON.stringify(data))
    } catch(e) { logError('保存会话失败',e) }
  }

  const createSession = () => {
    const newS:Session = { 
      id:`s-${Date.now()}`,
      name:`新会话 ${sessions.length+1}`,
      model:models[0]?.name||'',
      channel:'',
      skills:[],
      createdAt:ts(),
      lastActivity:ts(),
      messages:[] 
    }
    saveSessions([sessions[0], newS, ...sessions.slice(1)])
    setSelectedId(newS.id)
    log(`➕ 创建新会话：${newS.name}`)
    setShowConfig(true)
  }

  const deleteSession = (id:string) => {
    if(id==='main') { log('⚠️ 主对话不能删除'); return }
    const s = sessions.find(x=>x.id===id)
    if(s) { 
      const filtered = sessions.filter(x=>x.id!==id)
      saveSessions(filtered)
      if(selectedId===id) setSelectedId('main')
      log(`🗑️ 删除会话：${s.name}`)
    }
  }

  const renameSession = (id:string) => {
    const s = sessions.find(x=>x.id===id)
    if(s && editName) { 
      saveSessions(sessions.map(x=>x.id===id?{...x,name:editName}:x))
      log(`✏️ 重命名会话：${editName}`)
      setEditingId(null)
      setEditName('')
    }
  }

  const clearMessages = (id:string) => {
    const s = sessions.find(x=>x.id===id)
    if(s) { 
      saveSessions(sessions.map(x=>x.id===id?{...x,messages:[],lastActivity:ts()}:x))
      log(`🧹 清空会话消息：${s.name}`)
    }
  }

  const sendMessage = async () => {
    if(!input.trim()||!selectedId) return
    if(!gateway.running) { log('❌ 网关未启动，无法发送消息'); return }
    
    const msg:Message = { id:`m-${Date.now()}`,role:'user',content:input.trim(),timestamp:ts() }
    const updated = sessions.map(s=>s.id===selectedId?{...s,messages:[...s.messages,msg],lastActivity:ts()}:s)
    saveSessions(updated)
    log(`📤 发送消息 (${input.length} 字)`)
    setInput('')
    
    // 模拟模型响应（后续集成真实网关 API）
    setTimeout(()=>{
      const session = sessions.find(s=>s.id===selectedId)
      const resp:Message = { 
        id:`m-${Date.now()+1}`,
        role:'assistant',
        content: `✅ 收到你的消息：${msg.content}\n\n🤖 这是模拟响应，后续将集成真实网关 API\n\n当前会话配置：\n- 模型：${session?.model||'默认'}\n- 频道：${session?.channel||'无'}\n- 技能：${session?.skills?.length||0}个`,
        timestamp:ts() 
      }
      const final = updated.map(s=>s.id===selectedId?{...s,messages:[...s.messages,resp]}:s)
      saveSessions(final)
      log(`✅ 收到模型响应 (${resp.content.length} 字)`)
    },800)
  }

  const handleKeyDown = (e:React.KeyboardEvent) => {
    if(e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // 页面初始化：全自动加载
  useEffect(()=>{ 
    const init = async () => {
      setPageError(null)
      await loadModels()
      await loadChannels()
      await loadSkills()
      await checkGateway()
      await loadSessions()
      log('🚀 会话管理页面初始化完成')
    }
    init().catch(e=>logError('初始化失败',e))
  }, [])

  // 自动刷新会话列表（每 5 秒）
  useEffect(()=>{
    if(!autoRefresh) return
    const timer = setInterval(()=>{
      loadSessions().catch(e=>console.error(e))
    }, 5000)
    return ()=>clearInterval(timer)
  }, [autoRefresh])

  // 滚动到底部
  useEffect(()=>{ 
    messagesEndRef.current?.scrollIntoView({behavior:'smooth'}) 
  },[selected?.messages])

  const ConfigModal = () => {
    if(!showConfig||!selected) return null
    const [model,setModel] = useState(selected.model||'')
    const [channel,setChannel] = useState(selected.channel||'')
    const [skillList,setSkillList] = useState(selected.skills||[])
    const toggle = (sid:string) => setSkillList(p=>p.includes(sid)?p.filter(s=>s!==sid):[...p,sid])
    const save = () => {
      saveSessions(sessions.map(s=>s.id===selected.id?{...s,model,channel,skills:skillList}:s))
      log(`⚙️ 更新会话配置：${selected.name}`)
      setShowConfig(false)
    }
    return (
      <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}} onClick={()=>setShowConfig(false)}>
        <div style={{background:'#fff',padding:'24px',borderRadius:'8px',width:'500px',maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
          <h3 style={{margin:'0 0 20px 0'}}>⚙️ 会话配置 - {selected.name}</h3>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定模型</label><select value={model} onChange={e=>setModel(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择模型 --</option>{models.map(m=><option key={m.id} value={m.name}>{m.name} ({m.providerName})</option>)}</select></div>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>绑定频道</label><select value={channel} onChange={e=>setChannel(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择频道 --</option>{channels.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>启用技能（多选）</label><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>{skills.map(s=><label key={s.id} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px'}}><input type="checkbox" checked={skillList.includes(s.name)} onChange={()=>toggle(s.name)}/> {s.name}</label>)}</div></div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'20px'}}><button onClick={save} style={{padding:'8px 16px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer'}}>💾 保存</button><button onClick={()=>setShowConfig(false)} style={{padding:'8px 16px',background:'#f0f0f0',border:'1px solid #d9d9d9',borderRadius:'4px',cursor:'pointer'}}>❌ 取消</button></div>
        </div>
      </div>
    )
  }

  return (
    <div style={{display:'flex',height:'calc(100vh - 100px)',gap:'20px',padding:'20px'}}>
      {/* 左侧会话列表 */}
      <div style={{width:'280px',background:'#fff',border:'1px solid #e8e8e8',borderRadius:'8px',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'15px',borderBottom:'1px solid #e8e8e8',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3 style={{margin:0,fontSize:'14px',color:'#666'}}>💬 会话 ({sessions.length})</h3>
          <button onClick={createSession} style={{padding:'6px 12px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>➕ 新建</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'10px'}}>
          {sessions.length===0 ? (
            <p style={{color:'#999',textAlign:'center',padding:'20px',fontSize:'13px'}}>🔄 加载中...</p>
          ) : (
            sessions.map(s=>(
              <div key={s.id} onClick={()=>setSelectedId(s.id)} style={{padding:'12px',marginBottom:'8px',background:selectedId===s.id?'#e6f7ff':'#f5f5f5',border:`1px solid ${selectedId===s.id?'#1890ff':'#e8e8e8'}`,borderRadius:'6px',cursor:'pointer',transition:'all 0.2s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  {editingId===s.id ? (
                    <input value={editName} onChange={e=>setEditName(e.target.value)} onBlur={()=>renameSession(s.id)} onKeyDown={e=>e.key==='Enter'&&renameSession(s.id)} autoFocus style={{width:'120px',padding:'4px',fontSize:'13px'}}/>
                  ) : (
                    <span style={{fontWeight:'bold',fontSize:'13px',color:s.id==='main'?'#1890ff':'#333'}} onDoubleClick={()=>{setEditingId(s.id);setEditName(s.name)}}>
                      {s.id==='main'?'💬 ':'📝 '}{s.name}
                    </span>
                  )}
                  <span style={{fontSize:'11px',color:'#999'}}>{s.model||'未绑定'}</span>
                </div>
                <div style={{fontSize:'11px',color:'#999',marginTop:'5px',display:'flex',gap:'8px'}}>
                  <span>📅 {s.lastActivity?.split(' ')[0]||''}</span>
                  <span>💬 {s.messages.length}条</span>
                </div>
                <div style={{display:'flex',gap:'5px',marginTop:'8px'}}>
                  <button onClick={(e)=>{e.stopPropagation();setShowConfig(true);setSelectedId(s.id)}} style={{flex:1,padding:'4px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'3px',cursor:'pointer',fontSize:'11px'}}>⚙️</button>
                  <button onClick={(e)=>{e.stopPropagation();clearMessages(s.id)}} style={{flex:1,padding:'4px',background:'#faad14',color:'#fff',border:'none',borderRadius:'3px',cursor:'pointer',fontSize:'11px'}}>🧹</button>
                  {s.id!=='main' && <button onClick={(e)=>{e.stopPropagation();deleteSession(s.id)}} style={{flex:1,padding:'4px',background:'#ff4d4f',color:'#fff',border:'none',borderRadius:'3px',cursor:'pointer',fontSize:'11px'}}>🗑️</button>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      <div style={{flex:1,background:'#fff',border:'1px solid #e8e8e8',borderRadius:'8px',display:'flex',flexDirection:'column'}}>
        {!selected ? (
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'#999'}}>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:'16px'}}>👈 请选择或创建一个会话</p>
              <p style={{fontSize:'13px',marginTop:'10px'}}>与 AI 助手开始对话</p>
            </div>
          </div>
        ) : (
          <>
            {/* 聊天头部 */}
            <div style={{padding:'15px',borderBottom:'1px solid #e8e8e8',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <h3 style={{margin:0,fontSize:'15px'}}>{selected.name}</h3>
                <p style={{margin:'5px 0 0',fontSize:'12px',color:'#666'}}>
                  🤖 {selected.model||'未绑定模型'} {selected.channel?`| 📺 ${selected.channel}`:''} {selected.skills?.length?`| 🧩 ${selected.skills.length}技能`:''}
                </p>
              </div>
              <button onClick={()=>setShowConfig(true)} style={{padding:'8px 16px',background:'#1890ff',color:'#fff',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'13px'}}>⚙️ 配置</button>
            </div>

            {/* 消息列表 */}
            <div style={{flex:1,overflowY:'auto',padding:'20px',background:'#f9f9f9'}}>
              {selected.messages.length===0 ? (
                <div style={{textAlign:'center',color:'#999',padding:'40px'}}>
                  <p style={{fontSize:'14px'}}>💬 开始对话吧！</p>
                  <p style={{fontSize:'12px',marginTop:'10px'}}>输入消息并按 Enter 发送</p>
                </div>
              ) : (
                selected.messages.map(m=>(
                  <div key={m.id} style={{marginBottom:'15px',display:'flex',flexDirection:m.role==='user'?'row-reverse':'row',alignItems:'flex-start'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'50%',background:m.role==='user'?'#1890ff':'#52c41a',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>
                      {m.role==='user'?'👤':'🤖'}
                    </div>
                    <div style={{maxWidth:'70%',marginLeft:m.role==='user'?'0':'12px',marginRight:m.role==='user'?'12px':'0'}}>
                      <div style={{padding:'12px',background:m.role==='user'?'#1890ff':'#fff',color:m.role==='user'?'#fff':'#333',borderRadius:'12px',borderTopRightRadius:m.role==='user'?'0':'12px',borderTopLeftRadius:m.role==='user'?'12px':'0'}}>
                        <p style={{margin:0,fontSize:'14px',whiteSpace:'pre-wrap',lineHeight:'1.6'}}>{m.content}</p>
                      </div>
                      <p style={{margin:'5px 0 0',fontSize:'11px',color:'#999',textAlign:m.role==='user'?'right':'left'}}>{m.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef}/>
            </div>

            {/* 输入区域 */}
            <div style={{padding:'15px',borderTop:'1px solid #e8e8e8',background:'#fff'}}>
              <div style={{display:'flex',gap:'10px',alignItems:'flex-end'}}>
                <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={gateway.running?'输入消息... (Enter 发送，Shift+Enter 换行)':'网关未启动，请先启动网关'} rows={2} disabled={!gateway.running} style={{flex:1,padding:'12px',border:'1px solid #d9d9d9',borderRadius:'8px',fontSize:'14px',resize:'none',opacity:!gateway.running?0.6:1}}/>
                <button onClick={sendMessage} disabled={!input.trim()||!gateway.running} style={{padding:'12px 24px',background:!input.trim()||!gateway.running?'#d9d9d9':'#1890ff',color:'#fff',border:'none',borderRadius:'8px',cursor:!input.trim()||!gateway.running?'not-allowed':'pointer',fontSize:'14px',minWidth:'100px'}}>📤 发送</button>
              </div>
              <p style={{margin:'8px 0 0',fontSize:'12px',color:'#999'}}>💡 提示：Enter 发送 | Shift+Enter 换行</p>
            </div>
          </>
        )}
      </div>

      {/* 底部日志区域 */}
      <div style={{position:'fixed',bottom:'20px',right:'20px',width:'400px',maxHeight:'200px',background:'#1e1e1e',color:'#d4d4d4',padding:'15px',borderRadius:'8px',fontFamily:'Consolas',fontSize:'12px',overflowY:'auto',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
          <h4 style={{margin:0,color:'#569cd6',fontSize:'13px'}}>📋 操作日志</h4>
          <label style={{fontSize:'11px',color:'#999',display:'flex',alignItems:'center',gap:'5px'}}>
            <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)}/> 自动刷新
          </label>
        </div>
        {pageError && <div style={{padding:'5px',background:'#fff1f0',border:'1px solid #ffa39e',borderRadius:'4px',marginBottom:'8px',color:'#ff4d4f',fontSize:'11px'}}>⚠️ {pageError}</div>}
        {logs.length===0 ? <p style={{color:'#6a9955'}}>暂无日志</p> : logs.slice(-50).map((l,i)=><div key={i} style={{marginBottom:'4px'}}>{l}</div>)}
      </div>
      <ConfigModal/>
    </div>
  )
}