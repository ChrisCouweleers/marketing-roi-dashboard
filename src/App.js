import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart,
} from "recharts";

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0B0F1A", card: "#111827", cardAlt: "#0F172A", cardHover: "#1A2235",
  border: "#1E293B", borderLight: "#2A3650",
  accent: "#06D6A0", accentDim: "rgba(6,214,160,0.12)",
  warn: "#FFD166", danger: "#EF476F", info: "#118AB2", purple: "#8338EC", cyan: "#06B6D4",
  text: "#F1F5F9", muted: "#94A3B8", dim: "#64748B", faint: "#475569",
  dragOver: "rgba(6,214,160,0.08)", dragBorder: "rgba(6,214,160,0.4)",
};
const CH_COLORS = [C.accent, C.info, C.purple, C.warn, C.cyan, C.danger, "#F472B6", "#A78BFA"];

// ─── Responsive Hook ────────────────────────────────────────────────────────
function useScreen() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { isMobile: w < 640, isTablet: w < 1024, w };
}

// ─── Animated Counter Hook ──────────────────────────────────────────────────
function useAnimatedValue(target, duration = 800) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    const to = typeof target === "number" ? target : parseFloat(String(target).replace(/[^0-9.\-]/g, "")) || 0;
    if (isNaN(to)) { prev.current = 0; setDisplay(0); return; }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(from + (to - from) * ease);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    prev.current = to;
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt$ = v => { if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`; return `$${v.toLocaleString()}`; };
const fmtN = v => { if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `${(v/1e3).toFixed(1)}K`; return v.toLocaleString(); };
const pct = (a,b) => b ? ((a/b)*100).toFixed(1) : "0.0";
const sum = (arr, k) => arr.reduce((s,r) => s + (Number(r[k]) || 0), 0);

// ─── Default seed data ──────────────────────────────────────────────────────
const defaultMonths = () => [
  { month:"Jul", spend:42000, revenue:126000, leads:1240 },
  { month:"Aug", spend:45000, revenue:148500, leads:1380 },
  { month:"Sep", spend:48000, revenue:158400, leads:1420 },
  { month:"Oct", spend:51000, revenue:178500, leads:1580 },
  { month:"Nov", spend:55000, revenue:203500, leads:1720 },
  { month:"Dec", spend:52000, revenue:197600, leads:1650 },
  { month:"Jan", spend:58000, revenue:232000, leads:1890 },
  { month:"Feb", spend:62000, revenue:260400, leads:2040 },
];
const defaultChannels = () => [
  { name:"Paid Search", spend:148000, revenue:518000 },
  { name:"Social Media", spend:96000, revenue:278400 },
  { name:"Email", spend:24000, revenue:168000 },
  { name:"Display", spend:68000, revenue:142800 },
  { name:"Content/SEO", spend:38000, revenue:228000 },
  { name:"Events", spend:39000, revenue:169800 },
];
const defaultCampaigns = () => [
  { name:"Q4 Product Launch", channel:"Multi-channel", spend:85000, revenue:340000, status:"completed" },
  { name:"Brand Awareness Push", channel:"Social + Display", spend:62000, revenue:136400, status:"active" },
  { name:"Email Nurture Series", channel:"Email", spend:12000, revenue:96000, status:"active" },
  { name:"Webinar Funnel", channel:"Content + Paid", spend:28000, revenue:140000, status:"active" },
  { name:"Retargeting Campaign", channel:"Display", spend:34000, revenue:119000, status:"active" },
  { name:"SEO Content Blitz", channel:"Content/SEO", spend:18000, revenue:108000, status:"active" },
];
const defaultFunnel = () => [
  { stage:"Impressions", value:2840000 },
  { stage:"Clicks", value:142000 },
  { stage:"Leads", value:12920 },
  { stage:"MQLs", value:5168 },
  { stage:"SQLs", value:1808 },
  { stage:"Closed Won", value:434 },
];
const defaultGoals = () => ({
  revenue: 1500000,
  spend: 450000,
  roas: 3.5,
  leads: 15000,
  cpl: 30,
});

// ─── Shared UI primitives ────────────────────────────────────────────────────
const Tip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1A2235", border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px", boxShadow:"0 8px 32px rgba(0,0,0,.4)" }}>
      <div style={{ color:C.muted, fontSize:11, fontWeight:600, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:p.color, flexShrink:0 }} />
          <span style={{ color:C.muted, fontSize:11 }}>{p.name}:</span>
          <span style={{ color:C.text, fontSize:11, fontWeight:600 }}>{fmt ? fmt(p.value, p.name) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Export Helpers ──────────────────────────────────────────────────────────
function exportCSV(months, channels, campaigns, funnel) {
  let csv = "MARKETING ROI DASHBOARD EXPORT\n\n";
  csv += "MONTHLY PERFORMANCE\nMonth,Spend,Revenue,Leads,ROAS,CPL\n";
  months.forEach(m => { csv += `${m.month},${m.spend},${m.revenue},${m.leads},${m.spend?(m.revenue/m.spend).toFixed(2):"0"},${m.leads?(m.spend/m.leads).toFixed(2):"0"}\n`; });
  csv += `Totals,${sum(months,"spend")},${sum(months,"revenue")},${sum(months,"leads")},,\n\n`;
  csv += "CHANNEL PERFORMANCE\nChannel,Spend,Revenue,ROI %\n";
  channels.forEach(ch => { csv += `${ch.name},${ch.spend},${ch.revenue},${ch.spend?Math.round(((ch.revenue-ch.spend)/ch.spend)*100):0}%\n`; });
  csv += "\nCAMPAIGNS\nCampaign,Channel,Spend,Revenue,ROI %,Status\n";
  campaigns.forEach(cp => { csv += `"${cp.name}","${cp.channel}",${cp.spend},${cp.revenue},${cp.spend?Math.round(((cp.revenue-cp.spend)/cp.spend)*100):0}%,${cp.status}\n`; });
  csv += "\nFUNNEL\nStage,Volume,Conversion Rate\n";
  funnel.forEach((f,i) => { csv += `${f.stage},${f.value},${i===0?"—":`${pct(f.value,funnel[i-1].value)}%`}\n`; });
  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "marketing-roi-report.csv"; a.click(); URL.revokeObjectURL(url);
}

function exportPDF(months, channels, campaigns, funnel) {
  const totalSpend=sum(months,"spend"), totalRev=sum(months,"revenue"), totalLeads=sum(months,"leads");
  const blendedROAS=totalSpend?(totalRev/totalSpend).toFixed(2):"0", avgCPL=totalLeads?(totalSpend/totalLeads).toFixed(2):"0";
  const eCh=channels.map(ch=>({...ch,roi:ch.spend?Math.round(((ch.revenue-ch.spend)/ch.spend)*100):0}));
  const eCp=campaigns.map(cp=>({...cp,roi:cp.spend?Math.round(((cp.revenue-cp.spend)/cp.spend)*100):0}));
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Marketing ROI Report</title><style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;background:#fff;color:#1a1a2e;padding:48px;max-width:1000px;margin:0 auto}
h1{font-size:28px;font-weight:800;margin-bottom:4px}h2{font-size:18px;font-weight:700;margin:32px 0 14px;border-bottom:2px solid #06D6A0;padding-bottom:6px}
.subtitle{color:#64748B;font-size:13px;margin-bottom:32px}.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px}
.kpi{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;text-align:center}
.kpi-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748B;margin-bottom:6px}
.kpi-value{font-size:22px;font-weight:800;font-family:'JetBrains Mono',monospace}
table{width:100%;border-collapse:collapse;margin:8px 0 20px;font-size:13px}
th{background:#F1F5F9;padding:10px 14px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748B;border-bottom:2px solid #E2E8F0}
td{padding:10px 14px;border-bottom:1px solid #E2E8F0}td.mono{font-family:'JetBrains Mono',monospace}
.status{font-size:10px;font-weight:600;text-transform:uppercase;padding:2px 8px;border-radius:4px}
.status-active{background:rgba(6,214,160,.12);color:#059669}.status-completed{background:rgba(131,56,236,.1);color:#7C3AED}.status-paused{background:rgba(255,209,102,.12);color:#D97706}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8;text-align:center}
@media print{body{padding:24px}}@media(max-width:640px){.kpi-grid{grid-template-columns:repeat(2,1fr)}body{padding:16px}}
</style></head><body>
<h1>Marketing ROI Report</h1><p class="subtitle">Generated ${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
<div class="kpi-grid"><div class="kpi"><div class="kpi-label">Total Revenue</div><div class="kpi-value">${fmt$(totalRev)}</div></div>
<div class="kpi"><div class="kpi-label">Total Spend</div><div class="kpi-value">${fmt$(totalSpend)}</div></div>
<div class="kpi"><div class="kpi-label">Blended ROAS</div><div class="kpi-value">${blendedROAS}x</div></div>
<div class="kpi"><div class="kpi-label">Total Leads</div><div class="kpi-value">${totalLeads.toLocaleString()}</div></div>
<div class="kpi"><div class="kpi-label">Avg CPL</div><div class="kpi-value">$${avgCPL}</div></div></div>
<h2>Monthly Performance</h2><table><thead><tr><th>Month</th><th>Spend</th><th>Revenue</th><th>Leads</th><th>ROAS</th><th>CPL</th></tr></thead><tbody>
${months.map(m=>`<tr><td>${m.month}</td><td class="mono">${fmt$(m.spend)}</td><td class="mono">${fmt$(m.revenue)}</td><td class="mono">${(m.leads||0).toLocaleString()}</td><td class="mono">${m.spend?(m.revenue/m.spend).toFixed(2):"—"}x</td><td class="mono">$${m.leads?(m.spend/m.leads).toFixed(2):"—"}</td></tr>`).join("")}
</tbody></table>
<h2>Channel Performance</h2><table><thead><tr><th>Channel</th><th>Spend</th><th>Revenue</th><th>ROI</th></tr></thead><tbody>
${eCh.map(ch=>`<tr><td>${ch.name}</td><td class="mono">${fmt$(ch.spend)}</td><td class="mono">${fmt$(ch.revenue)}</td><td class="mono">${ch.roi}%</td></tr>`).join("")}
</tbody></table>
<h2>Campaign Performance</h2><table><thead><tr><th>Campaign</th><th>Channel</th><th>Spend</th><th>Revenue</th><th>ROI</th><th>Status</th></tr></thead><tbody>
${eCp.map(c=>`<tr><td>${c.name}</td><td>${c.channel}</td><td class="mono">${fmt$(c.spend)}</td><td class="mono">${fmt$(c.revenue)}</td><td class="mono">${c.roi}%</td><td><span class="status status-${c.status}">${c.status}</span></td></tr>`).join("")}
</tbody></table>
<h2>Marketing Funnel</h2><table><thead><tr><th>Stage</th><th>Volume</th><th>Conversion Rate</th></tr></thead><tbody>
${funnel.map((f,i)=>`<tr><td>${f.stage}</td><td class="mono">${fmtN(f.value)}</td><td class="mono">${i===0?"—":pct(f.value,funnel[i-1].value)+"%"}</td></tr>`).join("")}
</tbody></table>
${funnel.length>=2?`<p style="margin-top:10px;font-size:13px;color:#64748B;">Overall conversion: <strong style="color:#059669;font-family:'JetBrains Mono',monospace">${pct(funnel[funnel.length-1].value,funnel[0].value)}%</strong></p>`:""}
<div class="footer">Marketing ROI Dashboard — Report generated automatically</div></body></html>`;
  const w=window.open("","_blank"); w.document.write(html); w.document.close(); setTimeout(()=>{w.print();},600);
}

