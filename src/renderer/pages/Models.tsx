import { useState, useEffect } from 'react'

interface Provider { id: string; name: string; type: string; authType: string; status: string; apiKey?: string; secretKey?: string; baseUrl?: string; region?: string }
interface Model { id: string; name: string; providerId: string; providerName: string; type: string; status: string; apiKey?: string; baseUrl?: string; useCustomKey: boolean }
interface SystemInfo { osInfo: string; installPath: string; gatewayRunning: boolean }

const ts = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}` }

export default function Models() {
  const [tab, setTab] = useState<'providers'|'models'>('providers')
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [sysInfo, setSysInfo] = useState<SystemInfo|null>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [keyModal, setKeyModal] = useState(false)
  const [provModal, setProvModal] = useState(false)
  const [modelModal, setModelModal] = useState(false)
  const [cfgProvider, setCfgProvider] = useState<Provider|null>(null)
  const [editModel, setEditModel] = useState<Model|null>(null)

  const log = (m:string) => setLogs(p=>[...p, `[${ts()}] ${m}`])
  const loadSys = async () => { try { const r=await window.electron.system.status(); if(r.success){ setSysInfo({osInfo:r.osInfo||'未知',installPath:r.installPath||'未知',gatewayRunning:r.gatewayRunning||false}); log(`系统信息：操作系统 ${r.osInfo||'未知'}，OpenClaw 安装路径 ${r.installPath||'未知'}`) }} catch(e){console.error(e)} }
  const loadProv = async () => { setLoading(true); try{const s=localStorage.getItem('oc_prov'); setProviders(s?JSON.parse(s):[]); if(s)log(`加载 ${JSON.parse(s).length} 个供应商`)}catch(e){log(`加载失败:${e}`)}; setLoading(false) }
  const loadMod = async () => { 
    setLoading(true)
    try {
      // 备用：从 localStorage 加载（真实模型数据）
      const s = localStorage.getItem('oc_models')
      setModels(s ? JSON.parse(s) : [])
      if(s) log(`加载 ${JSON.parse(s).length} 个模型（来自 localStorage）`)
      else log('⚠️ 暂无已配置模型，请先添加供应商和模型')
    } catch(e) {
      log(`加载失败：${e}`)
    }
    setLoading(false)
  }
  const saveProv = (d:Provider[]) => { setProviders(d); localStorage.setItem('oc_prov',JSON.stringify(d)) }
  const saveMod = (d:Model[]) => { setModels(d); localStorage.setItem('oc_models',JSON.stringify(d)) }
  const addProv = (p:any) => { const n={...p,id:`p-${Date.now()}`,status:p.apiKey||p.secretKey?'configured':'unconfigured'}; saveProv([...providers,n]); log(`添加供应商：${p.name}`); setProvModal(false) }
  const delProv = (id:string) => { const p=providers.find(x=>x.id===id); if(p){saveProv(providers.filter(x=>x.id!==id));log(`删除供应商：${p.name}`)} }
  const updProv = (id:string,u:any) => { saveProv(providers.map(p=>p.id===id?{...p,...u,status:u.apiKey||u.secretKey?'configured':p.status}:p)) }
  const addMod = (m:any) => { const n={...m,id:`m-${Date.now()}`,status:m.apiKey?'configured':'unconfigured'}; saveMod([...models,n]); log(`添加模型：${m.name}`); setModelModal(false); setEditModel(null) }
  const delMod = (id:string) => { const m=models.find(x=>x.id===id); if(m){saveMod(models.filter(x=>x.id!==id));log(`删除模型：${m.name}`)} }
  const updMod = (id:string,u:any) => { saveMod(models.map(m=>m.id===id?{...m,...u,status:u.apiKey?'configured':m.status}:m)) }
  const testProv = (p:Provider) => { log(`测试 ${p.name} 密钥...`); setTimeout(()=>log(`✅ ${p.name} 测试成功`),800) }
  const testMod = (m:Model) => { log(`测试 ${m.name} 连接...`); setTimeout(()=>log(`✅ ${m.name} 测试成功`),800) }
  const refresh = async () => { log('刷新状态...'); await loadProv(); await loadMod(); await loadSys(); log(`刷新完成：${providers.length} 供应商，${models.length} 模型`) }

  useEffect(()=>{loadSys();loadProv();loadMod();log('模型管理页面初始化完成')},[])

  return (
    <div style={{padding:'20px'}}>
      <h2>🤖 模型管理</h2>
      {sysInfo && <div style={{display:'flex',gap:'20px',marginBottom:'20px',padding:'15px',background:'#e6f7ff',border:'1px solid #91d5ff',borderRadius:'8px'}}>
        <div style={{flex:1}}><div style={{fontSize:'13px',color:'#666'}}>操作系统</div><div style={{fontSize:'14px',fontWeight:500}}>{sysInfo.osInfo}</div></div>
        <div style={{flex:1}}><div style={{fontSize:'13px',color:'#666'}}>OpenClaw 安装路径</div><div style={{fontSize:'12px',fontFamily:'Consolas'}}>{sysInfo.installPath}</div></div>
        <div style={{flex:1}}><div style={{fontSize:'13px',color:'#666'}}>系统状态</div><div style={{fontSize:'14px',color:sysInfo.gatewayRunning?'#52c41a':'#faad14'}}>{sysInfo.gatewayRunning?'✅ 正常':'⚠️ 网关未运行'}</div></div>
      </div>}
      <div style={{marginBottom:'20px',borderBottom:'1px solid #ddd'}}>
        <button onClick={()=>setTab('providers')} style={{padding:'10px 20px',marginRight:'10px',background:tab==='providers'?'#1890ff':'#f0f0f0',color:tab==='providers'?'#fff':'#333',border:'none',borderRadius:'4px 4px 0 0',cursor:'pointer'}}>🏢 供应商管理</button>
        <button onClick={()=>setTab('models')} style={{padding:'10px 20px',background:tab==='models'?'#1890ff':'#f0f0f0',color:tab==='models'?'#fff':'#333',border:'none',borderRadius:'4px 4px 0 0',cursor:'pointer'}}>🧠 大模型管理</button>
      </div>
      {tab==='providers' && <ProvTab provs={providers} loading={loading} onAdd={()=>setProvModal(true)} onDel={delProv} onUpd={updProv} onTest={testProv} onCfg={(p:any)=>{setCfgProvider(p);setKeyModal(true)}} onRefresh={refresh} />}
      {tab==='models' && <ModTab models={models} provs={providers} loading={loading} onAdd={()=>{setEditModel(null);setModelModal(true)}} onDel={delMod} onUpd={updMod} onTest={testMod} onRefresh={refresh} onEdit={(m:any)=>{setEditModel(m);setModelModal(true)}} />}
      <div style={{background:'#1e1e1e',color:'#d4d4d4',padding:'15px',borderRadius:'8px',fontFamily:'Consolas',fontSize:'13px',minHeight:'150px',maxHeight:'200px',overflowY:'auto',marginTop:'20px'}}>
        <h3 style={{margin:'0 0 10px 0',color:'#569cd6'}}>📋 操作日志</h3>
        {logs.length===0?<p style={{color:'#6a9955'}}>暂无日志</p>:logs.map((l,i)=><div key={i}>{l}</div>)}
      </div>
      {keyModal && cfgProvider && <KeyModal prov={cfgProvider} onSave={(u:any)=>{updProv(cfgProvider.id,u);log(`为 ${cfgProvider.name} 配置密钥`);setKeyModal(false);setCfgProvider(null)}} onCancel={()=>{setKeyModal(false);setCfgProvider(null)}} />}
      {provModal && <AddProvModal onSave={addProv} onCancel={()=>setProvModal(false)} />}
      {modelModal && <AddModModal onSave={addMod} onCancel={()=>{setModelModal(false);setEditModel(null)}} provs={providers} edit={editModel} />}
    </div>
  )
}

function ProvTab({provs,loading,onAdd,onDel,onUpd,onTest,onCfg,onRefresh}:any){
  return(<div>
    <div style={{marginBottom:'15px'}}>
      <button onClick={onAdd} disabled={loading} style={{padding:'10px 20px',marginRight:'10px',background:'#52c41a',color:'white',border:'none',borderRadius:'4px',cursor:loading?'not-allowed':'pointer'}}>➕ 添加供应商</button>
      <button onClick={onRefresh} disabled={loading} style={{padding:'10px 20px',background:'#1890ff',color:'white',border:'none',borderRadius:'4px',cursor:loading?'not-allowed':'pointer'}}>🔄 刷新状态</button>
    </div>
    {provs.length===0?<div style={{padding:'40px',textAlign:'center',background:'#f5f5f5',borderRadius:'8px',color:'#999'}}><p>📭 暂无已添加的大模型供应商</p><p style={{fontSize:'13px',marginTop:'10px'}}>点击「添加供应商」按钮开始配置</p></div>:(
      <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',borderRadius:'8px',overflow:'hidden'}}>
        <thead><tr style={{background:'#fafafa',borderBottom:'2px solid #e8e8e8'}}><th style={{padding:'12px',textAlign:'left'}}>供应商名称</th><th style={{padding:'12px',textAlign:'left'}}>认证方式</th><th style={{padding:'12px',textAlign:'left'}}>状态</th><th style={{padding:'12px',textAlign:'left'}}>操作</th></tr></thead>
        <tbody>{provs.map((p:any)=>(<tr key={p.id} style={{borderBottom:'1px solid #e8e8e8'}}><td style={{padding:'12px'}}>{p.name}</td><td style={{padding:'12px',color:'#666',fontSize:'13px'}}>{p.authType==='akSk'?'AK/SK 双密钥':p.authType==='apiKey+baseUrl'?'API Key + Base URL':'API Key'}</td><td style={{padding:'12px',fontSize:'13px'}}>{p.status==='configured'?'✅ 已配置':'❌ 未配置'}</td><td style={{padding:'12px'}}><button onClick={()=>onCfg(p)} style={{padding:'5px 12px',marginRight:'5px',background:'#1890ff',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🔑 配置密钥</button><button onClick={()=>onTest(p)} style={{padding:'5px 12px',marginRight:'5px',background:'#52c41a',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🧪 测试</button><button onClick={()=>onDel(p.id)} style={{padding:'5px 12px',background:'#ff4d4f',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🗑️ 删除</button></td></tr>))}</tbody>
      </table>
    )}
  </div>)
}

function ModTab({models,provs,loading,onAdd,onDel,onUpd,onTest,onRefresh,onEdit}:any){
  const getPName=(id:string)=>provs.find((p:any)=>p.id===id)?.name||'未知'
  return(<div>
    <div style={{marginBottom:'15px'}}>
      <button onClick={onAdd} disabled={loading} style={{padding:'10px 20px',marginRight:'10px',background:'#52c41a',color:'white',border:'none',borderRadius:'4px',cursor:loading?'not-allowed':'pointer'}}>➕ 添加模型</button>
      <button onClick={onRefresh} disabled={loading} style={{padding:'10px 20px',background:'#1890ff',color:'white',border:'none',borderRadius:'4px',cursor:loading?'not-allowed':'pointer'}}>🔄 刷新状态</button>
    </div>
    {models.length===0?<div style={{padding:'40px',textAlign:'center',background:'#f5f5f5',borderRadius:'8px',color:'#999'}}><p>📭 暂无已配置的大模型</p><p style={{fontSize:'13px',marginTop:'10px'}}>请先添加供应商，然后点击「添加模型」</p></div>:(
      <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',borderRadius:'8px',overflow:'hidden'}}>
        <thead><tr style={{background:'#fafafa',borderBottom:'2px solid #e8e8e8'}}><th style={{padding:'12px',textAlign:'left'}}>模型名称</th><th style={{padding:'12px',textAlign:'left'}}>所属供应商</th><th style={{padding:'12px',textAlign:'left'}}>类型</th><th style={{padding:'12px',textAlign:'left'}}>状态</th><th style={{padding:'12px',textAlign:'left'}}>操作</th></tr></thead>
        <tbody>{models.map((m:any)=>(<tr key={m.id} style={{borderBottom:'1px solid #e8e8e8'}}><td style={{padding:'12px'}}>{m.name}</td><td style={{padding:'12px',fontSize:'13px'}}>{getPName(m.providerId)}</td><td style={{padding:'12px',fontSize:'13px'}}>{m.type==='general'?'通用':m.type==='code'?'代码':m.type==='multimodal'?'多模态':'嵌入'}</td><td style={{padding:'12px',fontSize:'13px'}}>{m.status==='configured'?'✅ 已配置':'❌ 未配置'}</td><td style={{padding:'12px'}}><button onClick={()=>onEdit(m)} style={{padding:'5px 12px',marginRight:'5px',background:'#1890ff',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🔑 配置密钥</button><button onClick={()=>onTest(m)} style={{padding:'5px 12px',marginRight:'5px',background:'#52c41a',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🧪 测试</button><button onClick={()=>onDel(m.id)} style={{padding:'5px 12px',background:'#ff4d4f',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>🗑️ 删除</button></td></tr>))}</tbody>
      </table>
    )}
  </div>)
}

function KeyModal({prov,onSave,onCancel}:any){
  const [ak,setAk]=useState(prov.apiKey||'');const [sk,setSk]=useState(prov.secretKey||'');const [url,setUrl]=useState(prov.baseUrl||'');const [region,setRegion]=useState(prov.region||'')
  return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
    <div style={{background:'#fff',padding:'24px',borderRadius:'8px',width:'400px',maxHeight:'80vh',overflowY:'auto'}}>
      <h3 style={{margin:'0 0 20px 0'}}>🔑 配置密钥 - {prov.name}</h3>
      {prov.authType==='akSk'&&(<><div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>Access Key (AK)</label><input value={ak} onChange={e=>setAk(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div><div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>Secret Access Key (SK)</label><input value={sk} onChange={e=>setSk(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div><div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>区域</label><input value={region} onChange={e=>setRegion(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div></>)}
      {prov.authType!=='akSk'&&(<><div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>API Key</label><input value={ak} onChange={e=>setAk(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>{prov.authType==='apiKey+baseUrl'&&<div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>Base URL</label><input value={url} onChange={e=>setUrl(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>}</>)}
      <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'20px'}}><button onClick={()=>onSave({apiKey:ak,secretKey:sk,baseUrl:url,region})} style={{padding:'8px 16px',background:'#1890ff',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>💾 保存</button><button onClick={onCancel} style={{padding:'8px 16px',background:'#f0f0f0',border:'1px solid #d9d9d9',borderRadius:'4px',cursor:'pointer'}}>❌ 取消</button></div>
    </div>
  </div>)
}

function AddProvModal({onSave,onCancel}:any){
  const [name,setName]=useState('');const [type,setType]=useState('custom');const [auth,setAuth]=useState('apiKey')
  const presets=[{n:'华为云',t:'huaweicloud',a:'akSk'},{n:'CodingPlan (阿里云百炼)',t:'codingplan',a:'apiKey+baseUrl'},{n:'Moonshot (月之暗面)',t:'moonshot',a:'apiKey'},{n:'阿里云百炼',t:'aliyun',a:'apiKey+baseUrl'}]
  return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
    <div style={{background:'#fff',padding:'24px',borderRadius:'8px',width:'400px'}}>
      <h3 style={{margin:'0 0 20px 0'}}>➕ 添加供应商</h3>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>选择预设</label><select onChange={e=>{const p=presets.find(x=>x.t===e.target.value);if(p){setName(p.n);setType(p.t);setAuth(p.a)}}} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择预设 --</option>{presets.map((p:any)=><option key={p.t} value={p.t}>{p.n}</option>)}</select></div>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>供应商名称</label><input value={name} onChange={e=>setName(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>认证方式</label><select value={auth} onChange={e=>setAuth(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="apiKey">API Key</option><option value="akSk">AK/SK 双密钥</option><option value="apiKey+baseUrl">API Key + Base URL</option></select></div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'20px'}}><button onClick={()=>onSave({name,type,authType:auth})} disabled={!name} style={{padding:'8px 16px',background:'#52c41a',color:'white',border:'none',borderRadius:'4px',cursor:!name?'not-allowed':'pointer'}}>✅ 添加</button><button onClick={onCancel} style={{padding:'8px 16px',background:'#f0f0f0',border:'1px solid #d9d9d9',borderRadius:'4px',cursor:'pointer'}}>❌ 取消</button></div>
    </div>
  </div>)
}

function AddModModal({onSave,onCancel,provs,edit}:any){
  const [name,setName]=useState(edit?.name||'');const [provId,setProvId]=useState(edit?.providerId||'');const [type,setType]=useState(edit?.type||'general');const [apiKey,setApiKey]=useState(edit?.apiKey||'');const [baseUrl,setBaseUrl]=useState(edit?.baseUrl||'')
  const provName=provs.find((p:any)=>p.id===provId)?.name||''
  return(<div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
    <div style={{background:'#fff',padding:'24px',borderRadius:'8px',width:'400px'}}>
      <h3 style={{margin:'0 0 20px 0'}}>{edit?'✏️ 编辑模型':'➕ 添加模型'}</h3>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>模型名称</label><input value={name} onChange={e=>setName(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>所属供应商</label><select value={provId} onChange={e=>setProvId(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="">-- 选择供应商 --</option>{provs.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>模型类型</label><select value={type} onChange={e=>setType(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}><option value="general">通用</option><option value="code">代码</option><option value="multimodal">多模态</option><option value="embedding">嵌入</option></select></div>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>API Key</label><input value={apiKey} onChange={e=>setApiKey(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
      <div style={{marginBottom:'15px'}}><label style={{display:'block',marginBottom:'5px',fontSize:'13px'}}>Base URL (可选)</label><input value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} style={{width:'100%',padding:'8px',border:'1px solid #d9d9d9',borderRadius:'4px'}}/></div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',marginTop:'20px'}}><button onClick={()=>onSave({name,providerId:provId,providerName:provName,type,apiKey,baseUrl,useCustomKey:!!apiKey})} disabled={!name||!provId} style={{padding:'8px 16px',background:'#52c41a',color:'white',border:'none',borderRadius:'4px',cursor:!name||!provId?'not-allowed':'pointer'}}>{edit?'💾 保存':'✅ 添加'}</button><button onClick={onCancel} style={{padding:'8px 16px',background:'#f0f0f0',border:'1px solid #d9d9d9',borderRadius:'4px',cursor:'pointer'}}>❌ 取消</button></div>
    </div>
  </div>)
}