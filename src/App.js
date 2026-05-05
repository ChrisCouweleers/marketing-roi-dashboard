import { useState, useEffect, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart,
  ReferenceLine,
} from "recharts";

// ─── Theme ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0B0F1A", card: "#111827", cardAlt: "#0F172A", cardHover: "#1A2235",
  border: "#1E293B", borderLight: "#2A3650",
  accent: "#06D6A0", accentDim: "rgba(6,214,160,0.12)",
  warn: "#FFD166", danger: "#EF476F", info: "#118AB2", purple: "#8338EC", cyan: "#06B6D4",
  text: "#F1F5F9", muted: "#94A3B8", dim: "#64748B", faint: "#475569",
  dragOver: "rgba(6,214,160,0.08)", dragBorder: "rgba(6,214,160,0.4)",
  forecast: "#F472B6",
};
const CH_COLORS = [C.accent, C.info, C.purple, C.warn, C.cyan, C.danger, "#F472B6", "#A78BFA"];

// ─── Hooks ──────────────────────────────────────────────────────────────────
function useScreen() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { isMobile: w < 640, isTablet: w < 1024, w };
}
function useAnimatedValue(target, duration = 800) {
  const [display, setDisplay] = useState(0); const prev = useRef(0);
  useEffect(() => {
    const from = prev.current, to = typeof target === "number" ? target : parseFloat(String(target).replace(/[^0-9.\-]/g, "")) || 0;
    if (isNaN(to)) { prev.current = 0; setDisplay(0); return; }
    const start = performance.now(); let raf;
    const tick = (now) => { const t = Math.min((now - start) / duration, 1); setDisplay(from + (to - from) * (1 - Math.pow(1 - t, 3))); if (t < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); prev.current = to; return () => cancelAnimationFrame(raf);
  }, [target, duration]); return display;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt$ = v => { if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`; return `$${Math.round(v).toLocaleString()}`; };
const fmtN = v => { if (v >= 1e6) return `${(v/1e6).toFixed(1)}M`; if (v >= 1e3) return `${(v/1e3).toFixed(1)}K`; return Math.round(v).toLocaleString(); };
const pct = (a,b) => b ? ((a/b)*100).toFixed(1) : "0.0";
const sum = (arr, k) => arr.reduce((s,r) => s + (Number(r[k]) || 0), 0);
const MONTH_NAMES = ["Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];

// ─── Forecasting Engine ─────────────────────────────────────────────────────
function linearForecast(data, key, nAhead) {
  const vals = data.map(d => Number(d[key]) || 0);
  const n = vals.length; if (n < 2) return Array(nAhead).fill(vals[0] || 0);
  const xMean = (n - 1) / 2, yMean = vals.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  vals.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) ** 2; });
  const slope = den ? num / den : 0, intercept = yMean - slope * xMean;
  return Array.from({ length: nAhead }, (_, i) => Math.max(0, Math.round(slope * (n + i) + intercept)));
}

// ─── Default seed data ──────────────────────────────────────────────────────
const defaultMonths = () => [
  { month:"Jul", spend:42000, revenue:126000, leads:1240, note:"" },
  { month:"Aug", spend:45000, revenue:148500, leads:1380, note:"" },
  { month:"Sep", spend:48000, revenue:158400, leads:1420, note:"" },
  { month:"Oct", spend:51000, revenue:178500, leads:1580, note:"New landing pages launched" },
  { month:"Nov", spend:55000, revenue:203500, leads:1720, note:"Black Friday push" },
  { month:"Dec", spend:52000, revenue:197600, leads:1650, note:"" },
  { month:"Jan", spend:58000, revenue:232000, leads:1890, note:"Q1 budget increase" },
  { month:"Feb", spend:62000, revenue:260400, leads:2040, note:"" },
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
const defaultGoals = () => ({ revenue: 1500000, spend: 450000, roas: 3.5, leads: 15000, cpl: 30 });
const defaultCompetitors = () => [
  { name: "Industry Average", roas: 3.0, cpl: 38, convRate: 2.8, roi: 200 },
  { name: "Top Performer", roas: 5.2, cpl: 22, convRate: 4.5, roi: 420 },
  { name: "Competitor A", roas: 2.5, cpl: 45, convRate: 2.1, roi: 150 },
];
const defaultDashNotes = () => [
  { id: 1, text: "Strong Q4 performance driven by product launch campaign", tab: "overview" },
];

// ─── Shared UI ───────────────────────────────────────────────────────────────
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

// ─── Export ──────────────────────────────────────────────────────────────────
function exportCSV(months, channels, campaigns, funnel) {
  let csv = "MARKETING ROI DASHBOARD EXPORT\n\nMONTHLY PERFORMANCE\nMonth,Spend,Revenue,Leads,ROAS,CPL,Notes\n";
  months.forEach(m => { csv += `${m.month},${m.spend},${m.revenue},${m.leads},${m.spend?(m.revenue/m.spend).toFixed(2):"0"},${m.leads?(m.spend/m.leads).toFixed(2):"0"},"${m.note||""}"\n`; });
  csv += `Totals,${sum(months,"spend")},${sum(months,"revenue")},${sum(months,"leads")},,\n\n`;
  csv += "CHANNEL PERFORMANCE\nChannel,Spend,Revenue,ROI %\n";
  channels.forEach(ch => { csv += `${ch.name},${ch.spend},${ch.revenue},${ch.spend?Math.round(((ch.revenue-ch.spend)/ch.spend)*100):0}%\n`; });
  csv += "\nCAMPAIGNS\nCampaign,Channel,Spend,Revenue,ROI %,Status\n";
  campaigns.forEach(cp => { csv += `"${cp.name}","${cp.channel}",${cp.spend},${cp.revenue},${cp.spend?Math.round(((cp.revenue-cp.spend)/cp.spend)*100):0}%,${cp.status}\n`; });
  csv += "\nFUNNEL\nStage,Volume,Conversion Rate\n";
  funnel.forEach((f,i) => { csv += `${f.stage},${f.value},${i===0?"—":`${pct(f.value,funnel[i-1].value)}%`}\n`; });
  const blob = new Blob([csv], { type:"text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "marketing-roi-report.csv"; a.click(); URL.revokeObjectURL(url);
}
function exportPDF(months, channels, campaigns, funnel) {
  const ts=sum(months,"spend"),tr=sum(months,"revenue"),tl=sum(months,"leads");
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',sans-serif;padding:40px;max-width:1000px;margin:auto}h1{font-size:26px;font-weight:800;margin-bottom:4px}h2{font-size:17px;font-weight:700;margin:28px 0 12px;border-bottom:2px solid #06D6A0;padding-bottom:5px}.sub{color:#64748B;font-size:13px;margin-bottom:28px}.kg{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:24px}.k{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;padding:14px;text-align:center}.kl{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748B;margin-bottom:4px}.kv{font-size:20px;font-weight:800;font-family:'JetBrains Mono',monospace}table{width:100%;border-collapse:collapse;font-size:12px;margin:6px 0 16px}th{background:#F1F5F9;padding:8px 12px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;color:#64748B;border-bottom:2px solid #E2E8F0}td{padding:8px 12px;border-bottom:1px solid #E2E8F0}.m{font-family:'JetBrains Mono',monospace}.f{margin-top:36px;padding-top:12px;border-top:1px solid #E2E8F0;font-size:10px;color:#94A3B8;text-align:center}@media print{body{padding:20px}}@media(max-width:640px){.kg{grid-template-columns:repeat(2,1fr)}}</style></head><body>
<h1>Marketing ROI Report</h1><p class="sub">Generated ${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
<div class="kg"><div class="k"><div class="kl">Total Revenue</div><div class="kv">${fmt$(tr)}</div></div><div class="k"><div class="kl">Total Spend</div><div class="kv">${fmt$(ts)}</div></div><div class="k"><div class="kl">Blended ROAS</div><div class="kv">${ts?(tr/ts).toFixed(2):"0"}x</div></div><div class="k"><div class="kl">Total Leads</div><div class="kv">${tl.toLocaleString()}</div></div><div class="k"><div class="kl">Avg CPL</div><div class="kv">$${tl?(ts/tl).toFixed(2):"0"}</div></div></div>
<h2>Monthly</h2><table><thead><tr><th>Month</th><th>Spend</th><th>Revenue</th><th>Leads</th><th>ROAS</th><th>Notes</th></tr></thead><tbody>${months.map(m=>`<tr><td>${m.month}</td><td class="m">${fmt$(m.spend)}</td><td class="m">${fmt$(m.revenue)}</td><td class="m">${(m.leads||0).toLocaleString()}</td><td class="m">${m.spend?(m.revenue/m.spend).toFixed(2):"—"}x</td><td style="font-size:11px;color:#64748B">${m.note||""}</td></tr>`).join("")}</tbody></table>
<h2>Channels</h2><table><thead><tr><th>Channel</th><th>Spend</th><th>Revenue</th><th>ROI</th></tr></thead><tbody>${channels.map(ch=>`<tr><td>${ch.name}</td><td class="m">${fmt$(ch.spend)}</td><td class="m">${fmt$(ch.revenue)}</td><td class="m">${ch.spend?Math.round(((ch.revenue-ch.spend)/ch.spend)*100):0}%</td></tr>`).join("")}</tbody></table>
<h2>Campaigns</h2><table><thead><tr><th>Campaign</th><th>Channel</th><th>Spend</th><th>Revenue</th><th>ROI</th><th>Status</th></tr></thead><tbody>${campaigns.map(c=>{const r=c.spend?Math.round(((c.revenue-c.spend)/c.spend)*100):0;return`<tr><td>${c.name}</td><td>${c.channel}</td><td class="m">${fmt$(c.spend)}</td><td class="m">${fmt$(c.revenue)}</td><td class="m">${r}%</td><td>${c.status}</td></tr>`;}).join("")}</tbody></table>
<h2>Funnel</h2><table><thead><tr><th>Stage</th><th>Volume</th><th>Conv. Rate</th></tr></thead><tbody>${funnel.map((f,i)=>`<tr><td>${f.stage}</td><td class="m">${fmtN(f.value)}</td><td class="m">${i===0?"—":pct(f.value,funnel[i-1].value)+"%"}</td></tr>`).join("")}</tbody></table>
<div class="f">Marketing ROI Dashboard</div></body></html>`;
  const w=window.open("","_blank");w.document.write(html);w.document.close();setTimeout(()=>w.print(),600);
}

// ─── Drag & Drop ────────────────────────────────────────────────────────────
function useDragReorder(items, setItems) {
  const dragIdx=useRef(null);const[draggedOver,setDraggedOver]=useState(null);
  return{draggedOver,
    onDragStart:(e,i)=>{dragIdx.current=i;e.dataTransfer.effectAllowed="move";},
    onDragOver:(e,i)=>{e.preventDefault();e.dataTransfer.dropEffect="move";setDraggedOver(i);},
    onDragLeave:()=>setDraggedOver(null),
    onDrop:(e,i)=>{e.preventDefault();const f=dragIdx.current;if(f===null||f===i){setDraggedOver(null);return;}const u=[...items];const[m]=u.splice(f,1);u.splice(i,0,m);setItems(u);dragIdx.current=null;setDraggedOver(null);},
    onDragEnd:()=>{dragIdx.current=null;setDraggedOver(null);},
    moveUp:i=>{if(i<=0)return;const u=[...items];[u[i-1],u[i]]=[u[i],u[i-1]];setItems(u);},
    moveDown:i=>{if(i>=items.length-1)return;const u=[...items];[u[i],u[i+1]]=[u[i+1],u[i]];setItems(u);}
  };
}
function DragHandle(){return <div style={{cursor:"grab",display:"flex",flexDirection:"column",gap:2,padding:"6px 4px",opacity:.4,flexShrink:0,alignItems:"center"}}>{[0,1,2].map(k=><div key={k} style={{display:"flex",gap:2}}><span style={{width:3,height:3,borderRadius:"50%",background:C.muted}}/><span style={{width:3,height:3,borderRadius:"50%",background:C.muted}}/></div>)}</div>;}
function MobileReorder({drag,idx,total}){return <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}><button onClick={()=>drag.moveUp(idx)} disabled={idx===0} style={{background:"none",border:"none",color:idx===0?C.border:C.muted,fontSize:14,cursor:idx===0?"default":"pointer",padding:0,lineHeight:1}}>▲</button><button onClick={()=>drag.moveDown(idx)} disabled={idx===total-1} style={{background:"none",border:"none",color:idx===total-1?C.border:C.muted,fontSize:14,cursor:idx===total-1?"default":"pointer",padding:0,lineHeight:1}}>▼</button></div>;}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA INPUT MODE
// ═══════════════════════════════════════════════════════════════════════════════
const inputLabel={color:C.dim,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5,display:"block"};
const inputStyle={width:"100%",padding:"9px 12px",fontSize:14,fontFamily:"'JetBrains Mono',monospace",background:C.cardAlt,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,outline:"none",boxSizing:"border-box",transition:"border .2s"};
const focusRing=e=>e.target.style.borderColor=C.accent;
const blurRing=e=>e.target.style.borderColor=C.border;

function InputField({label,value,onChange,type="text",placeholder=""}){return <div style={{flex:1,minWidth:0}}><label style={inputLabel}>{label}</label><input style={inputStyle} value={value} placeholder={placeholder} onChange={e=>onChange(type==="number"?(e.target.value===""?"":Number(e.target.value)):e.target.value)} type={type} onFocus={focusRing} onBlur={blurRing}/></div>;}
function SectionCard({title,subtitle,children,action}){return <div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,marginBottom:20,overflow:"hidden"}}><div style={{padding:"16px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}><div><h3 style={{margin:0,fontSize:15,fontWeight:700,color:C.text}}>{title}</h3>{subtitle&&<p style={{margin:"3px 0 0",fontSize:12,color:C.dim}}>{subtitle}</p>}</div>{action}</div><div style={{padding:"0 16px 16px"}}>{children}</div></div>;}
function AddBtn({onClick,label}){return <button onClick={onClick} style={{background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{label}</button>;}
function RemoveBtn({onClick}){return <button onClick={onClick} style={{background:"rgba(239,71,111,.1)",color:C.danger,border:"none",borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:16,lineHeight:1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>;}

function DataInputMode({months,setMonths,channels,setChannels,campaigns,setCampaigns,funnel,setFunnel,goals,setGoals,competitors,setCompetitors,onLaunch}){
  const{isMobile}=useScreen();
  const updateRow=(arr,setArr,i,k,v)=>{const n=[...arr];n[i]={...n[i],[k]:v};setArr(n);};
  const addRow=(arr,setArr,t)=>setArr([...arr,t]);
  const removeRow=(arr,setArr,i)=>{if(arr.length>1){const n=[...arr];n.splice(i,1);setArr(n);}};
  const monthsDrag=useDragReorder(months,setMonths),channelsDrag=useDragReorder(channels,setChannels),campaignsDrag=useDragReorder(campaigns,setCampaigns),funnelDrag=useDragReorder(funnel,setFunnel),compDrag=useDragReorder(competitors,setCompetitors);
  const drs=(d,i)=>({background:d.draggedOver===i?C.dragOver:"transparent",borderTop:d.draggedOver===i?`2px solid ${C.dragBorder}`:"2px solid transparent",transition:"background .15s"});

  const tabs=[{id:"monthly",label:isMobile?"Monthly":"Monthly Data",icon:"📅"},{id:"channels",label:"Channels",icon:"📡"},{id:"campaigns",label:"Campaigns",icon:"🚀"},{id:"funnel",label:"Funnel",icon:"🔽"},{id:"goals",label:"Goals",icon:"🎯"},{id:"competitors",label:isMobile?"Comp.":"Competitors",icon:"⚔️"}];
  const[tab,setTab]=useState("monthly");

  return(
    <div>
      <div style={{background:`linear-gradient(135deg,${C.accent}10,${C.info}08)`,border:`1px solid ${C.accent}20`,borderRadius:14,padding:isMobile?"14px 16px":"18px 24px",marginBottom:20,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:20,flexShrink:0,marginTop:1}}>💡</span>
        <div><div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>Enter your marketing data to generate your dashboard</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>Fill in each tab. Add <strong style={{color:C.accent}}>notes</strong> to monthly rows, set <strong style={{color:C.accent}}>goals</strong>, and enter <strong style={{color:C.accent}}>competitor</strong> benchmarks. Click <strong style={{color:C.accent}}>Generate Dashboard</strong> when ready.</div></div>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:isMobile?"7px 10px":"10px 18px",fontSize:isMobile?11:13,fontWeight:600,cursor:"pointer",background:tab===t.id?C.accent:C.card,color:tab===t.id?C.bg:C.muted,border:`1px solid ${tab===t.id?C.accent:C.border}`,borderRadius:10,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4,flex:isMobile?"1 1 auto":"none"}}><span>{t.icon}</span>{t.label}</button>)}
      </div>

      {/* Monthly — now with note field */}
      {tab==="monthly"&&(
        <SectionCard title="Monthly Performance" subtitle={isMobile?"Spend, revenue, leads, and notes":"Enter data per month. Add optional notes to annotate key events."}
          action={<AddBtn onClick={()=>addRow(months,setMonths,{month:"",spend:0,revenue:0,leads:0,note:""})} label="+ Add"/>}>
          {!isMobile&&<div style={{display:"flex",gap:10,marginBottom:6,paddingLeft:24,paddingRight:38}}>{["Month","Spend ($)","Revenue ($)","Leads","Note"].map((h,i)=><div key={i} style={{flex:h==="Note"?2:1,fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>)}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:4}}>
            {months.map((m,i)=>(isMobile?(
              <div key={i} style={{background:C.cardAlt,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.muted}}>Row {i+1}</span>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}><MobileReorder drag={monthsDrag} idx={i} total={months.length}/><RemoveBtn onClick={()=>removeRow(months,setMonths,i)}/></div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <InputField label="Month" value={m.month} onChange={v=>updateRow(months,setMonths,i,"month",v)} placeholder="Jan"/>
                  <InputField label="Leads" value={m.leads} onChange={v=>updateRow(months,setMonths,i,"leads",v)} type="number" placeholder="1500"/>
                  <InputField label="Spend ($)" value={m.spend} onChange={v=>updateRow(months,setMonths,i,"spend",v)} type="number"/>
                  <InputField label="Revenue ($)" value={m.revenue} onChange={v=>updateRow(months,setMonths,i,"revenue",v)} type="number"/>
                </div>
                <div style={{marginTop:8}}><InputField label="Note" value={m.note||""} onChange={v=>updateRow(months,setMonths,i,"note",v)} placeholder="Optional annotation"/></div>
              </div>
            ):(
              <div key={i} draggable onDragStart={e=>monthsDrag.onDragStart(e,i)} onDragOver={e=>monthsDrag.onDragOver(e,i)} onDragLeave={monthsDrag.onDragLeave} onDrop={e=>monthsDrag.onDrop(e,i)} onDragEnd={monthsDrag.onDragEnd}
                style={{display:"flex",gap:10,alignItems:"center",borderRadius:8,padding:"4px 0",...drs(monthsDrag,i)}}>
                <DragHandle/>
                <div style={{flex:1}}><input style={inputStyle} value={m.month} placeholder="e.g. Jan" onChange={e=>updateRow(months,setMonths,i,"month",e.target.value)} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={m.spend} type="number" placeholder="50000" onChange={e=>updateRow(months,setMonths,i,"spend",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={m.revenue} type="number" placeholder="200000" onChange={e=>updateRow(months,setMonths,i,"revenue",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={m.leads} type="number" placeholder="1500" onChange={e=>updateRow(months,setMonths,i,"leads",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:2}}><input style={{...inputStyle,fontFamily:"'DM Sans',sans-serif",fontSize:12}} value={m.note||""} placeholder="Optional note..." onChange={e=>updateRow(months,setMonths,i,"note",e.target.value)} onFocus={focusRing} onBlur={blurRing}/></div>
                <RemoveBtn onClick={()=>removeRow(months,setMonths,i)}/>
              </div>
            )))}
          </div>
        </SectionCard>
      )}

      {/* Channels */}
      {tab==="channels"&&(
        <SectionCard title="Channel Performance" subtitle="Spend and revenue per channel" action={<AddBtn onClick={()=>addRow(channels,setChannels,{name:"",spend:0,revenue:0})} label="+ Add"/>}>
          {!isMobile&&<div style={{display:"flex",gap:10,marginBottom:6,paddingLeft:24,paddingRight:38}}>{["Channel Name","Spend ($)","Revenue ($)"].map((h,i)=><div key={i} style={{flex:1,fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>)}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:4}}>
            {channels.map((ch,i)=>(isMobile?(
              <div key={i} style={{background:C.cardAlt,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,fontWeight:600,color:C.muted}}>{ch.name||`Channel ${i+1}`}</span><div style={{display:"flex",gap:6,alignItems:"center"}}><MobileReorder drag={channelsDrag} idx={i} total={channels.length}/><RemoveBtn onClick={()=>removeRow(channels,setChannels,i)}/></div></div>
                <InputField label="Channel Name" value={ch.name} onChange={v=>updateRow(channels,setChannels,i,"name",v)} placeholder="Paid Search"/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><InputField label="Spend ($)" value={ch.spend} onChange={v=>updateRow(channels,setChannels,i,"spend",v)} type="number"/><InputField label="Revenue ($)" value={ch.revenue} onChange={v=>updateRow(channels,setChannels,i,"revenue",v)} type="number"/></div></div>
            ):(
              <div key={i} draggable onDragStart={e=>channelsDrag.onDragStart(e,i)} onDragOver={e=>channelsDrag.onDragOver(e,i)} onDragLeave={channelsDrag.onDragLeave} onDrop={e=>channelsDrag.onDrop(e,i)} onDragEnd={channelsDrag.onDragEnd} style={{display:"flex",gap:10,alignItems:"center",borderRadius:8,padding:"4px 0",...drs(channelsDrag,i)}}>
                <DragHandle/><div style={{flex:1}}><input style={inputStyle} value={ch.name} placeholder="e.g. Paid Search" onChange={e=>updateRow(channels,setChannels,i,"name",e.target.value)} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={ch.spend} type="number" onChange={e=>updateRow(channels,setChannels,i,"spend",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={ch.revenue} type="number" onChange={e=>updateRow(channels,setChannels,i,"revenue",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div>
                <RemoveBtn onClick={()=>removeRow(channels,setChannels,i)}/></div>
            )))}
          </div></SectionCard>
      )}

      {/* Campaigns */}
      {tab==="campaigns"&&(
        <SectionCard title="Campaign Details" subtitle="Add individual campaigns" action={<AddBtn onClick={()=>addRow(campaigns,setCampaigns,{name:"",channel:"",spend:0,revenue:0,status:"active"})} label="+ Add"/>}>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {campaigns.map((cp,i)=>(
              <div key={i} {...(!isMobile?{draggable:true,onDragStart:e=>campaignsDrag.onDragStart(e,i),onDragOver:e=>campaignsDrag.onDragOver(e,i),onDragLeave:campaignsDrag.onDragLeave,onDrop:e=>campaignsDrag.onDrop(e,i),onDragEnd:campaignsDrag.onDragEnd}:{})}
                style={{background:campaignsDrag.draggedOver===i?C.dragOver:C.cardAlt,borderRadius:10,padding:12,border:campaignsDrag.draggedOver===i?`1px solid ${C.dragBorder}`:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>{!isMobile&&<DragHandle/>}<span style={{fontSize:12,fontWeight:600,color:C.muted}}>{cp.name||`Campaign ${i+1}`}</span></div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>{isMobile&&<MobileReorder drag={campaignsDrag} idx={i} total={campaigns.length}/>}<RemoveBtn onClick={()=>removeRow(campaigns,setCampaigns,i)}/></div></div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr 1fr 1fr 1fr",gap:8}}>
                  <InputField label="Campaign Name" value={cp.name} onChange={v=>updateRow(campaigns,setCampaigns,i,"name",v)} placeholder="Q4 Launch"/>
                  <InputField label="Channel" value={cp.channel} onChange={v=>updateRow(campaigns,setCampaigns,i,"channel",v)} placeholder="Email"/>
                  <div style={{display:isMobile?"grid":"contents",gridTemplateColumns:"1fr 1fr",gap:8}}><InputField label="Spend ($)" value={cp.spend} onChange={v=>updateRow(campaigns,setCampaigns,i,"spend",v)} type="number"/><InputField label="Revenue ($)" value={cp.revenue} onChange={v=>updateRow(campaigns,setCampaigns,i,"revenue",v)} type="number"/></div>
                  <div style={{minWidth:0}}><label style={inputLabel}>Status</label><select value={cp.status} onChange={e=>updateRow(campaigns,setCampaigns,i,"status",e.target.value)} style={{...inputStyle,cursor:"pointer",appearance:"auto"}} onFocus={focusRing} onBlur={blurRing}><option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option></select></div>
                </div></div>
            ))}</div></SectionCard>
      )}

      {/* Funnel */}
      {tab==="funnel"&&(
        <SectionCard title="Marketing Funnel" subtitle="Top to bottom, widest to narrowest" action={<AddBtn onClick={()=>addRow(funnel,setFunnel,{stage:"",value:0})} label="+ Add"/>}>
          {!isMobile&&<div style={{display:"flex",gap:10,marginBottom:6,paddingLeft:24,paddingRight:38}}>{["Stage Name","Volume"].map((h,i)=><div key={i} style={{flex:1,fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</div>)}</div>}
          <div style={{display:"flex",flexDirection:"column",gap:isMobile?10:4}}>
            {funnel.map((f,i)=>(isMobile?(
              <div key={i} style={{background:C.cardAlt,borderRadius:10,padding:12,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,fontWeight:600,color:C.muted}}>Stage {i+1}</span><div style={{display:"flex",gap:6,alignItems:"center"}}><MobileReorder drag={funnelDrag} idx={i} total={funnel.length}/><RemoveBtn onClick={()=>removeRow(funnel,setFunnel,i)}/></div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><InputField label="Stage" value={f.stage} onChange={v=>updateRow(funnel,setFunnel,i,"stage",v)} placeholder="Impressions"/><InputField label="Volume" value={f.value} onChange={v=>updateRow(funnel,setFunnel,i,"value",v)} type="number"/></div></div>
            ):(
              <div key={i} draggable onDragStart={e=>funnelDrag.onDragStart(e,i)} onDragOver={e=>funnelDrag.onDragOver(e,i)} onDragLeave={funnelDrag.onDragLeave} onDrop={e=>funnelDrag.onDrop(e,i)} onDragEnd={funnelDrag.onDragEnd} style={{display:"flex",gap:10,alignItems:"center",borderRadius:8,padding:"4px 0",...drs(funnelDrag,i)}}>
                <DragHandle/><div style={{flex:1}}><input style={inputStyle} value={f.stage} placeholder="e.g. Impressions" onChange={e=>updateRow(funnel,setFunnel,i,"stage",e.target.value)} onFocus={focusRing} onBlur={blurRing}/></div>
                <div style={{flex:1}}><input style={inputStyle} value={f.value} type="number" placeholder="100000" onChange={e=>updateRow(funnel,setFunnel,i,"value",e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing}/></div><RemoveBtn onClick={()=>removeRow(funnel,setFunnel,i)}/></div>
            )))}
          </div></SectionCard>
      )}

      {/* Goals */}
      {tab==="goals"&&(
        <SectionCard title="Performance Targets" subtitle="Set goals to track on the dashboard">
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr 1fr",gap:16}}>
            {[{key:"revenue",label:"Revenue Target ($)",icon:"💰",ph:"1500000"},{key:"spend",label:"Budget Cap ($)",icon:"📊",ph:"450000"},{key:"roas",label:"Target ROAS (x)",icon:"🎯",ph:"3.5"},{key:"leads",label:"Lead Target",icon:"👥",ph:"15000"},{key:"cpl",label:"Target CPL ($)",icon:"⬇️",ph:"30"}].map(g=>(
              <div key={g.key} style={{background:C.cardAlt,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:18}}>{g.icon}</span><label style={{...inputLabel,marginBottom:0}}>{g.label}</label></div>
                <input style={inputStyle} value={goals[g.key]} type="number" placeholder={g.ph} onChange={e=>setGoals({...goals,[g.key]:e.target.value===""?"":Number(e.target.value)})} onFocus={focusRing} onBlur={blurRing}/></div>
            ))}</div></SectionCard>
      )}

      {/* Competitors */}
      {tab==="competitors"&&(
        <SectionCard title="Competitor Benchmarks" subtitle="Pre-filled with industry defaults. Edit or add your own." action={<AddBtn onClick={()=>addRow(competitors,setCompetitors,{name:"",roas:0,cpl:0,convRate:0,roi:0})} label="+ Add"/>}>
          <div style={{display:"flex",flexDirection:"column",gap:isMobile?12:8}}>
            {competitors.map((comp,i)=>(
              <div key={i} {...(!isMobile?{draggable:true,onDragStart:e=>compDrag.onDragStart(e,i),onDragOver:e=>compDrag.onDragOver(e,i),onDragLeave:compDrag.onDragLeave,onDrop:e=>compDrag.onDrop(e,i),onDragEnd:compDrag.onDragEnd}:{})}
                style={{background:compDrag.draggedOver===i?C.dragOver:C.cardAlt,borderRadius:10,padding:12,border:compDrag.draggedOver===i?`1px solid ${C.dragBorder}`:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>{!isMobile&&<DragHandle/>}<span style={{fontSize:12,fontWeight:600,color:C.muted}}>{comp.name||`Competitor ${i+1}`}</span></div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>{isMobile&&<MobileReorder drag={compDrag} idx={i} total={competitors.length}/>}<RemoveBtn onClick={()=>removeRow(competitors,setCompetitors,i)}/></div></div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"2fr 1fr 1fr 1fr 1fr",gap:8}}>
                  <InputField label="Name" value={comp.name} onChange={v=>updateRow(competitors,setCompetitors,i,"name",v)} placeholder="Competitor A"/>
                  <InputField label="ROAS (x)" value={comp.roas} onChange={v=>updateRow(competitors,setCompetitors,i,"roas",v)} type="number" placeholder="3.0"/>
                  <InputField label="CPL ($)" value={comp.cpl} onChange={v=>updateRow(competitors,setCompetitors,i,"cpl",v)} type="number" placeholder="35"/>
                  <InputField label="Conv. Rate (%)" value={comp.convRate} onChange={v=>updateRow(competitors,setCompetitors,i,"convRate",v)} type="number" placeholder="3.0"/>
                  <InputField label="ROI (%)" value={comp.roi} onChange={v=>updateRow(competitors,setCompetitors,i,"roi",v)} type="number" placeholder="200"/>
                </div></div>
            ))}</div>
          <div style={{marginTop:14,padding:"10px 14px",borderRadius:8,background:"rgba(131,56,236,.04)",border:`1px solid rgba(131,56,236,.12)`,fontSize:12,color:C.muted}}>
            ⚔️ <strong style={{color:C.purple}}>Tip:</strong> Your metrics will be compared against these benchmarks on the dashboard. "Industry Average" and "Top Performer" are pre-filled defaults — adjust them to match your market.</div>
        </SectionCard>
      )}

      <div style={{display:"flex",justifyContent:"center",marginTop:16}}>
        <button onClick={onLaunch} style={{background:`linear-gradient(135deg,${C.accent},#04B890)`,color:C.bg,border:"none",borderRadius:12,padding:isMobile?"14px 36px":"15px 52px",fontSize:isMobile?15:16,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 4px 24px ${C.accent}33`,width:isMobile?"100%":"auto"}}>Generate Dashboard →</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════════════════════

function KPI({title,rawValue,change,icon,color=C.accent,goal,goalLabel,invertGoal}){
  const animated=useAnimatedValue(rawValue||0);
  const pos=change===null||parseFloat(change)>=0;
  const format=()=>{
    if(title==="Blended ROAS")return`${animated.toFixed(2)}x`;if(title==="Avg CPL")return`$${animated.toFixed(2)}`;
    if(title==="Total Leads")return Math.round(animated).toLocaleString();return fmt$(Math.round(animated));};
  const goalPct=goal?(invertGoal?goal/Math.max(rawValue||1,1)*100:(rawValue||0)/goal*100):null;
  const goalMet=goal?(invertGoal?(rawValue||0)<=goal:(rawValue||0)>=goal):false;
  return(
    <div style={{background:C.card,borderRadius:14,padding:"18px 16px",border:`1px solid ${C.border}`,position:"relative",overflow:"hidden",minWidth:0}}>
      <div style={{position:"absolute",top:0,right:0,width:60,height:60,background:`radial-gradient(circle at top right,${color}15,transparent 70%)`}}/>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:C.muted,fontSize:11,fontWeight:600,letterSpacing:".04em",textTransform:"uppercase"}}>{title}</span><span style={{fontSize:16}}>{icon}</span></div>
      <div style={{fontSize:24,fontWeight:700,color:C.text,letterSpacing:"-.02em"}}>{format()}</div>
      {change!==null&&<div style={{marginTop:6,display:"flex",alignItems:"center",gap:5}}><span style={{background:pos?"rgba(6,214,160,.14)":"rgba(239,71,111,.14)",color:pos?C.accent:C.danger,fontSize:10,fontWeight:600,padding:"2px 6px",borderRadius:5}}>{pos?"▲":"▼"} {Math.abs(parseFloat(change))}%</span></div>}
      {goal>0&&goalPct!==null&&(<div style={{marginTop:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:9,fontWeight:600,color:C.dim,textTransform:"uppercase"}}>Goal: {goalLabel}</span><span style={{fontSize:10,fontWeight:700,color:goalMet?C.accent:C.warn,fontFamily:"'JetBrains Mono',monospace"}}>{Math.min(Math.round(goalPct),999)}%</span></div>
        <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.min(goalPct,100)}%`,height:"100%",borderRadius:3,background:goalMet?C.accent:goalPct>75?C.warn:C.danger,transition:"width .8s ease"}}/></div></div>)}
    </div>);
}

function DateRangeFilter({months,range,setRange,isMobile}){
  if(months.length<3)return null;const labels=months.map(m=>m.month);
  const isAll=range[0]===0&&range[1]===months.length-1,isL3=range[1]-range[0]===2&&range[1]===months.length-1,isL6=range[1]-range[0]===5&&range[1]===months.length-1;
  const pill=(active,onClick,label)=><button onClick={onClick} style={{padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",background:active?C.accent+"22":"transparent",color:active?C.accent:C.dim,border:`1px solid ${active?C.accent+"44":C.border}`,borderRadius:6}}>{label}</button>;
  const sel=(val,onChange)=><select value={val} onChange={onChange} style={{padding:"5px 8px",fontSize:11,background:C.cardAlt,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",outline:"none"}}>{labels.map((l,i)=><option key={i} value={i}>{l}</option>)}</select>;
  return(<div style={{display:"flex",alignItems:isMobile?"flex-start":"center",gap:isMobile?8:14,marginBottom:20,flexDirection:isMobile?"column":"row"}}>
    <span style={{fontSize:11,fontWeight:600,color:C.dim,textTransform:"uppercase",letterSpacing:".05em",flexShrink:0}}>Range</span>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{pill(isAll,()=>setRange([0,months.length-1]),"All")}{months.length>=6&&pill(isL3,()=>setRange([months.length-3,months.length-1]),"Last 3")}{months.length>=8&&pill(isL6,()=>setRange([months.length-6,months.length-1]),"Last 6")}</div>
    <div style={{display:"flex",alignItems:"center",gap:6}}>{sel(range[0],e=>setRange([Number(e.target.value),Math.max(Number(e.target.value),range[1])]))}<span style={{color:C.dim,fontSize:11}}>to</span>{sel(range[1],e=>setRange([Math.min(range[0],Number(e.target.value)),Number(e.target.value)]))}</div>
  </div>);
}

function ExportMenu({months,channels,campaigns,funnel}){
  const[open,setOpen]=useState(false);const ref=useRef(null);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const bb={display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"transparent",border:"none",color:C.text,fontSize:13,fontWeight:500,cursor:"pointer",borderRadius:8,fontFamily:"'DM Sans',sans-serif",textAlign:"left"};
  return(<div ref={ref} style={{position:"relative"}}>
    <button onClick={()=>setOpen(!open)} style={{background:`linear-gradient(135deg,${C.accent},#04B890)`,color:C.bg,border:"none",borderRadius:9,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>📤 Export ▼</button>
    {open&&<div style={{position:"absolute",top:"calc(100% + 6px)",right:0,width:220,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 12px 40px rgba(0,0,0,.5)",zIndex:100,padding:6}}>
      <button style={bb} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"} onClick={()=>{exportPDF(months,channels,campaigns,funnel);setOpen(false);}}><span style={{fontSize:18}}>📄</span><div><div style={{fontWeight:600}}>PDF</div><div style={{fontSize:11,color:C.dim}}>Print-ready</div></div></button>
      <div style={{height:1,background:C.border,margin:"2px 8px"}}/>
      <button style={bb} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"} onClick={()=>{exportCSV(months,channels,campaigns,funnel);setOpen(false);}}><span style={{fontSize:18}}>📊</span><div><div style={{fontWeight:600}}>CSV</div><div style={{fontSize:11,color:C.dim}}>Excel / Sheets</div></div></button>
    </div>}
  </div>);
}

// ─── Dashboard Notes Component ──────────────────────────────────────────────
function DashboardNotes({notes,setNotes,currentTab,isMobile}){
  const[adding,setAdding]=useState(false);const[draft,setDraft]=useState("");
  const tabNotes=notes.filter(n=>n.tab===currentTab);
  const addNote=()=>{if(!draft.trim())return;setNotes([...notes,{id:Date.now(),text:draft.trim(),tab:currentTab}]);setDraft("");setAdding(false);};
  const removeNote=id=>setNotes(notes.filter(n=>n.id!==id));
  return(
    <div style={{marginTop:20,background:C.card,borderRadius:14,padding:isMobile?14:20,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:tabNotes.length||adding?12:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>📝</span><span style={{fontSize:12,fontWeight:700,color:C.text}}>Notes & Annotations</span></div>
        {!adding&&<button onClick={()=>setAdding(true)} style={{background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}33`,borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add Note</button>}
      </div>
      {tabNotes.map(n=>(
        <div key={n.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:`1px solid ${C.border}22`}}>
          <div style={{width:3,height:3,borderRadius:"50%",background:C.accent,marginTop:7,flexShrink:0}}/>
          <div style={{flex:1,fontSize:13,color:C.muted,lineHeight:1.5}}>{n.text}</div>
          <button onClick={()=>removeNote(n.id)} style={{background:"none",border:"none",color:C.faint,cursor:"pointer",fontSize:14,padding:0,flexShrink:0}}>×</button>
        </div>
      ))}
      {adding&&(<div style={{display:"flex",gap:8,marginTop:4}}>
        <input style={{...inputStyle,flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:13}} value={draft} placeholder="Type a note for this section..." onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNote()} onFocus={focusRing} onBlur={blurRing} autoFocus/>
        <button onClick={addNote} style={{background:C.accent,color:C.bg,border:"none",borderRadius:8,padding:"0 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Add</button>
        <button onClick={()=>{setAdding(false);setDraft("");}} style={{background:C.cardAlt,color:C.dim,border:`1px solid ${C.border}`,borderRadius:8,padding:"0 12px",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
      </div>)}
    </div>
  );
}

function DashboardView({months,channels,campaigns,funnel,goals,competitors,dashNotes,setDashNotes,onEdit}){
  const{isMobile,isTablet}=useScreen();
  const[tab,setTab]=useState("overview");
  const[range,setRange]=useState([0,months.length-1]);
  const[forecastN,setForecastN]=useState(3);
  const[showWelcome,setShowWelcome]=useState(true);

  const filteredMonths=months.slice(range[0],range[1]+1);
  const enrichedMonths=filteredMonths.map(m=>({...m,roas:m.spend?+(m.revenue/m.spend).toFixed(2):0,cpl:m.leads?+(m.spend/m.leads).toFixed(2):0}));
  const totalSpend=sum(months,"spend"),totalRev=sum(months,"revenue"),totalLeads=sum(months,"leads");
  const blendedROAS=totalSpend?(totalRev/totalSpend):0,avgCPL=totalLeads?(totalSpend/totalLeads):0;
  const half=Math.floor(months.length/2)||1,fH=months.slice(0,half),sH=months.slice(half);
  const chg=k=>{const a=sum(fH,k),b=sum(sH,k);return a?(((b-a)/a)*100).toFixed(1):null;};
  const revChange=chg("revenue"),spendChange=chg("spend"),leadChange=chg("leads");
  const fROAS=sum(fH,"spend")?sum(fH,"revenue")/sum(fH,"spend"):0,sROAS=sum(sH,"spend")?sum(sH,"revenue")/sum(sH,"spend"):0;
  const roasChange=fROAS?(((sROAS-fROAS)/fROAS)*100).toFixed(1):null;
  const fCPL=sum(fH,"leads")?sum(fH,"spend")/sum(fH,"leads"):0,sCPL=sum(sH,"leads")?sum(sH,"spend")/sum(sH,"leads"):0;
  const cplChange=fCPL?(((sCPL-fCPL)/fCPL)*100).toFixed(1):null;

  const enrichedChannels=channels.map((ch,i)=>({...ch,roi:ch.spend?Math.round(((ch.revenue-ch.spend)/ch.spend)*100):0,color:CH_COLORS[i%CH_COLORS.length]}));
  const totalChSpend=sum(channels,"spend");
  const pieData=enrichedChannels.map(ch=>({name:ch.name,value:totalChSpend?Math.round((ch.spend/totalChSpend)*100):0,color:ch.color}));
  const enrichedCampaigns=campaigns.map(cp=>({...cp,roi:cp.spend?Math.round(((cp.revenue-cp.spend)/cp.spend)*100):0}));
  const bestCampaign=enrichedCampaigns.length?enrichedCampaigns.reduce((a,b)=>a.roi>b.roi?a:b):null;
  const activeCampaigns=campaigns.filter(c=>c.status==="active").length;
  const chartH=isMobile?220:280,smH=200;

  // Forecasting data
  const revF=linearForecast(months,"revenue",forecastN),spendF=linearForecast(months,"spend",forecastN),leadsF=linearForecast(months,"leads",forecastN);
  const lastMonth=months[months.length-1]?.month||"";
  const forecastData=[...enrichedMonths.map(m=>({month:m.month,revenue:m.revenue,spend:m.spend,forecastRev:null,forecastSpend:null,type:"actual"})),
    ...revF.map((r,i)=>({month:`+${i+1}mo`,revenue:null,spend:null,forecastRev:r,forecastSpend:spendF[i],type:"forecast"}))];
  // Bridge point: last actual + first forecast overlap
  if(forecastData.length>enrichedMonths.length&&enrichedMonths.length>0){
    const lastActual=enrichedMonths[enrichedMonths.length-1];
    forecastData[enrichedMonths.length-1].forecastRev=lastActual.revenue;
    forecastData[enrichedMonths.length-1].forecastSpend=lastActual.spend;
  }

  // Competitor benchmark data for your metrics
  const yourMetrics={roas:blendedROAS?+blendedROAS.toFixed(2):0,cpl:avgCPL?+avgCPL.toFixed(2):0,
    convRate:funnel.length>=2?+pct(funnel[funnel.length-1].value,funnel[0].value):0,
    roi:totalSpend?Math.round(((totalRev-totalSpend)/totalSpend)*100):0};

  // Months with notes for annotations
  const notedMonths=enrichedMonths.filter(m=>m.note);

  const tabs=[{id:"overview",label:"Overview"},{id:"forecast",label:isMobile?"Forecast":"Forecasting"},{id:"channels",label:isMobile?"Channels":"Channels"},{id:"campaigns",label:"Campaigns"},{id:"funnel",label:isMobile?"Funnel":"Funnel"},{id:"benchmarks",label:isMobile?"Bench.":"Benchmarks"}];

  return(
    <div>
      {showWelcome&&(
        <div style={{
          background:`linear-gradient(135deg, ${C.accentDim}, rgba(17,138,178,0.07))`,
          border:`1px solid ${C.accent}40`,
          borderRadius:14,
          padding:isMobile?"14px 14px":"16px 22px",
          marginBottom:20,
          display:"flex",
          alignItems:isMobile?"flex-start":"center",
          gap:isMobile?12:16,
          flexDirection:isMobile?"column":"row"
        }}>
          <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
            <div style={{fontSize:26,lineHeight:1,flexShrink:0}}>👋</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:isMobile?13:14,fontWeight:700,color:C.text,marginBottom:3}}>You're viewing sample data</div>
              <div style={{fontSize:isMobile?11:12,color:C.muted,lineHeight:1.5}}>
                Click <span style={{color:C.accent,fontWeight:700}}>✏️ Edit Data</span> in the top right to enter your own monthly performance, channels, campaigns, and goals — then come back here to see your real dashboard.
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,alignSelf:isMobile?"stretch":"auto",justifyContent:isMobile?"space-between":"flex-end"}}>
            <button onClick={onEdit} style={{
              background:`linear-gradient(135deg, ${C.accent}, #04B890)`,
              color:C.bg,border:"none",borderRadius:9,
              padding:isMobile?"9px 14px":"10px 18px",
              fontSize:isMobile?12:13,fontWeight:700,
              cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              whiteSpace:"nowrap",flex:isMobile?1:"none"
            }}>Enter Your Data →</button>
            <button onClick={()=>setShowWelcome(false)} title="Dismiss" style={{
              background:"transparent",color:C.faint,border:"none",
              cursor:"pointer",fontSize:20,padding:"4px 10px",
              lineHeight:1,fontFamily:"'DM Sans',sans-serif"
            }}>×</button>
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
        {tabs.map(t=>{
          const isActive=tab===t.id;
          return(
            <button
              key={t.id}
              onClick={()=>setTab(t.id)}
              style={{
                padding:isMobile?"8px 12px":"10px 18px",
                fontSize:isMobile?11:13,
                fontWeight:isActive?700:600,
                cursor:"pointer",
                background:isActive?C.accentDim:C.cardAlt,
                color:isActive?C.accent:C.muted,
                border:`1px solid ${isActive?C.accent+"55":C.border}`,
                borderRadius:9,
                fontFamily:"'DM Sans',sans-serif",
                flex:isMobile?"1 1 auto":"none",
                transition:"background .18s ease, color .18s ease, border-color .18s ease, transform .18s ease, box-shadow .18s ease",
                transform:"translateY(0)",
                boxShadow:isActive?`0 0 0 3px ${C.accent}14`:"none"
              }}
              onMouseEnter={e=>{
                if(isActive)return;
                e.currentTarget.style.background=C.cardHover;
                e.currentTarget.style.color=C.text;
                e.currentTarget.style.borderColor=C.borderLight;
                e.currentTarget.style.transform="translateY(-1px)";
              }}
              onMouseLeave={e=>{
                if(isActive)return;
                e.currentTarget.style.background=C.cardAlt;
                e.currentTarget.style.color=C.muted;
                e.currentTarget.style.borderColor=C.border;
                e.currentTarget.style.transform="translateY(0)";
              }}
            >{t.label}</button>
          );
        })}
      </div>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {tab==="overview"&&(<>
        <div style={isMobile?{display:"flex",gap:10,marginBottom:24,overflowX:"auto",paddingBottom:8,WebkitOverflowScrolling:"touch",scrollSnapType:"x mandatory"}:{display:"grid",gridTemplateColumns:isTablet?"repeat(3,1fr)":"repeat(5,1fr)",gap:14,marginBottom:28}}>
          {[{title:"Total Revenue",rawValue:totalRev,change:revChange,icon:"💰",color:C.accent,goal:goals.revenue,goalLabel:fmt$(goals.revenue)},
            {title:"Total Spend",rawValue:totalSpend,change:spendChange,icon:"📊",color:C.info,goal:goals.spend,goalLabel:fmt$(goals.spend),invertGoal:true},
            {title:"Blended ROAS",rawValue:blendedROAS,change:roasChange,icon:"🎯",color:C.purple,goal:goals.roas,goalLabel:`${goals.roas}x`},
            {title:"Total Leads",rawValue:totalLeads,change:leadChange,icon:"👥",color:C.warn,goal:goals.leads,goalLabel:fmtN(goals.leads)},
            {title:"Avg CPL",rawValue:avgCPL,change:cplChange,icon:"⬇️",color:C.cyan,goal:goals.cpl,goalLabel:`$${goals.cpl}`,invertGoal:true}
          ].map((k,i)=><div key={i} style={isMobile?{minWidth:175,flex:"0 0 175px",scrollSnapAlign:"start"}:{}}><KPI {...k}/></div>)}
        </div>
        {isMobile&&<div style={{fontSize:10,color:C.dim,textAlign:"center",marginTop:-16,marginBottom:16}}>← Swipe →</div>}
        <DateRangeFilter months={months} range={range} setRange={setRange} isMobile={isMobile}/>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:16,marginBottom:16}}>
          <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`}}>
            <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:C.text}}>Revenue vs. Spend</h3>
            <ResponsiveContainer width="100%" height={chartH}>
              <AreaChart data={enrichedMonths} margin={{top:5,right:10,left:isMobile?-10:10,bottom:5}}>
                <defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={.3}/><stop offset="100%" stopColor={C.accent} stopOpacity={0}/></linearGradient><linearGradient id="gSpd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.info} stopOpacity={.2}/><stop offset="100%" stopColor={C.info} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}}/>
                <YAxis tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}} tickFormatter={fmt$} width={isMobile?45:60}/>
                <Tooltip content={<Tip fmt={fmt$}/>}/>
                {notedMonths.map(m=><ReferenceLine key={m.month} x={m.month} stroke={C.warn} strokeDasharray="4 4" strokeOpacity={.5} label={{value:"📌",position:"top",fontSize:12}}/>)}
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.accent} fill="url(#gRev)" strokeWidth={2.5} dot={{fill:C.accent,r:isMobile?2:3.5}}/>
                <Area type="monotone" dataKey="spend" name="Spend" stroke={C.info} fill="url(#gSpd)" strokeWidth={2} dot={{fill:C.info,r:isMobile?1.5:2.5}}/>
                <Legend wrapperStyle={{color:C.muted,fontSize:10,paddingTop:8}}/>
              </AreaChart></ResponsiveContainer>
            {notedMonths.length>0&&<div style={{marginTop:10,display:"flex",flexDirection:"column",gap:4}}>{notedMonths.map(m=><div key={m.month} style={{fontSize:11,color:C.muted,display:"flex",gap:6}}><span style={{color:C.warn,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{m.month}:</span><span>{m.note}</span></div>)}</div>}
          </div>
          <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`}}>
            <h3 style={{margin:"0 0 12px",fontSize:14,fontWeight:700,color:C.text}}>Budget Allocation</h3>
            <ResponsiveContainer width="100%" height={isMobile?180:200}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={isMobile?40:50} outerRadius={isMobile?65:78} paddingAngle={3} dataKey="value">{pieData.map((e,i)=><Cell key={i} fill={e.color} stroke="transparent"/>)}</Pie>
                <Tooltip content={({active,payload})=>active&&payload?.length?<div style={{background:"#1A2235",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px"}}><span style={{color:C.text,fontSize:11,fontWeight:600}}>{payload[0].name}: {payload[0].value}%</span></div>:null}/></PieChart></ResponsiveContainer>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>{pieData.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:C.muted}}><span style={{width:7,height:7,borderRadius:"50%",background:d.color}}/>{d.name}</div>)}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
          <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`}}>
            <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:C.text}}>ROAS Trend</h3>
            <ResponsiveContainer width="100%" height={smH}><LineChart data={enrichedMonths} margin={{top:5,right:10,left:isMobile?-10:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}}/><YAxis tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}} tickFormatter={v=>`${v}x`} width={isMobile?35:60}/>
              <Tooltip content={<Tip fmt={v=>`${v}x`}/>}/><Line type="monotone" dataKey="roas" name="ROAS" stroke={C.purple} strokeWidth={3} dot={{fill:C.purple,r:isMobile?3:4.5,strokeWidth:2,stroke:C.card}}/></LineChart></ResponsiveContainer></div>
          <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`}}>
            <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:C.text}}>Lead Gen & CPL</h3>
            <ResponsiveContainer width="100%" height={smH}><ComposedChart data={enrichedMonths} margin={{top:5,right:10,left:isMobile?-10:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}}/>
              <YAxis yAxisId="l" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}} width={isMobile?35:60}/><YAxis yAxisId="r" orientation="right" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}} tickFormatter={v=>`$${v}`} width={isMobile?40:60}/>
              <Tooltip content={<Tip fmt={(v,n)=>n==="CPL"?`$${v}`:fmtN(v)}/>}/><Bar yAxisId="l" dataKey="leads" name="Leads" fill={C.info} radius={[4,4,0,0]} barSize={isMobile?14:24}/><Line yAxisId="r" type="monotone" dataKey="cpl" name="CPL" stroke={C.warn} strokeWidth={2.5} dot={{fill:C.warn,r:isMobile?2.5:3.5}}/>
              <Legend wrapperStyle={{color:C.muted,fontSize:10,paddingTop:8}}/></ComposedChart></ResponsiveContainer></div>
        </div>
        <DashboardNotes notes={dashNotes} setNotes={setDashNotes} currentTab="overview" isMobile={isMobile}/>
      </>)}

      {/* ── Forecasting ──────────────────────────────────────────────────── */}
      {tab==="forecast"&&(<>
        <div style={{display:"flex",alignItems:isMobile?"flex-start":"center",gap:isMobile?8:14,marginBottom:20,flexDirection:isMobile?"column":"row",flexWrap:"wrap"}}>
          <span style={{fontSize:11,fontWeight:600,color:C.dim,textTransform:"uppercase",letterSpacing:".05em"}}>Project ahead</span>
          <div style={{display:"flex",gap:6}}>
            {[3,6,9,12].map(n=><button key={n} onClick={()=>setForecastN(n)} style={{padding:"5px 14px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",background:forecastN===n?C.forecast+"22":"transparent",color:forecastN===n?C.forecast:C.dim,border:`1px solid ${forecastN===n?C.forecast+"44":C.border}`,borderRadius:6}}>{n} months</button>)}
          </div>
        </div>
        <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`,marginBottom:18}}>
          <h3 style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:C.text}}>Revenue & Spend Forecast</h3>
          <p style={{margin:"0 0 16px",fontSize:11,color:C.dim}}>Solid lines = actual data. Dashed lines = linear projection based on your trend.</p>
          <ResponsiveContainer width="100%" height={isMobile?260:320}>
            <LineChart data={forecastData} margin={{top:5,right:10,left:isMobile?-10:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="month" tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}}/>
              <YAxis tick={{fill:C.dim,fontSize:isMobile?9:11}} axisLine={{stroke:C.border}} tickFormatter={fmt$} width={isMobile?45:60}/>
              <Tooltip content={<Tip fmt={fmt$}/>}/>
              <Line type="monotone" dataKey="revenue" name="Revenue (Actual)" stroke={C.accent} strokeWidth={2.5} dot={{fill:C.accent,r:3}} connectNulls={false}/>
              <Line type="monotone" dataKey="spend" name="Spend (Actual)" stroke={C.info} strokeWidth={2} dot={{fill:C.info,r:2.5}} connectNulls={false}/>
              <Line type="monotone" dataKey="forecastRev" name="Revenue (Projected)" stroke={C.accent} strokeWidth={2.5} strokeDasharray="8 4" dot={{fill:C.accent,r:3,strokeDasharray:""}} connectNulls={false}/>
              <Line type="monotone" dataKey="forecastSpend" name="Spend (Projected)" stroke={C.info} strokeWidth={2} strokeDasharray="8 4" dot={{fill:C.info,r:2.5,strokeDasharray:""}} connectNulls={false}/>
              <Legend wrapperStyle={{color:C.muted,fontSize:10,paddingTop:8}}/>
            </LineChart></ResponsiveContainer>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14}}>
          {[{label:"Projected Revenue",val:fmt$(revF.reduce((a,b)=>a+b,0)),sub:`Next ${forecastN} months total`,color:C.accent,icon:"📈"},
            {label:"Projected Spend",val:fmt$(spendF.reduce((a,b)=>a+b,0)),sub:`Next ${forecastN} months total`,color:C.info,icon:"📊"},
            {label:"Projected Leads",val:fmtN(leadsF.reduce((a,b)=>a+b,0)),sub:`Next ${forecastN} months total`,color:C.warn,icon:"👥"}
          ].map((c,i)=><div key={i} style={{background:C.card,borderRadius:14,padding:isMobile?16:22,border:`1px solid ${C.border}`,textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:6}}>{c.icon}</div>
            <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",marginBottom:4}}>{c.label}</div>
            <div style={{fontSize:isMobile?22:28,fontWeight:800,color:c.color,fontFamily:"'JetBrains Mono',monospace"}}>{c.val}</div>
            <div style={{fontSize:10,color:C.faint,marginTop:4}}>{c.sub}</div></div>)}
        </div>
        <DashboardNotes notes={dashNotes} setNotes={setDashNotes} currentTab="forecast" isMobile={isMobile}/>
      </>)}

      {/* ── Channels ─────────────────────────────────────────────────────── */}
      {tab==="channels"&&(<>
        <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`,marginBottom:18}}>
          <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:C.text}}>Channel ROI Comparison</h3>
          <ResponsiveContainer width="100%" height={Math.max(200,enrichedChannels.length*52)}>
            <BarChart data={enrichedChannels} layout="vertical" margin={{top:5,right:20,left:isMobile?10:90,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/><XAxis type="number" tick={{fill:C.dim,fontSize:11}} axisLine={{stroke:C.border}} tickFormatter={v=>`${v}%`}/>
              <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:isMobile?10:12}} axisLine={{stroke:C.border}} width={isMobile?70:85}/>
              <Tooltip content={<Tip fmt={v=>`${v}%`}/>}/><Bar dataKey="roi" name="ROI %" radius={[0,6,6,0]} barSize={22}>{enrichedChannels.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar>
            </BarChart></ResponsiveContainer></div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,1fr)":"repeat(3,1fr)",gap:14}}>
          {enrichedChannels.map((ch,i)=><div key={i} style={{background:C.card,borderRadius:14,padding:isMobile?16:22,border:`1px solid ${C.border}`,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,background:`linear-gradient(90deg,${ch.color},transparent)`}}/>
            <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>{ch.name}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase",marginBottom:3}}>Spend</div><div style={{color:C.text,fontSize:16,fontWeight:600}}>{fmt$(ch.spend)}</div></div>
              <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase",marginBottom:3}}>Revenue</div><div style={{color:C.accent,fontSize:16,fontWeight:600}}>{fmt$(ch.revenue)}</div></div>
              <div style={{gridColumn:"1/-1"}}><div style={{color:C.dim,fontSize:10,textTransform:"uppercase",marginBottom:5}}>ROI</div><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{flex:1,height:5,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.min(ch.roi/7,100)}%`,height:"100%",background:ch.color,borderRadius:3}}/></div><span style={{color:ch.color,fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{ch.roi}%</span></div></div>
            </div></div>)}
        </div>
        <DashboardNotes notes={dashNotes} setNotes={setDashNotes} currentTab="channels" isMobile={isMobile}/>
      </>)}

      {/* ── Campaigns ────────────────────────────────────────────────────── */}
      {tab==="campaigns"&&(<>
        {isMobile?<div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>{enrichedCampaigns.map((c,i)=><div key={i} style={{background:C.card,borderRadius:12,padding:16,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:14,fontWeight:600,color:C.text}}>{c.name}</div><span style={{fontSize:10,fontWeight:600,textTransform:"uppercase",padding:"3px 9px",borderRadius:5,background:c.status==="active"?"rgba(6,214,160,.1)":c.status==="completed"?"rgba(131,56,236,.1)":"rgba(255,209,102,.1)",color:c.status==="active"?C.accent:c.status==="completed"?C.purple:C.warn}}>{c.status}</span></div>
          <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{c.channel}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase"}}>Spend</div><div style={{color:C.text,fontSize:14,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{fmt$(c.spend)}</div></div>
            <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase"}}>Revenue</div><div style={{color:C.accent,fontSize:14,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{fmt$(c.revenue)}</div></div>
            <div><div style={{color:C.dim,fontSize:10,textTransform:"uppercase"}}>ROI</div><div style={{color:c.roi>=400?C.accent:c.roi>=200?C.info:C.warn,fontSize:14,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{c.roi}%</div></div></div></div>)}</div>
        :<div style={{background:C.card,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:20}}><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
          <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Campaign","Channel","Spend","Revenue","ROI","Status"].map((h,i)=><th key={i} style={{padding:"13px 18px",textAlign:"left",fontSize:10,fontWeight:600,color:C.dim,textTransform:"uppercase",background:"rgba(0,0,0,.2)"}}>{h}</th>)}</tr></thead>
          <tbody>{enrichedCampaigns.map((c,i)=><tr key={i} style={{borderBottom:`1px solid ${C.border}`}} onMouseEnter={e=>e.currentTarget.style.background=C.cardHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{padding:"13px 18px",fontSize:13,fontWeight:600,color:C.text}}>{c.name}</td><td style={{padding:"13px 18px",fontSize:12,color:C.muted}}>{c.channel}</td>
            <td style={{padding:"13px 18px",fontSize:13,fontFamily:"'JetBrains Mono',monospace"}}>{fmt$(c.spend)}</td><td style={{padding:"13px 18px",fontSize:13,color:C.accent,fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>{fmt$(c.revenue)}</td>
            <td style={{padding:"13px 18px"}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:55,height:4,background:C.border,borderRadius:3,overflow:"hidden"}}><div style={{width:`${Math.min(c.roi/7,100)}%`,height:"100%",borderRadius:3,background:c.roi>=400?C.accent:c.roi>=200?C.info:C.warn}}/></div><span style={{fontSize:12,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:c.roi>=400?C.accent:c.roi>=200?C.info:C.warn}}>{c.roi}%</span></div></td>
            <td style={{padding:"13px 18px"}}><span style={{fontSize:10,fontWeight:600,textTransform:"uppercase",padding:"3px 9px",borderRadius:5,background:c.status==="active"?"rgba(6,214,160,.1)":c.status==="completed"?"rgba(131,56,236,.1)":"rgba(255,209,102,.1)",color:c.status==="active"?C.accent:c.status==="completed"?C.purple:C.warn}}>{c.status}</span></td>
          </tr>)}</tbody></table></div></div>}
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:12}}>
          <div style={{background:C.card,borderRadius:14,padding:isMobile?14:22,border:`1px solid ${C.border}`,textAlign:"center"}}><div style={{color:C.dim,fontSize:10,marginBottom:4,textTransform:"uppercase"}}>Active</div><div style={{color:C.accent,fontSize:isMobile?26:32,fontWeight:800}}>{activeCampaigns}</div></div>
          <div style={{background:C.card,borderRadius:14,padding:isMobile?14:22,border:`1px solid ${C.border}`,textAlign:"center"}}><div style={{color:C.dim,fontSize:10,marginBottom:4,textTransform:"uppercase"}}>Avg ROI</div><div style={{color:C.info,fontSize:isMobile?26:32,fontWeight:800}}>{enrichedCampaigns.length?Math.round(enrichedCampaigns.reduce((s,c)=>s+c.roi,0)/enrichedCampaigns.length):0}%</div></div>
          <div style={{background:C.card,borderRadius:14,padding:isMobile?14:22,border:`1px solid ${C.border}`,textAlign:"center"}}><div style={{color:C.dim,fontSize:10,marginBottom:4,textTransform:"uppercase"}}>Best</div><div style={{color:C.purple,fontSize:isMobile?13:16,fontWeight:700}}>{bestCampaign?.name||"—"}</div></div>
          <div style={{background:C.card,borderRadius:14,padding:isMobile?14:22,border:`1px solid ${C.border}`,textAlign:"center"}}><div style={{color:C.dim,fontSize:10,marginBottom:4,textTransform:"uppercase"}}>Pipeline</div><div style={{color:C.warn,fontSize:isMobile?26:32,fontWeight:800}}>{fmt$(sum(campaigns,"revenue"))}</div></div>
        </div>
        <DashboardNotes notes={dashNotes} setNotes={setDashNotes} currentTab="campaigns" isMobile={isMobile}/>
      </>)}

      {/* ── Funnel ───────────────────────────────────────────────────────── */}
      {tab==="funnel"&&(<>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
          <div style={{background:C.card,borderRadius:16,padding:isMobile?20:28,border:`1px solid ${C.border}`}}>
            <h3 style={{margin:"0 0 20px",fontSize:14,fontWeight:700,color:C.text}}>Conversion Funnel</h3>
            <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"center"}}>
              {funnel.map((f,i)=>{const w=30+70*(1-i/(funnel.length-1||1)),op=.4+.6*(1-i/(funnel.length-1||1));return <div key={i} style={{width:`${w}%`,padding:isMobile?"10px 14px":"12px 18px",borderRadius:9,background:`linear-gradient(135deg,rgba(6,214,160,${op*.3}),rgba(17,138,178,${op*.2}))`,border:`1px solid rgba(6,214,160,${op*.3})`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:isMobile?11:12,fontWeight:600,color:C.text}}>{f.stage}</span><span style={{fontSize:isMobile?11:13,fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{fmtN(f.value)}</span></div>;})}</div></div>
          <div style={{background:C.card,borderRadius:16,padding:isMobile?20:28,border:`1px solid ${C.border}`}}>
            <h3 style={{margin:"0 0 20px",fontSize:14,fontWeight:700,color:C.text}}>Stage Conversion Rates</h3>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {funnel.slice(1).map((f,i)=>{const rate=pct(f.value,funnel[i].value);return <div key={i}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:11,color:C.muted}}>{funnel[i].stage} → {f.stage}</span><span style={{fontSize:12,fontWeight:700,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{rate}%</span></div><div style={{height:7,background:C.border,borderRadius:4,overflow:"hidden"}}><div style={{width:`${Math.min(parseFloat(rate)*2.5,100)}%`,height:"100%",borderRadius:4,background:`linear-gradient(90deg,${C.accent},${C.info})`}}/></div></div>;})}</div>
            {funnel.length>=2&&<div style={{marginTop:20,padding:isMobile?14:18,borderRadius:11,background:"rgba(6,214,160,.05)",border:`1px solid rgba(6,214,160,.12)`}}><div style={{color:C.dim,fontSize:10,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>Overall Conversion</div><div style={{display:"flex",alignItems:"baseline",gap:6,flexWrap:"wrap"}}><span style={{fontSize:isMobile?24:28,fontWeight:800,color:C.accent,fontFamily:"'JetBrains Mono',monospace"}}>{pct(funnel[funnel.length-1].value,funnel[0].value)}%</span><span style={{fontSize:11,color:C.muted}}>{funnel[0].stage} → {funnel[funnel.length-1].stage}</span></div></div>}
          </div>
        </div>
        <DashboardNotes notes={dashNotes} setNotes={setDashNotes} currentTab="funnel" isMobile={isMobile}/>
      </>)}

      {/* ── Benchmarks ───────────────────────────────────────────────────── */}
      {tab==="benchmarks"&&(<>
        <div style={{background:C.card,borderRadius:16,padding:isMobile?"16px 12px":26,border:`1px solid ${C.border}`,marginBottom:18}}>
          <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700,color:C.text}}>Your Performance vs. Competitors</h3>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
              <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                <th style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,color:C.faint,textTransform:"uppercase"}}>Metric</th>
                <th style={{padding:"10px 14px",textAlign:"center",fontSize:10,fontWeight:700,color:C.accent,textTransform:"uppercase"}}>You</th>
                {competitors.map((c,i)=><th key={i} style={{padding:"10px 14px",textAlign:"center",fontSize:10,fontWeight:700,color:CH_COLORS[(i+1)%CH_COLORS.length],textTransform:"uppercase"}}>{c.name}</th>)}
              </tr></thead>
              <tbody>
                {[{label:"ROAS",key:"roas",fmt:v=>`${v}x`,better:"higher"},{label:"CPL",key:"cpl",fmt:v=>`$${v}`,better:"lower"},{label:"Conv. Rate",key:"convRate",fmt:v=>`${v}%`,better:"higher"},{label:"ROI",key:"roi",fmt:v=>`${v}%`,better:"higher"}].map(metric=>{
                  const yours=yourMetrics[metric.key];const allVals=[yours,...competitors.map(c=>c[metric.key])];
                  const best=metric.better==="higher"?Math.max(...allVals):Math.min(...allVals);
                  return(<tr key={metric.key} style={{borderBottom:`1px solid ${C.border}`}}>
                    <td style={{padding:"12px 14px",fontSize:12,fontWeight:600,color:C.text}}>{metric.label}</td>
                    <td style={{padding:"12px 14px",textAlign:"center",fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:yours===best?C.accent:C.text}}>{metric.fmt(yours)} {yours===best&&"🏆"}</td>
                    {competitors.map((c,i)=>{const val=c[metric.key];return <td key={i} style={{padding:"12px 14px",textAlign:"center",fontSize:13,fontWeight:600,fontFamily:"'JetBrains Mono',monospace",color:val===best?C.accent:C.muted}}>{metric.fmt(val)} {val===best&&"🏆"}</td>;})}
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:14}}>
          {[{label:"ROAS",yours:yourMetrics.roas,avg:competitors.length?+(competitors.reduce((s,c)=>s+c.roas,0)/competitors.length).toFixed(2):0,fmt:v=>`${v}x`,better:"higher",color:C.accent},
            {label:"CPL",yours:yourMetrics.cpl,avg:competitors.length?+(competitors.reduce((s,c)=>s+c.cpl,0)/competitors.length).toFixed(2):0,fmt:v=>`$${v}`,better:"lower",color:C.cyan},
            {label:"Conv. Rate",yours:yourMetrics.convRate,avg:competitors.length?+(competitors.reduce((s,c)=>s+c.convRate,0)/competitors.length).toFixed(1):0,fmt:v=>`${v}%`,better:"higher",color:C.purple},
            {label:"ROI",yours:yourMetrics.roi,avg:competitors.length?Math.round(competitors.reduce((s,c)=>s+c.roi,0)/competitors.length):0,fmt:v=>`${v}%`,better:"higher",color:C.warn}
          ].map((m,i)=>{
            const winning=m.better==="higher"?m.yours>=m.avg:m.yours<=m.avg;
            return <div key={i} style={{background:C.card,borderRadius:14,padding:isMobile?14:20,border:`1px solid ${C.border}`,textAlign:"center"}}>
              <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",marginBottom:6}}>{m.label} vs Avg</div>
              <div style={{fontSize:22,fontWeight:800,color:winning?C.accent:C.danger,fontFamily:"'JetBrains Mono',monospace"}}>{m.fmt(m.yours)}</div>
              <div style={{fontSize:11,color:C.dim,marginTop:4}}>Avg: {m.fmt(m.avg)}</div>
              <div style={{marginTop:6,fontSize:10,fontWeight:600,color:winning?C.accent:C.danger}}>{winning?"✓ Outperforming":"↓ Below average"}</div>
            </div>;
          })}
        </div>
        <DashboardNotes notes={dashNotes} setNotes={setDashNotes} currentTab="benchmarks" isMobile={isMobile}/>
      </>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const{isMobile}=useScreen();
  const[mode,setMode]=useState("dashboard");
  const[months,setMonths]=useState(defaultMonths);
  const[channels,setChannels]=useState(defaultChannels);
  const[campaigns,setCampaigns]=useState(defaultCampaigns);
  const[funnel,setFunnel]=useState(defaultFunnel);
  const[goals,setGoals]=useState(defaultGoals);
  const[competitors,setCompetitors]=useState(defaultCompetitors);
  const[dashNotes,setDashNotes]=useState(defaultDashNotes);
  const[ready,setReady]=useState(false);
  useEffect(()=>{
    const l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500;600&display=swap";l.rel="stylesheet";document.head.appendChild(l);
    const s=document.createElement("style");s.textContent="html,body{overflow-x:hidden}*::-webkit-scrollbar{height:4px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:#2A3650;border-radius:4px}";document.head.appendChild(s);
    setTimeout(()=>setReady(true),80);
  },[]);
  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text,opacity:ready?1:0,transition:"opacity .5s"}}>
      <div style={{padding:isMobile?"14px 16px":"24px 36px",borderBottom:`1px solid ${C.border}`,background:"linear-gradient(180deg,rgba(6,214,160,.03) 0%,transparent 100%)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${C.accent},${C.info})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:C.bg,flexShrink:0}}>M</div>
          <div><h1 style={{margin:0,fontSize:isMobile?16:21,fontWeight:800,letterSpacing:"-.02em"}}>Marketing ROI Dashboard</h1>
            <p style={{margin:"1px 0 0",color:C.dim,fontSize:isMobile?10:12}}>{mode==="input"?"Enter your marketing data":"Executive Performance Report"}</p></div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {mode==="dashboard"&&<><button onClick={()=>setMode("input")} style={{background:C.accentDim,color:C.accent,border:`1px solid ${C.accent}55`,borderRadius:9,padding:isMobile?"6px 10px":"8px 16px",fontSize:isMobile?11:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✏️ Edit Data</button><ExportMenu months={months} channels={channels} campaigns={campaigns} funnel={funnel}/></>}
          {mode==="input"&&<button onClick={()=>{setMonths(defaultMonths());setChannels(defaultChannels());setCampaigns(defaultCampaigns());setFunnel(defaultFunnel());setGoals(defaultGoals());setCompetitors(defaultCompetitors());setDashNotes(defaultDashNotes());}} style={{background:C.card,color:C.muted,border:`1px solid ${C.border}`,borderRadius:9,padding:isMobile?"6px 10px":"8px 16px",fontSize:isMobile?11:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>↺ Reset</button>}
        </div></div>
      <div style={{padding:`24px ${isMobile?"16px":"36px"} 48px`}}>
        {mode==="input"?<DataInputMode months={months} setMonths={setMonths} channels={channels} setChannels={setChannels} campaigns={campaigns} setCampaigns={setCampaigns} funnel={funnel} setFunnel={setFunnel} goals={goals} setGoals={setGoals} competitors={competitors} setCompetitors={setCompetitors} onLaunch={()=>setMode("dashboard")}/>
        :<DashboardView months={months} channels={channels} campaigns={campaigns} funnel={funnel} goals={goals} competitors={competitors} dashNotes={dashNotes} setDashNotes={setDashNotes} onEdit={()=>setMode("input")}/>}
      </div>
    </div>
  );
}