// ─── Drag & Drop Hook ───────────────────────────────────────────────────────
function useDragReorder(items, setItems) {
  const dragIdx=useRef(null); const[draggedOver,setDraggedOver]=useState(null);
  const onDragStart=(e,idx)=>{dragIdx.current=idx;e.dataTransfer.effectAllowed="move";};
  const onDragOver=(e,idx)=>{e.preventDefault();e.dataTransfer.dropEffect="move";setDraggedOver(idx);};
  const onDragLeave=()=>setDraggedOver(null);
  const onDrop=(e,idx)=>{e.preventDefault();const from=dragIdx.current;if(from===null||from===idx){setDraggedOver(null);return;}const u=[...items];const[m]=u.splice(from,1);u.splice(idx,0,m);setItems(u);dragIdx.current=null;setDraggedOver(null);};
  const onDragEnd=()=>{dragIdx.current=null;setDraggedOver(null);};
  const moveUp=(idx)=>{if(idx<=0)return;const u=[...items];[u[idx-1],u[idx]]=[u[idx],u[idx-1]];setItems(u);};
  const moveDown=(idx)=>{if(idx>=items.length-1)return;const u=[...items];[u[idx],u[idx+1]]=[u[idx+1],u[idx]];setItems(u);};
  return{draggedOver,onDragStart,onDragOver,onDragLeave,onDrop,onDragEnd,moveUp,moveDown};
}

function DragHandle(){return(
  <div style={{cursor:"grab",display:"flex",flexDirection:"column",gap:2,padding:"6px 4px",opacity:.4,flexShrink:0,alignItems:"center",justifyContent:"center"}}>
    {[0,1,2].map(k=><div key={k} style={{display:"flex",gap:2}}><span style={{width:3,height:3,borderRadius:"50%",background:C.muted}}/><span style={{width:3,height:3,borderRadius:"50%",background:C.muted}}/></div>)}
  </div>
);}
function MobileReorder({drag,idx,total}){return(
  <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
    <button onClick={()=>drag.moveUp(idx)} disabled={idx===0} style={{background:"none",border:"none",color:idx===0?C.border:C.muted,fontSize:14,cursor:idx===0?"default":"pointer",padding:0,lineHeight:1}}>▲</button>
    <button onClick={()=>drag.moveDown(idx)} disabled={idx===total-1} style={{background:"none",border:"none",color:idx===total-1?C.border:C.muted,fontSize:14,cursor:idx===total-1?"default":"pointer",padding:0,lineHeight:1}}>▼</button>
  </div>
);}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA INPUT MODE
// ═══════════════════════════════════════════════════════════════════════════════
const inputLabel={color:C.dim,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5,display:"block"};
const inputStyle={width:"100%",padding:"9px 12px",fontSize:14,fontFamily:"'JetBrains Mono',monospace",background:C.cardAlt,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,outline:"none",boxSizing:"border-box",transition:"border .2s"};
const focusRing=(e)=>e.target.style.borderColor=C.accent;
const blurRing=(e)=>e.target.style.borderColor=C.border;

