import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

async function api(endpoint, options = {}) {
  const token = localStorage.getItem("phoenix_token");
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0D1117; color: #F0F6FC; font-family: Inter, sans-serif; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #0D1117; }
  ::-webkit-scrollbar-thumb { background: #30363D; border-radius: 3px; }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(245,158,11,0.5)} 70%{box-shadow:0 0 0 18px rgba(245,158,11,0)} 100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} }
  @keyframes prog { 0%{width:20%} 50%{width:75%} 100%{width:20%} }
`;

const C = {
  bg:"#0D1117", surface:"#161B22", elevated:"#1C2128",
  border:"#30363D", borderSoft:"#21262D",
  amber:"#F59E0B", amberDim:"rgba(245,158,11,0.12)", amberBorder:"rgba(245,158,11,0.25)",
  text:"#F0F6FC", textMid:"#C9D1D9", textMute:"#8B949E", textDim:"#484F58",
  green:"#10B981", purple:"#8B5CF6", red:"#EF4444", redDim:"rgba(239,68,68,0.1)",
};

const ICONS = {
  lock:        <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  shield:      <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  video:       <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>,
  folder:      <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
  folderPlus:  <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></>,
  upload:      <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  trash:       <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
  plus:        <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  x:           <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  eye:         <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff:      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>,
  logout:      <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  edit:        <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  grid:        <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  list:        <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  search:      <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  move:        <><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></>,
  info:        <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  warning:     <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  check:       <><polyline points="20 6 9 17 4 12"/></>,
  menu:        <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  chevronRight:<><polyline points="9 18 15 12 9 6"/></>,
  user:        <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  photo:       <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
};

const Icon = ({ name, size=20, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, display:"block" }}>
    {ICONS[name]}
  </svg>
);

const Spinner = ({ size=22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation:"spin 0.75s linear infinite", flexShrink:0 }}>
    <circle cx="12" cy="12" r="9" stroke={C.border} strokeWidth="3" fill="none"/>
    <path d="M12 3a9 9 0 0 1 9 9" stroke={C.amber} strokeWidth="3" fill="none" strokeLinecap="round"/>
  </svg>
);

const Badge = ({ children, color=C.green }) => (
  <span style={{ background:`${color}1a`, color, border:`1px solid ${color}33`, borderRadius:4, padding:"2px 7px", fontSize:11, fontWeight:600, display:"inline-flex", alignItems:"center", gap:4, flexShrink:0 }}>
    {children}
  </span>
);

function ToastStack({ toasts, dismiss }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => {
        const bg = t.type==="error"?C.red:t.type==="success"?C.green:C.amber;
        return (
          <div key={t.id} style={{ background:C.surface, border:`1px solid ${bg}44`, borderLeft:`3px solid ${bg}`, color:C.text, padding:"12px 16px", borderRadius:8, fontSize:13, fontWeight:500, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", display:"flex", alignItems:"center", gap:12, minWidth:280, maxWidth:360, animation:"slideUp 0.25s ease" }}>
            <Icon name={t.type==="error"?"warning":t.type==="success"?"check":"info"} size={16} color={bg}/>
            <span style={{ flex:1 }}>{t.message}</span>
            <button onClick={()=>dismiss(t.id)} style={{ background:"none", border:"none", color:C.textMute, cursor:"pointer", display:"flex" }}>
              <Icon name="x" size={14}/>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel="Confirm", danger=false, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onCancel}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:28, maxWidth:400, width:"100%", animation:"slideUp 0.2s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", gap:14, marginBottom:20 }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:danger?C.redDim:C.amberDim, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Icon name="warning" size={20} color={danger?C.red:C.amber}/>
          </div>
          <div>
            <h3 style={{ color:C.text, fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:600, marginBottom:6 }}>{title}</h3>
            <p style={{ color:C.textMute, fontSize:13, lineHeight:1.6 }}>{message}</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant={danger?"danger":"primary"} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, width=440 }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:28, width:"100%", maxWidth:width, animation:"slideUp 0.2s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ color:C.text, fontFamily:"'Space Grotesk',sans-serif", fontSize:17, fontWeight:600 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.textMute, cursor:"pointer", padding:4, borderRadius:6, display:"flex" }}><Icon name="x" size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant="primary", disabled=false, full=false, size="md" }) {
  const pad = size==="sm"?"7px 14px":"10px 20px";
  const fs  = size==="sm"?12:13;
  const V = {
    primary:{ background:disabled?"#92400E":C.amber, color:"#0D1117", border:"none" },
    ghost:  { background:"transparent", color:C.textMid, border:`1px solid ${C.border}` },
    danger: { background:C.redDim, color:C.red, border:`1px solid ${C.red}44` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...V[variant], borderRadius:8, padding:pad, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:fs, cursor:disabled?"not-allowed":"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, transition:"opacity 0.15s", width:full?"100%":undefined, opacity:disabled?0.6:1 }}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity="0.82"; }}
      onMouseLeave={e=>{ e.currentTarget.style.opacity="1"; }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, type="text", onKeyDown, autoFocus, icon, rightEl }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position:"relative" }}>
      {icon&&<span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:focus?C.amber:C.textMute, pointerEvents:"none", display:"flex" }}><Icon name={icon} size={16}/></span>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown} autoFocus={autoFocus}
        onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{ width:"100%", background:C.bg, border:`1px solid ${focus?C.amber:C.border}`, borderRadius:8, padding:`11px ${rightEl?44:14}px 11px ${icon?40:14}px`, color:C.text, fontFamily:"Inter,sans-serif", fontSize:14, outline:"none", transition:"border-color 0.2s", boxSizing:"border-box" }}
      />
      {rightEl&&<span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)" }}>{rightEl}</span>}
    </div>
  );
}

function DropZone({ onFiles }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();
  const handle = e => {
    e.preventDefault(); setDrag(false);
    const files = Array.from(e.dataTransfer?.files||e.target.files||[]);
    if (files.length) onFiles(files);
    if (ref.current) ref.current.value="";
  };
  return (
    <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={handle} onClick={()=>ref.current?.click()}
      style={{ border:`2px dashed ${drag?C.amber:C.border}`, borderRadius:12, padding:"36px 20px", textAlign:"center", cursor:"pointer", background:drag?C.amberDim:C.elevated, transition:"all 0.2s", userSelect:"none" }}>
      <input ref={ref} type="file" multiple accept="image/*,video/*" style={{ display:"none" }} onChange={handle}/>
      <div style={{ color:drag?C.amber:C.textMute, marginBottom:10, display:"flex", justifyContent:"center" }}><Icon name="upload" size={32}/></div>
      <p style={{ color:drag?C.amber:C.textMid, fontWeight:600, fontSize:14, marginBottom:4 }}>{drag?"Drop to encrypt & store":"Drag & drop photos or videos"}</p>
      <p style={{ color:C.textDim, fontSize:12 }}>or click to browse · Max 200 MB per file</p>
    </div>
  );
}

function UploadProgress({ items }) {
  if (!items.length) return null;
  return (
    <div style={{ position:"fixed", bottom:24, left:24, zIndex:9000, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16, minWidth:300, maxWidth:360, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", animation:"slideUp 0.25s ease" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <Spinner size={16}/>
        <span style={{ color:C.text, fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:600 }}>Encrypting & uploading…</span>
      </div>
      {items.map((item,i)=>(
        <div key={i} style={{ marginBottom:i<items.length-1?10:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ color:C.textMid, fontSize:12, maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</span>
            <span style={{ color:item.done?C.green:item.error?C.red:C.amber, fontSize:12, fontWeight:600 }}>{item.done?"✓":item.error?"✗":"…"}</span>
          </div>
          <div style={{ height:3, background:C.border, borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:item.done||item.error?"100%":"60%", background:item.error?C.red:item.done?C.green:C.amber, borderRadius:2, transition:"width 0.4s", animation:!item.done&&!item.error?"prog 1.8s ease infinite":"none" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfilePanel({ user, albums, media, onClose, onLogout }) {
  const photos=media.filter(m=>m.mediaType==="photo").length;
  const videos=media.filter(m=>m.mediaType==="video").length;
  const totalSize=media.reduce((s,m)=>s+(m.fileSize||0),0);
  const fmtSize=s=>s>1048576?`${(s/1048576).toFixed(1)} MB`:`${(s/1024).toFixed(0)} KB`;
  return (
    <Modal title="Your Profile" onClose={onClose}>
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:C.bg, borderRadius:10, marginBottom:20, border:`1px solid ${C.border}` }}>
        <div style={{ width:46, height:46, borderRadius:"50%", background:C.amberDim, border:`2px solid ${C.amber}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.amber, flexShrink:0 }}>
          <Icon name="user" size={22}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ color:C.text, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:15 }}>{user.fullName}</div>
          <div style={{ color:C.textMute, fontSize:12, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email}</div>
        </div>
        <Badge color={C.green}><Icon name="shield" size={10}/>Secured</Badge>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
        {[["Photos",photos,C.green],["Videos",videos,C.purple],["Albums",albums.length,C.amber],["Total Size",fmtSize(totalSize),C.textMid]].map(([l,v,c])=>(
          <div key={l} style={{ background:C.bg, borderRadius:8, padding:"12px 16px", border:`1px solid ${C.border}` }}>
            <div style={{ color:C.textDim, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{l}</div>
            <div style={{ color:c, fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ padding:"10px 14px", background:C.amberDim, border:`1px solid ${C.amberBorder}`, borderRadius:8, display:"flex", gap:8, alignItems:"center", marginBottom:20 }}>
        <Icon name="lock" size={14} color={C.amber}/>
        <span style={{ color:C.amber, fontSize:12 }}>All media is encrypted with AES-256</span>
      </div>
      <Btn variant="danger" full onClick={onLogout}><Icon name="logout" size={15}/>Sign Out</Btn>
    </Modal>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode]     = useState("login");
  const [form, setForm]     = useState({ fullName:"", email:"", password:"", pin:"" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      let data;
      if (mode==="register") {
        if (!form.fullName||!form.email||!form.password) throw new Error("Full name, email, and password are required.");
        if (form.password.length<8) throw new Error("Password must be at least 8 characters.");
        data=await api("/auth/register",{method:"POST",body:JSON.stringify({fullName:form.fullName,email:form.email,password:form.password,pin:form.pin||undefined})});
      } else {
        if (!form.email||!form.password) throw new Error("Email and password are required.");
        data=await api("/auth/login",{method:"POST",body:JSON.stringify({email:form.email,password:form.password})});
      }
      localStorage.setItem("phoenix_token",data.token);
      localStorage.setItem("phoenix_user",JSON.stringify(data.user));
      onAuth(data.user);
    } catch(e){ setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ width:"100%", maxWidth:400, animation:"fadeIn 0.4s ease" }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:76, height:76, background:C.surface, border:`2px solid ${C.amber}`, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", animation:"pulse-ring 2.5s ease-in-out infinite", color:C.amber }}>
            <Icon name="lock" size={32}/>
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", color:C.text, fontSize:30, fontWeight:700, letterSpacing:"-0.5px", marginBottom:6 }}>Phoenix Vault</h1>
          <p style={{ color:C.textMute, fontSize:13 }}>AES-256 encrypted media gallery</p>
        </div>
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:32 }}>
          <div style={{ display:"flex", background:C.bg, borderRadius:8, padding:3, marginBottom:24, gap:3 }}>
            {[["login","Sign In"],["register","Register"]].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ flex:1, padding:"9px 0", borderRadius:6, border:"none", background:mode===m?C.amber:"transparent", color:mode===m?"#0D1117":C.textMute, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>{l}</button>
            ))}
          </div>
          {error&&(
            <div style={{ background:C.redDim, border:`1px solid ${C.red}44`, borderRadius:8, padding:"10px 14px", color:C.red, fontSize:13, marginBottom:16, display:"flex", gap:8, alignItems:"flex-start" }}>
              <Icon name="warning" size={15} color={C.red}/>{error}
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {mode==="register"&&<Input value={form.fullName} onChange={set("fullName")} placeholder="Full name" icon="user"/>}
            <Input value={form.email} onChange={set("email")} placeholder="Email address" type="email" icon="info"/>
            <Input value={form.password} onChange={set("password")} placeholder="Password" type={showPass?"text":"password"} icon="lock" onKeyDown={e=>e.key==="Enter"&&submit()}
              rightEl={<button onClick={()=>setShowPass(s=>!s)} style={{ background:"none", border:"none", color:C.textMute, cursor:"pointer", display:"flex", padding:0 }}><Icon name={showPass?"eyeOff":"eye"} size={16}/></button>}
            />
            {mode==="register"&&<Input value={form.pin} onChange={set("pin")} placeholder="PIN (4–6 digits, optional)" icon="shield"/>}
          </div>
          <div style={{ marginTop:20 }}>
            <Btn onClick={submit} disabled={loading} full>
              {loading?<><Spinner size={16}/>{mode==="login"?"Authenticating…":"Creating account…"}</>:(mode==="login"?"Unlock Vault":"Create Account")}
            </Btn>
          </div>
        </div>
        <p style={{ textAlign:"center", color:C.textDim, fontSize:11, marginTop:20, lineHeight:1.7 }}>
          Hamdan Madu Gwary · U22/CPS/1064<br/>Dept. of Computer Science · Federal University Gashua
        </p>
      </div>
    </div>
  );
}

function MediaCard({ item, onView, onDelete, onMove }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ background:C.surface, border:`1px solid ${hover?C.amber:C.border}`, borderRadius:10, overflow:"hidden", cursor:"pointer", transform:hover?"translateY(-3px)":"none", transition:"all 0.18s", boxShadow:hover?"0 8px 24px rgba(0,0,0,0.4)":"none", animation:"fadeIn 0.25s ease" }}>
      <div style={{ aspectRatio:"1", background:C.bg, position:"relative", overflow:"hidden" }} onClick={onView}>
        {item.mediaType==="photo"?(
          <>
            <img src={`${API_BASE}/media/${item.id}/view`} alt={item.originalName} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} onError={e=>{e.target.style.display="none";}}/>
            {hover&&<div style={{ position:"absolute", inset:0, background:"rgba(245,158,11,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ background:"rgba(0,0,0,0.6)", borderRadius:"50%", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="eye" size={18} color={C.amber}/></div>
            </div>}
          </>
        ):(
          <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, color:C.purple }}>
            <Icon name="video" size={34}/>
            <span style={{ color:C.textDim, fontSize:10, fontWeight:700 }}>VIDEO</span>
            {hover&&<div style={{ position:"absolute", inset:0, background:"rgba(139,92,246,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ background:"rgba(0,0,0,0.6)", borderRadius:"50%", width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="eye" size={18} color={C.purple}/></div>
            </div>}
          </div>
        )}
        <div style={{ position:"absolute", top:6, left:6, background:"rgba(0,0,0,0.7)", borderRadius:4, padding:"2px 6px", display:"flex", alignItems:"center", gap:3 }}>
          <Icon name="lock" size={9} color={C.amber}/><span style={{ color:C.amber, fontSize:9, fontWeight:700 }}>ENC</span>
        </div>
      </div>
      <div style={{ padding:"8px 10px", borderTop:`1px solid ${C.borderSoft}` }}>
        <p style={{ color:C.textMid, fontSize:12, fontWeight:500, marginBottom:6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.originalName}</p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Badge color={item.mediaType==="photo"?C.green:C.purple}>{item.mediaType}</Badge>
          <div style={{ display:"flex", gap:2 }}>
            <button title="Move" onClick={e=>{e.stopPropagation();onMove();}} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", padding:4, borderRadius:4, display:"flex" }}
              onMouseEnter={e=>e.currentTarget.style.color=C.amber} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}><Icon name="move" size={13}/></button>
            <button title="Delete" onClick={e=>{e.stopPropagation();onDelete();}} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", padding:4, borderRadius:4, display:"flex" }}
              onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}><Icon name="trash" size={13}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaRow({ item, onView, onDelete, onMove }) {
  const [hover, setHover] = useState(false);
  const date = new Date(item.createdAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 14px", background:hover?C.elevated:C.surface, border:`1px solid ${hover?C.border:C.borderSoft}`, borderRadius:8, transition:"all 0.15s", animation:"fadeIn 0.2s ease" }}>
      <div style={{ width:40, height:40, borderRadius:8, background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", color:item.mediaType==="photo"?C.green:C.purple, flexShrink:0, cursor:"pointer" }} onClick={onView}>
        <Icon name={item.mediaType==="photo"?"photo":"video"} size={20}/>
      </div>
      <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={onView}>
        <p style={{ color:C.textMid, fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{item.originalName}</p>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <Badge color={item.mediaType==="photo"?C.green:C.purple}>{item.mediaType}</Badge>
          <span style={{ color:C.textDim, fontSize:11 }}>{(item.fileSize/1024).toFixed(1)} KB · {date}</span>
        </div>
      </div>
      <Badge color={C.amber}><Icon name="lock" size={10}/>AES-256</Badge>
      <div style={{ display:"flex", gap:4 }}>
        <button title="Move" onClick={e=>{e.stopPropagation();onMove();}} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", padding:6, borderRadius:6, display:"flex" }}
          onMouseEnter={e=>e.currentTarget.style.color=C.amber} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}><Icon name="move" size={15}/></button>
        <button title="Delete" onClick={e=>{e.stopPropagation();onDelete();}} style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", padding:6, borderRadius:6, display:"flex" }}
          onMouseEnter={e=>e.currentTarget.style.color=C.red} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}><Icon name="trash" size={15}/></button>
        <button onClick={e=>{e.stopPropagation();onView();}} style={{ background:C.amberDim, border:`1px solid ${C.amberBorder}`, color:C.amber, cursor:"pointer", padding:"5px 10px", borderRadius:6, display:"flex", alignItems:"center", gap:5, fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:600 }}>
          <Icon name="eye" size={13}/>View
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser]       = useState(()=>{ try{ return JSON.parse(localStorage.getItem("phoenix_user")); }catch{ return null; } });
  const [toasts, setToasts]   = useState([]);
  const [albums, setAlbums]   = useState([]);
  const [media, setMedia]     = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploadQueue, setUploadQueue]   = useState([]);
  const [viewItem, setViewItem] = useState(null);
  const [viewIdx, setViewIdx]   = useState(0);
  const [layout, setLayout]     = useState("grid");
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewAlbum, setShowNewAlbum]       = useState(false);
  const [newAlbumName, setNewAlbumName]       = useState("");
  const [editAlbum, setEditAlbum]             = useState(null);
  const [editAlbumName, setEditAlbumName]     = useState("");
  const [showMoveModal, setShowMoveModal]     = useState(null);
  const [showProfile, setShowProfile]         = useState(false);
  const [confirmDel, setConfirmDel]           = useState(null);
  const fileRef = useRef();

  const notify = useCallback((message,type="success")=>{
    const id=Date.now()+Math.random();
    setToasts(t=>[...t,{id,message,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000);
  },[]);
  const dismiss = id=>setToasts(t=>t.filter(x=>x.id!==id));
  const logout  = ()=>{ localStorage.clear(); setUser(null); };

  const fetchAlbums = useCallback(async()=>{
    try{ const d=await api("/albums"); setAlbums(d.albums); }catch(e){ notify(e.message,"error"); }
  },[notify]);

  const fetchMedia = useCallback(async()=>{
    setLoadingMedia(true);
    try{ const d=await api(activeAlbum?`/media?albumId=${activeAlbum._id}`:"/media"); setMedia(d.media); }
    catch(e){ notify(e.message,"error"); }
    finally{ setLoadingMedia(false); }
  },[activeAlbum,notify]);

  useEffect(()=>{ if(user){ fetchAlbums(); fetchMedia(); } },[user,fetchAlbums,fetchMedia]);

  const filteredMedia = useMemo(()=>
    media.filter(m=>filter==="all"||m.mediaType===filter)
         .filter(m=>!search||m.originalName?.toLowerCase().includes(search.toLowerCase()))
  ,[media,filter,search]);

  useEffect(()=>{
    if(!viewItem) return;
    const h=e=>{
      if(e.key==="ArrowRight") setViewIdx(i=>Math.min(i+1,filteredMedia.length-1));
      if(e.key==="ArrowLeft")  setViewIdx(i=>Math.max(i-1,0));
      if(e.key==="Escape")     setViewItem(null);
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[viewItem,filteredMedia.length]);

  const handleFiles = async files=>{
    setShowUploadModal(false);
    setUploadQueue(files.map(f=>({name:f.name,done:false,error:false})));
    let success=0;
    const token=localStorage.getItem("phoenix_token");
    for(let i=0;i<files.length;i++){
      try{
        const fd=new FormData(); fd.append("file",files[i]);
        if(activeAlbum) fd.append("albumId",activeAlbum._id);
        const res=await fetch(`${API_BASE}/media/upload`,{method:"POST",headers:{Authorization:`Bearer ${token}`},body:fd});
        const data=await res.json();
        if(!res.ok) throw new Error(data.message);
        success++;
        setUploadQueue(q=>q.map((x,j)=>j===i?{...x,done:true}:x));
      }catch(e){
        setUploadQueue(q=>q.map((x,j)=>j===i?{...x,error:true}:x));
        notify(`${files[i].name}: ${e.message}`,"error");
      }
    }
    setTimeout(()=>setUploadQueue([]),1800);
    if(success){ notify(`${success} file${success>1?"s":""} encrypted & stored.`); fetchMedia(); }
  };

  const handleDelete = async item=>{
    setConfirmDel(null);
    try{
      await api(`/media/${item.id}`,{method:"DELETE"});
      notify("Media permanently deleted.");
      if(viewItem?.id===item.id) setViewItem(null);
      fetchMedia();
    }catch(e){ notify(e.message,"error"); }
  };

  const handleDeleteAlbum = async album=>{
    setConfirmDel(null);
    try{
      await api(`/albums/${album._id}`,{method:"DELETE"});
      notify("Album deleted.");
      if(activeAlbum?._id===album._id) setActiveAlbum(null);
      fetchAlbums(); fetchMedia();
    }catch(e){ notify(e.message,"error"); }
  };

  const handleCreateAlbum = async()=>{
    if(!newAlbumName.trim()) return;
    try{ await api("/albums",{method:"POST",body:JSON.stringify({name:newAlbumName.trim()})}); notify("Album created."); setNewAlbumName(""); setShowNewAlbum(false); fetchAlbums(); }
    catch(e){ notify(e.message,"error"); }
  };

  const handleRenameAlbum = async()=>{
    if(!editAlbumName.trim()) return;
    try{ await api(`/albums/${editAlbum._id}`,{method:"PUT",body:JSON.stringify({name:editAlbumName.trim()})}); notify("Album renamed."); setEditAlbum(null); setEditAlbumName(""); fetchAlbums(); }
    catch(e){ notify(e.message,"error"); }
  };

  const handleMove = async id=>{
    try{ await api(`/media/${showMoveModal.id}/move`,{method:"PUT",body:JSON.stringify({albumId:id||null})}); notify("Media moved."); setShowMoveModal(null); fetchMedia(); }
    catch(e){ notify(e.message,"error"); }
  };

  if(!user) return <AuthScreen onAuth={u=>setUser(u)}/>;

  const photos=media.filter(m=>m.mediaType==="photo");
  const videos=media.filter(m=>m.mediaType==="video");
  const nav=active=>({ display:"flex", alignItems:"center", gap:11, padding:sidebarOpen?"9px 14px":"9px 0", margin:"2px 8px", borderRadius:8, cursor:"pointer", background:active?C.amberDim:"transparent", color:active?C.amber:C.textMute, fontSize:13, fontWeight:active?600:400, border:`1px solid ${active?C.amberBorder:"transparent"}`, transition:"all 0.15s", justifyContent:sidebarOpen?"flex-start":"center" });

  return (
    <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:"Inter,sans-serif", overflow:"hidden" }}>
      <style>{GLOBAL_CSS}</style>

      {/* SIDEBAR */}
      <aside style={{ width:sidebarOpen?244:58, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", transition:"width 0.22s ease", overflow:"hidden", flexShrink:0 }}>
        <div style={{ padding:sidebarOpen?"18px 18px 14px":"18px 0 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, justifyContent:sidebarOpen?"flex-start":"center" }}>
          <div style={{ color:C.amber, flexShrink:0 }}><Icon name="lock" size={22}/></div>
          {sidebarOpen&&<span style={{ fontFamily:"'Space Grotesk',sans-serif", color:C.text, fontWeight:700, fontSize:17, whiteSpace:"nowrap" }}>Phoenix</span>}
        </div>
        <div style={{ flex:1, overflow:"auto", paddingTop:8 }}>
          {sidebarOpen&&(
            <div style={{ margin:"4px 10px 10px", padding:"10px 12px", background:C.bg, borderRadius:8, border:`1px solid ${C.border}`, display:"flex", gap:8 }}>
              {[["PHOTOS",photos.length,C.green],["VIDEOS",videos.length,C.purple],["ALBUMS",albums.length,C.amber]].map(([l,v,c])=>(
                <div key={l} style={{ textAlign:"center", flex:1 }}>
                  <div style={{ color:c, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:16 }}>{v}</div>
                  <div style={{ color:C.textDim, fontSize:9, fontWeight:700 }}>{l}</div>
                </div>
              ))}
            </div>
          )}
          <div style={nav(!activeAlbum)} onClick={()=>setActiveAlbum(null)}>
            <Icon name="grid" size={17}/>
            {sidebarOpen&&<><span>All Media</span>{!activeAlbum&&<div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:C.amber }}/>}</>}
          </div>
          {sidebarOpen&&<div style={{ padding:"10px 16px 4px", color:C.textDim, fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase" }}>Albums</div>}
          {albums.map(album=>(
            <div key={album._id} style={{ ...nav(activeAlbum?._id===album._id), justifyContent:"space-between" }} onClick={()=>setActiveAlbum(album)}>
              <div style={{ display:"flex", alignItems:"center", gap:11, minWidth:0 }}>
                <Icon name="folder" size={17}/>
                {sidebarOpen&&<span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{album.name}</span>}
              </div>
              {sidebarOpen&&(
                <div style={{ display:"flex", gap:2, flexShrink:0 }} onClick={e=>e.stopPropagation()}>
                  <button style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", padding:3, borderRadius:4, display:"flex" }} onClick={()=>{setEditAlbum(album);setEditAlbumName(album.name);}}>
                    <Icon name="edit" size={12}/>
                  </button>
                  <button style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", padding:3, borderRadius:4, display:"flex" }} onClick={()=>setConfirmDel({album})}>
                    <Icon name="trash" size={12}/>
                  </button>
                </div>
              )}
            </div>
          ))}
          {sidebarOpen?(
            <button style={{ ...nav(false), margin:"4px 8px", width:"calc(100% - 16px)", border:`1px dashed ${C.border}` }} onClick={()=>setShowNewAlbum(true)}>
              <Icon name="folderPlus" size={17}/><span style={{ color:C.textMute }}>New Album</span>
            </button>
          ):(
            <div style={nav(false)} onClick={()=>setShowNewAlbum(true)} title="New Album"><Icon name="plus" size={17}/></div>
          )}
        </div>
        <div style={{ borderTop:`1px solid ${C.border}`, padding:"8px" }}>
          <div style={{ ...nav(false), justifyContent:sidebarOpen?"flex-start":"center" }} onClick={()=>setShowProfile(true)}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:C.amberDim, border:`1px solid ${C.amberBorder}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.amber, flexShrink:0 }}>
              <Icon name="user" size={14}/>
            </div>
            {sidebarOpen&&<>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ color:C.textMid, fontSize:12, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.fullName}</div>
              </div>
              <Icon name="chevronRight" size={14} color={C.textDim}/>
            </>}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ height:58, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, padding:"0 20px", flexShrink:0, background:C.surface }}>
          <button onClick={()=>setSidebarOpen(s=>!s)} style={{ background:"none", border:"none", color:C.textMute, cursor:"pointer", padding:6, borderRadius:6, display:"flex" }}>
            <Icon name="menu" size={20}/>
          </button>
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", color:C.text, fontSize:16, fontWeight:600, whiteSpace:"nowrap" }}>
              {activeAlbum?activeAlbum.name:"All Media"}
            </h2>
            {activeAlbum&&<Badge color={C.amber}>{media.length} items</Badge>}
          </div>
          <div style={{ width:200 }}>
            <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" icon="search"/>
          </div>
          <div style={{ display:"flex", background:C.bg, borderRadius:8, padding:3, gap:2 }}>
            {[["all","All"],["photo","Photos"],["video","Videos"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)} style={{ padding:"5px 11px", borderRadius:6, border:"none", background:filter===v?C.amber:"transparent", color:filter===v?"#0D1117":C.textMute, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:12, cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:2 }}>
            {[["grid","grid"],["list","list"]].map(([v,icon])=>(
              <button key={v} onClick={()=>setLayout(v)} style={{ background:layout===v?C.amberDim:"none", border:layout===v?`1px solid ${C.amberBorder}`:"1px solid transparent", color:layout===v?C.amber:C.textMute, borderRadius:6, padding:6, cursor:"pointer", display:"flex" }}>
                <Icon name={icon} size={16}/>
              </button>
            ))}
          </div>
          <Btn onClick={()=>setShowUploadModal(true)}><Icon name="upload" size={15}/>Upload</Btn>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{ display:"none" }} onChange={e=>handleFiles(Array.from(e.target.files))}/>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:"auto", padding:24 }}>
          {loadingMedia?(
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:240, gap:12, color:C.textMute }}>
              <Spinner size={28}/><span>Fetching encrypted media…</span>
            </div>
          ):filteredMedia.length===0?(
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:320, gap:16, animation:"fadeIn 0.3s ease" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", border:`2px dashed ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.textDim }}><Icon name="lock" size={28}/></div>
              <div style={{ textAlign:"center" }}>
                <p style={{ color:C.textMid, fontSize:15, fontWeight:600, marginBottom:6 }}>{search?"No results found":"Vault is empty"}</p>
                <p style={{ color:C.textMute, fontSize:13 }}>{search?`No media matches "${search}"`:"Upload photos or videos to encrypt and store them here."}</p>
              </div>
              {!search&&<Btn onClick={()=>setShowUploadModal(true)}><Icon name="upload" size={15}/>Add Media</Btn>}
            </div>
          ):layout==="grid"?(
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:12, animation:"fadeIn 0.25s ease" }}>
              {filteredMedia.map((item,idx)=>(
                <MediaCard key={item.id} item={item} onView={()=>{setViewItem(item);setViewIdx(idx);}} onDelete={()=>setConfirmDel({item})} onMove={()=>setShowMoveModal(item)}/>
              ))}
            </div>
          ):(
            <div style={{ display:"flex", flexDirection:"column", gap:2, animation:"fadeIn 0.25s ease" }}>
              {filteredMedia.map((item,idx)=>(
                <MediaRow key={item.id} item={item} onView={()=>{setViewItem(item);setViewIdx(idx);}} onDelete={()=>setConfirmDel({item})} onMove={()=>setShowMoveModal(item)}/>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* VIEWER */}
      {viewItem&&(()=>{
        const cur=filteredMedia[viewIdx]||viewItem;
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:3000, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }} onClick={()=>setViewItem(null)}>
            <div style={{ position:"absolute", top:16, right:16, display:"flex", gap:8 }}>
              <button onClick={e=>{e.stopPropagation();setConfirmDel({item:cur});setViewItem(null);}} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", borderRadius:8, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="trash" size={16}/></button>
              <button onClick={()=>setViewItem(null)} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", borderRadius:8, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="x" size={18}/></button>
            </div>
            {viewIdx>0&&<button onClick={e=>{e.stopPropagation();setViewIdx(i=>i-1);}} style={{ position:"absolute", left:16, background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", borderRadius:8, width:44, height:44, cursor:"pointer", fontSize:24, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>}
            {viewIdx<filteredMedia.length-1&&<button onClick={e=>{e.stopPropagation();setViewIdx(i=>i+1);}} style={{ position:"absolute", right:16, background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", borderRadius:8, width:44, height:44, cursor:"pointer", fontSize:24, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>}
            <div style={{ maxWidth:"90vw", maxHeight:"85vh", display:"flex", flexDirection:"column", alignItems:"center", gap:14 }} onClick={e=>e.stopPropagation()}>
              {cur.mediaType==="photo"?(
                <img src={`${API_BASE}/media/${cur.id}/view`} alt={cur.originalName} style={{ maxWidth:"88vw", maxHeight:"76vh", borderRadius:8, objectFit:"contain", boxShadow:"0 20px 60px rgba(0,0,0,0.8)" }}/>
              ):(
                <video src={`${API_BASE}/media/${cur.id}/view`} controls autoPlay style={{ maxWidth:"88vw", maxHeight:"76vh", borderRadius:8 }}/>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 16px", background:"rgba(255,255,255,0.06)", borderRadius:8 }}>
                <span style={{ color:"#fff", fontWeight:500, fontSize:13, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{cur.originalName}</span>
                <Badge color={cur.mediaType==="photo"?C.green:C.purple}>{cur.mediaType}</Badge>
                <span style={{ color:C.textMute, fontSize:12 }}>{(cur.fileSize/1024).toFixed(1)} KB</span>
                <Badge color={C.amber}><Icon name="lock" size={10}/>AES-256</Badge>
                <span style={{ color:C.textDim, fontSize:11 }}>{viewIdx+1}/{filteredMedia.length}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODALS */}
      {showUploadModal&&(
        <Modal title="Upload Media" onClose={()=>setShowUploadModal(false)}>
          <p style={{ color:C.textMute, fontSize:13, marginBottom:16 }}>Files are encrypted with AES-256 immediately on upload.{activeAlbum&&<><br/>Uploading to: <strong style={{ color:C.amber }}>{activeAlbum.name}</strong></>}</p>
          <DropZone onFiles={files=>{setShowUploadModal(false);handleFiles(files);}}/>
          <div style={{ display:"flex", justifyContent:"center", marginTop:12 }}>
            <button onClick={()=>{setShowUploadModal(false);fileRef.current?.click();}} style={{ background:"none", border:"none", color:C.textMute, cursor:"pointer", fontSize:12 }}>or use the file picker instead</button>
          </div>
        </Modal>
      )}
      {showNewAlbum&&(
        <Modal title="New Album" onClose={()=>{setShowNewAlbum(false);setNewAlbumName("");}}>
          <Input value={newAlbumName} onChange={e=>setNewAlbumName(e.target.value)} placeholder="Album name…" icon="folder" onKeyDown={e=>e.key==="Enter"&&handleCreateAlbum()} autoFocus/>
          <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
            <Btn variant="ghost" onClick={()=>setShowNewAlbum(false)}>Cancel</Btn>
            <Btn onClick={handleCreateAlbum}><Icon name="folderPlus" size={15}/>Create Album</Btn>
          </div>
        </Modal>
      )}
      {editAlbum&&(
        <Modal title="Rename Album" onClose={()=>setEditAlbum(null)}>
          <Input value={editAlbumName} onChange={e=>setEditAlbumName(e.target.value)} placeholder="Album name…" icon="edit" onKeyDown={e=>e.key==="Enter"&&handleRenameAlbum()} autoFocus/>
          <div style={{ display:"flex", gap:10, marginTop:16, justifyContent:"flex-end" }}>
            <Btn variant="ghost" onClick={()=>setEditAlbum(null)}>Cancel</Btn>
            <Btn onClick={handleRenameAlbum}>Save Changes</Btn>
          </div>
        </Modal>
      )}
      {showMoveModal&&(
        <Modal title="Move to Album" onClose={()=>setShowMoveModal(null)}>
          <p style={{ color:C.textMute, fontSize:13, marginBottom:14 }}>Moving: <strong style={{ color:C.textMid }}>{showMoveModal.originalName}</strong></p>
          <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:280, overflow:"auto" }}>
            {[{_id:null,name:"All Media (no album)",icon:"grid"},...albums.map(a=>({...a,icon:"folder"}))].map(a=>{
              const isActive=a._id===null?!showMoveModal.album:showMoveModal.album===a._id;
              return (
                <button key={a._id||"none"} onClick={()=>handleMove(a._id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:isActive?C.amberDim:C.bg, border:`1px solid ${isActive?C.amberBorder:C.border}`, borderRadius:8, color:isActive?C.amber:C.textMid, cursor:"pointer", fontFamily:"Inter,sans-serif", fontSize:13, textAlign:"left" }}>
                  <Icon name={a.icon} size={16}/>
                  <span style={{ flex:1 }}>{a.name}</span>
                  {a.mediaCount!==undefined&&<span style={{ color:C.textDim, fontSize:11 }}>{a.mediaCount} items</span>}
                  {isActive&&<Icon name="check" size={14} color={C.amber}/>}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop:14, textAlign:"right" }}><Btn variant="ghost" onClick={()=>setShowMoveModal(null)}>Cancel</Btn></div>
        </Modal>
      )}
      {showProfile&&<ProfilePanel user={user} albums={albums} media={media} onClose={()=>setShowProfile(false)} onLogout={logout}/>}
      {confirmDel?.item&&<ConfirmDialog title="Delete Media" message={`Permanently delete "${confirmDel.item.originalName}"? This cannot be undone.`} confirmLabel="Delete Forever" danger onConfirm={()=>handleDelete(confirmDel.item)} onCancel={()=>setConfirmDel(null)}/>}
      {confirmDel?.album&&<ConfirmDialog title="Delete Album" message={`Delete album "${confirmDel.album.name}" and ALL its media? This is permanent.`} confirmLabel="Delete Album & Media" danger onConfirm={()=>handleDeleteAlbum(confirmDel.album)} onCancel={()=>setConfirmDel(null)}/>}
      <UploadProgress items={uploadQueue}/>
      <ToastStack toasts={toasts} dismiss={dismiss}/>
    </div>
  );
}