function InputField({label,value,onChange,type="text",placeholder=""}){return(
  <div style={{flex:1,minWidth:0}}><label style={inputLabel}>{label}</label>
    <input style={inputStyle} value={value} placeholder={placeholder} onChange={e=>onChange(type==="number"?(e.target.value===""?"":Number(e.target.value)):e.target.value)} type={type} onFocus={focusRing} onBlur={blurRing}/></div>
);}
function SectionCard({title,subtitle,children,action}){return(
  <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,marginBottom:20,overflow:"hidden"}}>
    <div style={{padding:"16px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
      <div><h3 style={{margin:0,fontSize:15,fontWeight:700,color:C.text}}>{title}</h3>{subtitle&&<p style={{margin:"3px 0 0",fontSize:12,color:C.dim}}>{subtitle}</p>}</div>{action}
    </div><div style={{padding:"0 16px 16px"}}>{children}</div></div>
);}
function AddBtn({onClick,label}){return <button onClick={onClick} style={{background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{label}</button>;}
function RemoveBtn({onClick}){return <button onClick={onClick} style={{background:"rgba(239,71,111,.1)",color:C.danger,border:"none",borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:16,lineHeight:1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>;}

function DataInputMode({months,setMonths,channels,setChannels,campaigns,setCampaigns,funnel,setFunnel,goals,setGoals,onLaunch}){
  const{isMobile}=useScreen();
  const updateRow=(arr,setArr,idx,key,val)=>{const n=[...arr];n[idx]={...n[idx],[key]:val};setArr(n);};
  const addRow=(arr,setArr,template)=>setArr([...arr,template]);
  const removeRow=(arr,setArr,idx)=>{if(arr.length>1){const n=[...arr];n.splice(idx,1);setArr(n);}};
  const monthsDrag=useDragReorder(months,setMonths);
  const channelsDrag=useDragReorder(channels,setChannels);
  const campaignsDrag=useDragReorder(campaigns,setCampaigns);
  const funnelDrag=useDragReorder(funnel,setFunnel);
  const dragRowStyle=(drag,i)=>({background:drag.draggedOver===i?C.dragOver:"transparent",borderTop:drag.draggedOver===i?`2px solid ${C.dragBorder}`:"2px solid transparent",transition:"background .15s, border .15s"});

  const tabs=[
    {id:"monthly",label:isMobile?"Monthly":"Monthly Data",icon:"📅"},
    {id:"channels",label:"Channels",icon:"📡"},
    {id:"campaigns",label:"Campaigns",icon:"🚀"},
    {id:"funnel",label:"Funnel",icon:"🔽"},
    {id:"goals",label:"Goals",icon:"🎯"},
  ];
  const[tab,setTab]=useState("monthly");

  return(
    <div>
      <div style={{background:`linear-gradient(135deg, ${C.accent}10, ${C.info}08)`,border:`1px solid ${C.accent}20`,borderRadius:14,padding:isMobile?"14px 16px":"18px 24px",marginBottom:20,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:20,flexShrink:0,marginTop:1}}>💡</span>
        <div><div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Enter your marketing data to generate your dashboard</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>Fill in each tab below. Sample data is pre-loaded. {isMobile?"Use ▲▼ to reorder rows.":"Drag to reorder rows."} Set targets in the <strong style={{color:C.accent}}>Goals</strong> tab, then click <strong style={{color:C.accent}}>Generate Dashboard</strong>.</div></div>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>
        {tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{padding:isMobile?"8px 12px":"10px 20px",fontSize:isMobile?12:13,fontWeight:600,cursor:"pointer",background:tab===t.id?C.accent:C.card,color:tab===t.id?C.bg:C.muted,border:`1px solid ${tab===t.id?C.accent:C.border}`,borderRadius:10,fontFamily:"'DM Sans',sans-serif",transition:"all .2s",display:"flex",alignItems:"center",gap:4,flex:isMobile?"1 1 auto":"none"}}><span>{t.icon}</span>{t.label}</button>))}
      </div>

      {/* Monthly */}
      {tab==="monthly"&&(
        <SectionCard title="Monthly Performance" subtitle={isMobile?"Spend, revenue, leads per month":"Enter spend, revenue, and leads for each reporting month"}
          action={<AddBtn onClick={()=>addRow(months,setMonths,{month:"",spend:0,revenue:0,leads:0})} label="+ Add"/>}>
          {!isMobile&&(<div style={{display:"flex",gap:10,marginBottom:6,paddingLeft:24,paddingRight:38}}>
            {["Month","Spend ($)","Revenue ($)","Leads"].map((h,i)=>(<div key={i} style={{flex:1,fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>))}
          </div>)}
          <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:4}}>
            {months.map((m,i)=>(isMobile?(
              <div key={i} style={{background:C.cardAlt,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.muted}}>Row {i+1}</span>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}><MobileReorder drag={monthsDrag} idx={i} total={months.length}/><RemoveBtn onClick={()=>removeRow(months,setMonths,i)}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <InputField label="Month" value={m.month} onChange={v=>updateRow(months,setMonths,i,"month",v)} placeholder="Jan"/>
                  <InputField label="Leads" value={m.leads} onChange={v=>updateRow(months,setMonths,i,"leads",v)} type="number" placeholder="1500"/>
                  <InputField label="Spend ($)" value={m.spend} onChange={v=>updateRow(months,setMonths,i,"spend",v)} type="number" placeholder="50000"/>
                  <InputField label="Revenue ($)" value={m.revenue} onChange={v=>updateRow(months,setMonths,i,"revenue",v)} type="number" placeholder="200000"/>
                </div></div>
            ):(
              <div key={i} draggable onDragStart={e=>monthsDrag.onDragStart(e,i)} onDragOver={e=>monthsDrag.onDragOver(e,i)} onDragLeave={monthsDrag.onDragLeave} onDrop={e=>monthsDrag.onDrop(e,i)} onDragEnd={monthsDrag.onDragEnd}
                style={{display:"flex",gap:10,alignItems:"center",borderRadius:8,padding:"4px 0",...dragRowStyle(monthsDrag,i)}}>
                <DragHandle/>
                <div style={{flex:1}}><input style={inputStyle} value={m.month} placeholder="e.g. Jan" onChange={e=>updateRow(months,setMonths,i,"month",e.target.value)} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={m.spend} type="number" placeholder="50000" onChange={e=>updateRow(months,setMonths,i,"spend",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={m.revenue} type="number" placeholder="200000" onChange={e=>updateRow(months,setMonths,i,"revenue",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={m.leads} type="number" placeholder="1500" onChange={e=>updateRow(months,setMonths,i,"leads",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <RemoveBtn onClick={()=>removeRow(months,setMonths,i)}/>
              </div>
            )))}
          </div>
        </SectionCard>
      )}

      {/* Channels */}
      {tab==="channels"&&(
        <SectionCard title="Channel Performance" subtitle="Spend and revenue per channel"
          action={<AddBtn onClick={()=>addRow(channels,setChannels,{name:"",spend:0,revenue:0})} label="+ Add"/>}>
          {!isMobile&&(<div style={{display:"flex",gap:10,marginBottom:6,paddingLeft:24,paddingRight:38}}>
            {["Channel Name","Spend ($)","Revenue ($)"].map((h,i)=>(<div key={i} style={{flex:1,fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>))}
          </div>)}
          <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:4}}>
            {channels.map((ch,i)=>(isMobile?(
              <div key={i} style={{background:C.cardAlt,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.muted}}>{ch.name||`Channel ${i+1}`}</span>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}><MobileReorder drag={channelsDrag} idx={i} total={channels.length}/><RemoveBtn onClick={()=>removeRow(channels,setChannels,i)}/></div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <InputField label="Channel Name" value={ch.name} onChange={v=>updateRow(channels,setChannels,i,"name",v)} placeholder="Paid Search"/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <InputField label="Spend ($)" value={ch.spend} onChange={v=>updateRow(channels,setChannels,i,"spend",v)} type="number"/>
                    <InputField label="Revenue ($)" value={ch.revenue} onChange={v=>updateRow(channels,setChannels,i,"revenue",v)} type="number"/>
                  </div></div></div>
            ):(
              <div key={i} draggable onDragStart={e=>channelsDrag.onDragStart(e,i)} onDragOver={e=>channelsDrag.onDragOver(e,i)} onDragLeave={channelsDrag.onDragLeave} onDrop={e=>channelsDrag.onDrop(e,i)} onDragEnd={channelsDrag.onDragEnd}
                style={{display:"flex",gap:10,alignItems:"center",borderRadius:8,padding:"4px 0",...dragRowStyle(channelsDrag,i)}}>
                <DragHandle/>
                <div style={{flex:1}}><input style={inputStyle} value={ch.name} placeholder="e.g. Paid Search" onChange={e=>updateRow(channels,setChannels,i,"name",e.target.value)} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={ch.spend} type="number" onChange={e=>updateRow(channels,setChannels,i,"spend",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={ch.revenue} type="number" onChange={e=>updateRow(channels,setChannels,i,"revenue",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <RemoveBtn onClick={()=>removeRow(channels,setChannels,i)}/>
              </div>
            )))}
          </div>
        </SectionCard>
      )}

      {/* Campaigns */}
      {tab==="campaigns"&&(
        <SectionCard title="Campaign Details" subtitle="Add individual campaigns"
          action={<AddBtn onClick={()=>addRow(campaigns,setCampaigns,{name:"",channel:"",spend:0,revenue:0,status:"active"})} label="+ Add"/>}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {campaigns.map((cp,i)=>(
              <div key={i} {...(!isMobile?{draggable:true,onDragStart:e=>campaignsDrag.onDragStart(e,i),onDragOver:e=>campaignsDrag.onDragOver(e,i),onDragLeave:campaignsDrag.onDragLeave,onDrop:e=>campaignsDrag.onDrop(e,i),onDragEnd:campaignsDrag.onDragEnd}:{})}
                style={{background:campaignsDrag.draggedOver===i?C.dragOver:C.cardAlt,borderRadius:10,padding:12,border:campaignsDrag.draggedOver===i?`1px solid ${C.dragBorder}`:`1px solid ${C.border}`,transition:"all .15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>{!isMobile&&<DragHandle/>}<span style={{fontSize:12,fontWeight:600,color:C.muted}}>{cp.name||`Campaign ${i+1}`}</span></div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>{isMobile&&<MobileReorder drag={campaignsDrag} idx={i} total={campaigns.length}/>}<RemoveBtn onClick={()=>removeRow(campaigns,setCampaigns,i)}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr 1fr 1fr 1fr",gap:8}}>
                  <InputField label="Campaign Name" value={cp.name} onChange={v=>updateRow(campaigns,setCampaigns,i,"name",v)} placeholder="Q4 Launch"/>
                  <InputField label="Channel" value={cp.channel} onChange={v=>updateRow(campaigns,setCampaigns,i,"channel",v)} placeholder="Email"/>
                  <div style={{display:isMobile?"grid":"contents",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <InputField label="Spend ($)" value={cp.spend} onChange={v=>updateRow(campaigns,setCampaigns,i,"spend",v)} type="number"/>
                    <InputField label="Revenue ($)" value={cp.revenue} onChange={v=>updateRow(campaigns,setCampaigns,i,"revenue",v)} type="number"/>
                  </div>
                  <div style={{minWidth:0}}><label style={inputLabel}>Status</label>
                    <select value={cp.status} onChange={e=>updateRow(campaigns,setCampaigns,i,"status",e.target.value)} style={{...inputStyle,cursor:"pointer",appearance:"auto"}} onFocus={focusRing} onBlur={blurRing}>
                      <option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option>
                    </select></div>
                </div></div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Funnel */}
      {tab==="funnel"&&(
        <SectionCard title="Marketing Funnel Stages" subtitle="Top to bottom, widest to narrowest"
          action={<AddBtn onClick={()=>addRow(funnel,setFunnel,{stage:"",value:0})} label="+ Add"/>}>
          {!isMobile&&(<div style={{display:"flex",gap:10,marginBottom:6,paddingLeft:24,paddingRight:38}}>
            {["Stage Name","Volume"].map((h,i)=>(<div key={i} style={{flex:1,fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>))}
          </div>)}
          <div style={{display:"flex",flexDirection:"column",gap:isMobile?10:4}}>
            {funnel.map((f,i)=>(isMobile?(
              <div key={i} style={{background:C.cardAlt,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.muted}}>Stage {i+1}</span>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}><MobileReorder drag={funnelDrag} idx={i} total={funnel.length}/><RemoveBtn onClick={()=>removeRow(funnel,setFunnel,i)}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <InputField label="Stage Name" value={f.stage} onChange={v=>updateRow(funnel,setFunnel,i,"stage",v)} placeholder="Impressions"/>
                  <InputField label="Volume" value={f.value} onChange={v=>updateRow(funnel,setFunnel,i,"value",v)} type="number"/>
                </div></div>
            ):(
              <div key={i} draggable onDragStart={e=>funnelDrag.onDragStart(e,i)} onDragOver={e=>funnelDrag.onDragOver(e,i)} onDragLeave={funnelDrag.onDragLeave} onDrop={e=>funnelDrag.onDrop(e,i)} onDragEnd={funnelDrag.onDragEnd}
                style={{display:"flex",gap:10,alignItems:"center",borderRadius:8,padding:"4px 0",...dragRowStyle(funnelDrag,i)}}>
                <DragHandle/>
                <div style={{flex:1}}><input style={inputStyle} value={f.stage} placeholder="e.g. Impressions" onChange={e=>updateRow(funnel,setFunnel,i,"stage",e.target.value)} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={f.value} type="number" placeholder="100000" onChange={e=>updateRow(funnel,setFunnel,i,"value",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <RemoveBtn onClick={()=>removeRow(funnel,setFunnel,i)}/>
              </div>
            )))}
          </div>
          <div style={{marginTop:12,padding:"8px 12px",borderRadius:8,background:"rgba(255,209,102,.06)",border:`1px solid rgba(255,209,102,.12)`,fontSize:11,color:C.muted}}>
            💡 <strong style={{color:C.warn}}>Tip:</strong> Order from top of funnel (Impressions) to bottom (Closed Won).
          </div>
        </SectionCard>
      )}

      {/* Goals */}
      {tab==="goals"&&(
        <SectionCard title="Performance Targets" subtitle="Set goals to track progress on the dashboard. Leave blank to hide a target.">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:16}}>
            {[
              {key:"revenue",label:"Revenue Target ($)",icon:"💰",placeholder:"1500000"},
              {key:"spend",label:"Budget Cap ($)",icon:"📊",placeholder:"450000"},
              {key:"roas",label:"Target ROAS (x)",icon:"🎯",placeholder:"3.5"},
              {key:"leads",label:"Lead Target",icon:"👥",placeholder:"15000"},
              {key:"cpl",label:"Target CPL ($)",icon:"⬇️",placeholder:"30"},
            ].map(g=>(
              <div key={g.key} style={{background:C.cardAlt,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{fontSize:18}}>{g.icon}</span>
                  <label style={{...inputLabel,marginBottom:0}}>{g.label}</label>
                </div>
                <input style={inputStyle} value={goals[g.key]} type="number" placeholder={g.placeholder}
                  onChange={e=>setGoals({...goals,[g.key]:e.target.value===""?"":Number(e.target.value)})}
                  onFocus={focusRing} onBlur={blurRing}/>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,padding:"10px 14px",borderRadius:8,background:"rgba(6,214,160,.04)",border:`1px solid rgba(6,214,160,.1)`,fontSize:12,color:C.muted}}>
            🎯 <strong style={{color:C.accent}}>How it works:</strong> Your targets will appear as progress bars on the dashboard. Metrics that exceed their goal will be highlighted in green. For CPL, lower is better — going under target counts as success.
          </div>
        </SectionCard>
      )}

      <div style={{display:"flex",justifyContent:"center",marginTop:16}}>
        <button onClick={onLaunch} style={{background:`linear-gradient(135deg, ${C.accent}, #04B890)`,color:C.bg,border:"none",borderRadius:12,padding:isMobile?"14px 36px":"15px 52px",fontSize:isMobile?15:16,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 24px ${C.accent}33`,width:isMobile?"100%":"auto"}}>
          Generate Dashboard →
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW MODE
// ═══════════════════════════════════════════════════════════════════════════════

function KPI({title,value,rawValue,change,icon,color=C.accent,goal,goalLabel,invertGoal}){
  const animated=useAnimatedValue(rawValue||0);
  const pos=change===null||parseFloat(change)>=0;
  // Format animated value like the static value
  const formatAnimated=()=>{
    if(typeof rawValue!=="number") return value; // fallback for non-numeric
    if(title==="Blended ROAS") return `${animated.toFixed(2)}x`;
    if(title==="Avg CPL") return `$${animated.toFixed(2)}`;
    if(title==="Total Leads") return Math.round(animated).toLocaleString();
    return fmt$(Math.round(animated));
  };
  const goalPct=goal?(invertGoal?goal/Math.max(rawValue||1,1)*100:(rawValue||0)/goal*100):null;
  const goalMet=goal?(invertGoal?(rawValue||0)<=goal:(rawValue||0)>=goal):false;
  return(
    <div style={{background:C.card,borderRadius:14,padding:"18px 16px",border:`1px solid ${C.border}`,position:"relative",overflow:"hidden",minWidth:0}}>
      <div style={{position:"absolute",top:0,right:0,width:60,height:60,background:`radial-gradient(circle at top right, ${color}15, transparent 70%)`}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase"}}>{title}</span>
        <span style={{fontSize:16}}>{icon}</span>
      </div>
      <div style={{fontSize:24,fontWeight:700,color:C.text,letterSpacing:"-.02em"}}>{formatAnimated()}</div>
      {change!==null&&(
        <div style={{marginTop:6,display:"flex",alignItems:"center",gap:5}}>
          <span style={{background:pos?"rgba(6,214,160,.14)":"rgba(239,71,111,.14)",color:pos?C.accent:C.danger,fontSize:10,fontWeight:600,padding:"2px 6px",borderRadius:5}}>
            {pos?"▲":"▼"} {Math.abs(parseFloat(change))}%
          </span>
        </div>
      )}
      {goal>0&&goalPct!==null&&(
        <div style={{marginTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontSize:9,fontWeight:600,color:C.dim,textTransform:"uppercase"}}>Goal: {goalLabel}</span>
            <span style={{fontSize:10,fontWeight:700,color:goalMet?C.accent:C.warn,fontFamily:"'JetBrains Mono',monospace"}}>{Math.min(Math.round(goalPct),999)}%</span>
          </div>
          <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
            <div style={{width:`${Math.min(goalPct,100)}%`,height:"100%",borderRadius:3,background:goalMet?C.accent:goalPct>75?C.warn:C.danger,transition:"width .8s ease"}}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Date Range Filter ──────────────────────────────────────────────────────
function DateRangeFilter({months,range,setRange,isMobile}){
  if(months.length<3) return null;
  const labels=months.map(m=>m.month);
  return(
    <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",gap:isMobile?8:14,marginBottom:20,flexDirection:isMobile?"column":"row"}}>
      <span style={{fontSize:11,fontWeight:600,color:C.dim,textTransform:"uppercase",letterSpacing:".05em",flexShrink:0}}>Date Range</span>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <button onClick={()=>setRange([0,months.length-1])} style={{padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
          background:range[0]===0&&range[1]===months.length-1?C.accent+"22":"transparent",color:range[0]===0&&range[1]===months.length-1?C.accent:C.dim,
          border:`1px solid ${range[0]===0&&range[1]===months.length-1?C.accent+"44":C.border}`,borderRadius:6}}>All</button>
        {months.length>=6&&<button onClick={()=>setRange([months.length-3,months.length-1])} style={{padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
          background:range[1]-range[0]===2&&range[1]===months.length-1?C.accent+"22":"transparent",color:range[1]-range[0]===2&&range[1]===months.length-1?C.accent:C.dim,
          border:`1px solid ${range[1]-range[0]===2&&range[1]===months.length-1?C.accent+"44":C.border}`,borderRadius:6}}>Last 3</button>}
        {months.length>=8&&<button onClick={()=>setRange([months.length-6,months.length-1])} style={{padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
          background:range[1]-range[0]===5&&range[1]===months.length-1?C.accent+"22":"transparent",color:range[1]-range[0]===5&&range[1]===months.length-1?C.accent:C.dim,
          border:`1px solid ${range[1]-range[0]===5&&range[1]===months.length-1?C.accent+"44":C.border}`,borderRadius:6}}>Last 6</button>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <select value={range[0]} onChange={e=>setRange([Number(e.target.value),Math.max(Number(e.target.value),range[1])])}
          style={{padding:"5px 8px",fontSize:11,background:C.cardAlt,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",outline:"none"}}>
          {labels.map((l,i)=><option key={i} value={i}>{l}</option>)}
        </select>
        <span style={{color:C.dim,fontSize:11}}>to</span>
        <select value={range[1]} onChange={e=>setRange([Math.min(range[0],Number(e.target.value)),Number(e.target.value)])}
          style={{padding:"5px 8px",fontSize:11,background:C.cardAlt,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",outline:"none"}}>
          {labels.map((l,i)=><option key={i} value={i}>{l}</option>)}
        </select>
      </div>
    </div>
  );
}

function ExportMenu({months,channels,campaigns,funnel}){
  const[open,setOpen]=useState(false); const ref=useRef(null);
  useEffect(()=>{const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const btnBase={display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"transparent",border:"none",color:C.text,fontSize:13,fontWeight:500,cursor:"pointer",borderRadius:8,fontFamily:"'DM Sans',sans-serif",textAlign:"left",transition:"background .15s"};
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(!open)} style={{background:`linear-gradient(135deg, ${C.accent}, #04B890)`,color:C.bg,border:"none",borderRadius:9,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>📤 Export <span style={{fontSize:10,opacity:.7}}>▼</span></button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,width:220,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 12px 40px rgba(0,0,0,.5)",zIndex:100,overflow:"hidden",padding:6}}>
          <button style={btnBase} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            onClick={()=>{exportPDF(months,channels,campaigns,funnel);setOpen(false);}}><span style={{fontSize:18}}>📄</span><div><div style={{fontWeight:600}}>Export as PDF</div><div style={{fontSize:11,color:C.dim}}>Print-ready report</div></div></button>
          <div style={{height:1,background:C.border,margin:"2px 8px"}}/>
          <button style={btnBase} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            onClick={()=>{exportCSV(months,channels,campaigns,funnel);setOpen(false);}}><span style={{fontSize:18}}>📊</span><div><div style={{fontWeight:600}}>Export as CSV</div><div style={{fontSize:11,color:C.dim}}>For Excel / Sheets</div></div></button>
        </div>
      )}
    </div>
  );
}

function DashboardView({months,channels,campaigns,funnel,goals}){
  const{isMobile,isTablet}=useScreen();
  const[tab,setTab]=useState("overview");
  const[range,setRange]=useState([0,months.length-1]);

  // Filtered months for overview charts
  const filteredMonths=months.slice(range[0],range[1]+1);
  const enrichedMonths=filteredMonths.map(m=>({...m,roas:m.spend?+(m.revenue/m.spend).toFixed(2):0,cpl:m.leads?+(m.spend/m.leads).toFixed(2):0}));

  // KPIs always use full dataset
  const totalSpend=sum(months,"spend"),totalRev=sum(months,"revenue"),totalLeads=sum(months,"leads");
  const blendedROAS=totalSpend?(totalRev/totalSpend):0,avgCPL=totalLeads?(totalSpend/totalLeads):0;
  const half=Math.floor(months.length/2)||1,firstHalf=months.slice(0,half),secondHalf=months.slice(half);
  const chg=(k)=>{const a=sum(firstHalf,k),b=sum(secondHalf,k);return a?(((b-a)/a)*100).toFixed(1):null;};
  const revChange=chg("revenue"),spendChange=chg("spend"),leadChange=chg("leads");
  const firstROAS=sum(firstHalf,"spend")?sum(firstHalf,"revenue")/sum(firstHalf,"spend"):0;
  const secondROAS=sum(secondHalf,"spend")?sum(secondHalf,"revenue")/sum(secondHalf,"spend"):0;
  const roasChange=firstROAS?(((secondROAS-firstROAS)/firstROAS)*100).toFixed(1):null;
  const firstCPL=sum(firstHalf,"leads")?sum(firstHalf,"spend")/sum(firstHalf,"leads"):0;
  const secondCPL=sum(secondHalf,"leads")?sum(secondHalf,"spend")/sum(secondHalf,"leads"):0;
  const cplChange=firstCPL?(((secondCPL-firstCPL)/firstCPL)*100).toFixed(1):null;

  const enrichedChannels=channels.map((ch,i)=>({...ch,roi:ch.spend?Math.round(((ch.revenue-ch.spend)/ch.spend)*100):0,color:CH_COLORS[i%CH_COLORS.length]}));
  const totalChSpend=sum(channels,"spend");
  const pieData=enrichedChannels.map(ch=>({name:ch.name,value:totalChSpend?Math.round((ch.spend/totalChSpend)*100):0,color:ch.color}));
  const enrichedCampaigns=campaigns.map(cp=>({...cp,roi:cp.spend?Math.round(((cp.revenue-cp.spend)/cp.spend)*100):0}));
  const bestCampaign=enrichedCampaigns.length?enrichedCampaigns.reduce((a,b)=>a.roi>b.roi?a:b):null;
  const activeCampaigns=campaigns.filter(c=>c.status==="active").length;

  const chartH=isMobile?220:280, smallChartH=isMobile?200:200;

  const tabs=[{id:"overview",label:"Overview"},{id:"channels",label:isMobile?"Channels":"Channel Performance"},{id:"campaigns",label:"Campaigns"},{id:"funnel",label:isMobile?"Funnel":"Funnel Analysis"}];

  return(
    <div>
      <div style={{display:"flex",gap:4,marginBottom:24,flexWrap:"wrap"}}>
        {tabs.map(t=>(<button key={t.id} onClick={()=>setTab(t.id)} style={{padding:isMobile?"8px 12px":"9px 18px",fontSize:isMobile?12:13,fontWeight:600,cursor:"pointer",background:tab===t.id?C.card:"transparent",color:tab===t.id?C.accent:C.dim,border:tab===t.id?`1px solid ${C.border}`:"1px solid transparent",borderRadius:9,fontFamily:"'DM Sans',sans-serif",transition:"all .2s",flex:isMobile?"1 1 auto":"none"}}>{t.label}</button>))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      {tab==="overview"&&(
        <>
          <div style={isMobile?{display:"flex",gap:10,marginBottom:24,overflowX:"auto",paddingBottom:8,WebkitOverflowScrolling:"touch",scrollSnapType:"x mandatory"}:
            {display:"grid",gridTemplateColumns:isTablet?"repeat(3,1fr)":"repeat(5,1fr)",gap:14,marginBottom:28}}>
            {[
              {title:"Total Revenue",rawValue:totalRev,value:fmt$(totalRev),change:revChange,icon:"💰",color:C.accent,goal:goals.revenue,goalLabel:fmt$(goals.revenue)},
              {title:"Total Spend",rawValue:totalSpend,value:fmt$(totalSpend),change:spendChange,icon:"📊",color:C.info,goal:goals.spend,goalLabel:fmt$(goals.spend),invertGoal:true},
              {title:"Blended ROAS",rawValue:blendedROAS,value:`${blendedROAS.toFixed(2)}x`,change:roasChange,icon:"🎯",color:C.purple,goal:goals.roas,goalLabel:`${goals.roas}x`},
              {title:"Total Leads",rawValue:totalLeads,value:totalLeads.toLocaleString(),change:leadChange,icon:"👥",color:C.warn,goal:goals.leads,goalLabel:fmtN(goals.leads)},
              {title:"Avg CPL",rawValue:avgCPL,value:`$${avgCPL.toFixed(2)}`,change:cplChange,icon:"⬇️",color:C.cyan,goal:goals.cpl,goalLabel:`$${goals.cpl}`,invertGoal:true},
            ].map((k,i)=>(
              <div key={i} style={isMobile?{minWidth:175,flex:"0 0 175px",scrollSnapAlign:"start"}:{}}>
                <KPI {...k}/>
              </div>
            ))}
          </div>
          {isMobile&&<div style={{fontSize:10,color:C.dim,textAlign:"center",marginTop:-16,marginBottom:16}}>← Swipe for more KPIs →</div>}

          <DateRangeFilter months={months} range={range} setRange={setRange} isMobile={isMobile}/>

          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:16,marginBottom:16}}>
            <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`}}>
              <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:C.text}}>Revenue vs. Marketing Spend</h3>
              <ResponsiveContainer width="100%" height={chartH}>
                <AreaChart data={enrichedMonths} margin={{top:5,right:10,left:isMobile?-10:10,bottom:5}}>
                  <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={.3}/><stop offset="100%" stopColor={C.accent} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gSpd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.info} stopOpacity={.2}/><stop offset="100%" stopColor={C.info} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}}/>
                  <YAxis tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}} tickFormatter={fmt$} width={isMobile?45:60}/>
                  <Tooltip content={<Tip fmt={fmt$}/>}/><Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.accent} fill="url(#gRev)" strokeWidth={2.5} dot={{fill:C.accent,r:isMobile?2:3.5}}/>
                  <Area type="monotone" dataKey="spend" name="Spend" stroke={C.info} fill="url(#gSpd)" strokeWidth={2} dot={{fill:C.info,r:isMobile?1.5:2.5}}/>
                  <Legend wrapperStyle={{color:C.muted,fontSize:10,paddingTop:8}}/>
                </AreaChart></ResponsiveContainer>
            </div>
            <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`}}>
              <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.text}}>Budget Allocation</h3>
              <ResponsiveContainer width="100%" height={isMobile?180:200}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={isMobile?40:50} outerRadius={isMobile?65:78} paddingAngle={3} dataKey="value">
                  {pieData.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}</Pie>
                  <Tooltip content={({active,payload})=>active&&payload?.length?<div style={{background:"#1A2235",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px"}}><span style={{color:C.text,fontSize:11,fontWeight:600}}>{payload[0].name}: {payload[0].value}%</span></div>:null}/></PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
                {pieData.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.muted}}><span style={{width:7,height:7,borderRadius:"50%",background:d.color}}/>{d.name}</div>)}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`}}>
              <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:C.text}}>ROAS Trend</h3>
              <ResponsiveContainer width="100%" height={smallChartH}>
                <LineChart data={enrichedMonths} margin={{top:5,right:10,left:isMobile?-10:10,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}}/>
                  <YAxis tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}} tickFormatter={v=>`${v}x`} width={isMobile?35:60}/>
                  <Tooltip content={<Tip fmt={v=>`${v}x`}/>}/>
                  <Line type="monotone" dataKey="roas" name="ROAS" stroke={C.purple} strokeWidth={3} dot={{fill:C.purple,r:isMobile?3:4.5,strokeWidth:2,stroke:C.card}}/>
                </LineChart></ResponsiveContainer>
            </div>
            <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`}}>
              <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:C.text}}>Lead Generation & CPL</h3>
              <ResponsiveContainer width="100%" height={smallChartH}>
                <ComposedChart data={enrichedMonths} margin={{top:5,right:10,left:isMobile?-10:10,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}}/>
                  <YAxis yAxisId="l" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}} width={isMobile?35:60}/>
                  <YAxis yAxisId="r" orientation="right" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}} tickFormatter={v=>`$${v}`} width={isMobile?40:60}/>
                  <Tooltip content={<Tip fmt={(v,n)=>n==="CPL"?`$${v}`:fmtN(v)}/>}/>
                  <Bar yAxisId="l" dataKey="leads" name="Leads" fill={C.info} radius={[4,4,0,0]} barSize={isMobile?14:24}/>
                  <Line yAxisId="r" type="monotone" dataKey="cpl" name="CPL" stroke={C.warn} strokeWidth={2.5} dot={{fill:C.warn,r:isMobile?2.5:3.5}}/>
                  <Legend wrapperStyle={{color:C.muted,fontSize:10,paddingTop:8}}/>
                </ComposedChart></ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ── Channels ─────────────────────────────────────────────────────── */}
      {tab==="channels"&&(
        <>
          <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`,marginBottom:18}}>
            <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:C.text}}>Channel ROI Comparison</h3>
            <ResponsiveContainer width="100%" height={Math.max(200,enrichedChannels.length*52)}>
              <BarChart data={enrichedChannels} layout="vertical" margin={{top:5,right:20,left:isMobile?10:90,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
                <XAxis type="number" tick={{fill:C.dim,fontSize:11}} axisLine={{stroke:C.border}} tickFormatter={v=>`${v}%`}/>
                <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:isMobile?10:12,fontWeight:500}} axisLine={{stroke:C.border}} width={isMobile?70:85}/>
                <Tooltip content={<Tip fmt={v=>`${v}%`}/>}/><Bar dataKey="roi" name="ROI %" radius={[0,6,6,0]} barSize={22}>{enrichedChannels.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar>
              </BarChart></ResponsiveContainer>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,1fr)":"repeat(3,1fr)",gap:14}}>
            {enrichedChannels.map((ch,i)=>(
              <div key={i} style={{background:C.card,borderRadius:14,padding:isMobile?16:22,border:`1px solid ${C.border}`,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:`linear-gradient(90deg,${ch.color},transparent)`}}/>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>{ch.name}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Spend</div><div style={{color:C.text,fontSize:16,fontWeight:600}}>{fmt$(ch.spend)}</div></div>
                  <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Revenue</div><div style={{color:C.accent,fontSize:16,fontWeight:600}}>{fmt$(ch.revenue)}</div></div>
                  <div style={{gridColumn:"1/-1"}}><div style={{color:C.dim,fontSize:10,textTransform:"uppercase",letterSpacing:".05em",marginBottom:5}}>ROI</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{flex:1,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.min(ch.roi/7,100)}%`,height:"100%",background:ch.color,borderRadius:3}}/></div>
                      <span style={{color:ch.color,fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{ch.roi}%</span></div></div>
                </div></div>
            ))}
          </div>
        </>
      )}

      {/* ── Campaigns ────────────────────────────────────────────────────── */}
      {tab==="campaigns"&&(
        <>
          {isMobile?(
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
              {enrichedCampaigns.map((c,i)=>(
                <div key={i} style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.text}}>{c.name}</div>
                    <span style={{fontSize:10,fontWeight:600,textTransform:"uppercase",padding:"3px 9px",borderRadius:5,flexShrink:0,
                      background:c.status==="active"?"rgba(6,214,160,.1)":c.status==="completed"?"rgba(131,56,236,.1)":"rgba(255,209,102,.1)",
                      color:c.status==="active"?C.accent:c.status==="completed"?C.purple:C.warn}}>{c.status}</span>
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{c.channel}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase"}}>Spend</div><div style={{color:C.text,fontSize:14,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{fmt$(c.spend)}</div></div>
                    <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase"}}>Revenue</div><div style={{color:C.accent,fontSize:14,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{fmt$(c.revenue)}</div></div>
                    <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase"}}>ROI</div><div style={{color:c.roi>=400?C.accent:c.roi>=200?C.info:C.warn,fontSize:14,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{c.roi}%</div></div>
                  </div></div>
              ))}
            </div>
          ):(
            <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:20}}>
              <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
                <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                  {["Campaign","Channel","Spend","Revenue","ROI","Status"].map((h,i)=>(
                    <th key={i} style={{padding:"13px 18px",textAlign:"left",fontSize:10,fontWeight:600,color:C.dim,textTransform:"uppercase",letterSpacing:".06em",background:"rgba(0,0,0,.2)"}}>{h}</th>
                  ))}</tr></thead>
                <tbody>{enrichedCampaigns.map((c,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${C.border}`}} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"13px 18px",fontSize:13,fontWeight:600,color:C.text}}>{c.name}</td>
                    <td style={{padding:"13px 18px",fontSize:12,color:C.muted}}>{c.channel}</td>
                    <td style={{padding:"13px 18px",fontSize:13,color:C.text,fontFamily:"'JetBrains Mono',monospace"}}>{fmt$(c.spend)}</td>
                    <td style={{padding:"13px 18px",fontSize:13,color:C.accent,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{fmt$(c.revenue)}</td>
                    <td style={{padding:"13px 18px"}}><div style={{display:"flex",alignItems:"center",gap:7}}>
                      <div style={{width:55,height:4,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.min(c.roi/7,100)}%`,height:"100%",borderRadius:3,background:c.roi>=400?C.accent:c.roi>=200?C.info:C.warn}}/></div>
                      <span style={{fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:c.roi>=400?C.accent:c.roi>=200?C.info:C.warn}}>{c.roi}%</span></div></td>
                    <td style={{padding:"13px 18px"}}><span style={{fontSize:10,fontWeight:600,textTransform:"uppercase",padding:"3px 9px",borderRadius:5,
                      background:c.status==="active"?"rgba(6,214,160,.1)":c.status==="completed"?"rgba(131,56,236,.1)":"rgba(255,209,102,.1)",
                      color:c.status==="active"?C.accent:c.status==="completed"?C.purple:C.warn}}>{c.status}</span></td>
                  </tr>
                ))}</tbody></table></div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12}}>
            <div style={{background:C.card,borderRadius:14,padding:isMobile?14:22,border:`1px solid ${C.border}`,textAlign:"center"}}>
              <div style={{color:C.dim,fontSize:10,marginBottom:4,textTransform:"uppercase"}}>Active</div>
              <div style={{color:C.accent,fontSize:isMobile?26:32,fontWeight:800}}>{activeCampaigns}</div></div>
            <div style={{background:C.card,borderRadius:14,padding:isMobile?14:22,border:`1px solid ${C.border}`,textAlign:"center"}}>
              <div style={{color:C.dim,fontSize:10,marginBottom:4,textTransform:"uppercase"}}>Avg ROI</div>
              <div style={{color:C.info,fontSize:isMobile?26:32,fontWeight:800}}>{enrichedCampaigns.length?Math.round(enrichedCampaigns.reduce((s,c)=>s+c.roi,0)/enrichedCampaigns.length):0}%</div></div>
            <div style={{background:C.card,borderRadius:14,padding:isMobile?14:22,border:`1px solid ${C.border}`,textAlign:"center"}}>
              <div style={{color:C.dim,fontSize:10,marginBottom:4,textTransform:"uppercase"}}>Best</div>
              <div style={{color:C.purple,fontSize:isMobile?13:16,fontWeight:700}}>{bestCampaign?.name||"—"}</div>
              <div style={{color:C.dim,fontSize:11,marginTop:2}}>{bestCampaign?`${bestCampaign.roi}% ROI`:""}</div></div>
            <div style={{background:C.card,borderRadius:14,padding:isMobile?14:22,border:`1px solid ${C.border}`,textAlign:"center"}}>
              <div style={{color:C.dim,fontSize:10,marginBottom:4,textTransform:"uppercase"}}>Pipeline</div>
              <div style={{color:C.warn,fontSize:isMobile?26:32,fontWeight:800}}>{fmt$(sum(campaigns,"revenue"))}</div></div>
          </div>
        </>
      )}

      {/* ── Funnel ───────────────────────────────────────────────────────── */}
      {tab==="funnel"&&(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
          <div style={{background:C.card,borderRadius:16,padding:isMobile?20:28,border:`1px solid ${C.border}`}}>
            <h3 style={{margin:"0 0 20px",fontSize:14,fontWeight:700,color:C.text}}>Conversion Funnel</h3>
            <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"center"}}>
              {funnel.map((f,i)=>{const w=30+70*(1-i/(funnel.length-1||1)),op=.4+.6*(1-i/(funnel.length-1||1));return(
                <div key={i} style={{width:`${w}%`,padding:isMobile?"10px 14px":"12px 18px",borderRadius:9,
                  background:`linear-gradient(135deg,rgba(6,214,160,${op*.3}),rgba(17,138,178,${op*.2}))`,
                  border:`1px solid rgba(6,214,160,${op*.3})`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:isMobile?11:12,fontWeight:600,color:C.text}}>{f.stage}</span>
                  <span style={{fontSize:isMobile?11:13,fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{fmtN(f.value)}</span>
                </div>);})}
            </div></div>
          <div style={{background:C.card,borderRadius:16,padding:isMobile?20:28,border:`1px solid ${C.border}`}}>
            <h3 style={{margin:"0 0 20px",fontSize:14,fontWeight:700,color:C.text}}>Stage Conversion Rates</h3>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {funnel.slice(1).map((f,i)=>{const prev=funnel[i].value,rate=pct(f.value,prev);return(
                <div key={i}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:11,color:C.muted}}>{funnel[i].stage} → {f.stage}</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{rate}%</span></div>
                  <div style={{height:7,background:C.border,borderRadius:4,overflow:"hidden"}}><div style={{width:`${Math.min(parseFloat(rate)*2.5,100)}%`,height:"100%",borderRadius:4,background:`linear-gradient(90deg,${C.accent},${C.info})`}}/></div></div>
              );})}
            </div>
            {funnel.length>=2&&(
              <div style={{marginTop:20,padding:isMobile?14:18,borderRadius:11,background:"rgba(6,214,160,.05)",border:`1px solid rgba(6,214,160,.12)`}}>
                <div style={{color:C.dim,fontSize:10,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Overall Conversion</div>
                <div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:isMobile?24:28,fontWeight:800,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{pct(funnel[funnel.length-1].value,funnel[0].value)}%</span>
                  <span style={{fontSize:11,color:C.muted}}>{funnel[0].stage} → {funnel[funnel.length-1].stage}</span>
                </div></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const{isMobile}=useScreen();
  const[mode,setMode]=useState("input");
  const[months,setMonths]=useState(defaultMonths);
  const[channels,setChannels]=useState(defaultChannels);
  const[campaigns,setCampaigns]=useState(defaultCampaigns);
  const[funnel,setFunnel]=useState(defaultFunnel);
  const[goals,setGoals]=useState(defaultGoals);
  const[ready,setReady]=useState(false);

  useEffect(()=>{
    const link=document.createElement("link");
    link.href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500;600&display=swap";
    link.rel="stylesheet";document.head.appendChild(link);
    const style=document.createElement("style");
    style.textContent="html,body{overflow-x:hidden;} *::-webkit-scrollbar{height:4px;} *::-webkit-scrollbar-track{background:transparent;} *::-webkit-scrollbar-thumb{background:#2A3650;border-radius:4px;}";
    document.head.appendChild(style);
    setTimeout(()=>setReady(true),80);
  },[]);

  const pad=isMobile?"16px":"36px";

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text,opacity:ready?1:0,transition:"opacity .5s"}}>
      <div style={{padding:isMobile?"14px 16px":"24px 36px",borderBottom:`1px solid ${C.border}`,
        background:"linear-gradient(180deg,rgba(6,214,160,.03) 0%,transparent 100%)",
        display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${C.accent},${C.info})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:C.bg,flexShrink:0}}>M</div>
          <div><h1 style={{margin:0,fontSize:isMobile?16:21,fontWeight:800,letterSpacing:"-.02em"}}>Marketing ROI Dashboard</h1>
            <p style={{margin:"1px 0 0",color:C.dim,fontSize:isMobile?10:12}}>{mode==="input"?"Enter your marketing data":"Executive Performance Report"}</p></div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {mode==="dashboard"&&(<>
            <button onClick={()=>setMode("input")} style={{background:C.card,color:C.muted,border:`1px solid ${C.border}`,borderRadius:9,padding:isMobile?"6px 10px":"8px 16px",fontSize:isMobile?11:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✏️ Edit</button>
            <ExportMenu months={months} channels={channels} campaigns={campaigns} funnel={funnel}/>
          </>)}
          {mode==="input"&&(
            <button onClick={()=>{setMonths(defaultMonths());setChannels(defaultChannels());setCampaigns(defaultCampaigns());setFunnel(defaultFunnel());setGoals(defaultGoals());}} style={{background:C.card,color:C.muted,border:`1px solid ${C.border}`,borderRadius:9,padding:isMobile?"6px 10px":"8px 16px",fontSize:isMobile?11:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>↺ Reset</button>
          )}
        </div>
      </div>
      <div style={{padding:`24px ${pad} 48px`}}>
        {mode==="input"?(
          <DataInputMode months={months} setMonths={setMonths} channels={channels} setChannels={setChannels}
            campaigns={campaigns} setCampaigns={setCampaigns} funnel={funnel} setFunnel={setFunnel}
            goals={goals} setGoals={setGoals} onLaunch={()=>setMode("dashboard")}/>
        ):(
          <DashboardView months={months} channels={channels} campaigns={campaigns} funnel={funnel} goals={goals}/>
        )}
      </div>
    </div>
  );
}
