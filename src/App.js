import { useState, useEffect, useCallback } from "react";
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
};
const CH_COLORS = [C.accent, C.info, C.purple, C.warn, C.cyan, C.danger, "#F472B6", "#A78BFA"];

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

// ═══════════════════════════════════════════════════════════════════════════════
// DATA INPUT MODE
// ═══════════════════════════════════════════════════════════════════════════════

const inputLabel = { color:C.dim, fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:5, display:"block" };
const inputStyle = {
  width:"100%", padding:"9px 12px", fontSize:14, fontFamily:"'JetBrains Mono',monospace",
  background:C.cardAlt, color:C.text, border:`1px solid ${C.border}`, borderRadius:8, outline:"none",
  boxSizing:"border-box", transition:"border .2s",
};
const focusRing = (e) => e.target.style.borderColor = C.accent;
const blurRing  = (e) => e.target.style.borderColor = C.border;

function InputField({ label, value, onChange, type="text", placeholder="" }) {
  return (
    <div style={{ flex:1, minWidth:0 }}>
      <label style={inputLabel}>{label}</label>
      <input style={inputStyle} value={value} placeholder={placeholder}
        onChange={e => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
        type={type} onFocus={focusRing} onBlur={blurRing} />
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, marginBottom:20, overflow:"hidden" }}>
      <div style={{ padding:"20px 24px 16px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:C.text }}>{title}</h3>
          {subtitle && <p style={{ margin:"3px 0 0", fontSize:12, color:C.dim }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div style={{ padding:"0 24px 24px" }}>{children}</div>
    </div>
  );
}

function AddBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      background:C.accentDim, color:C.accent, border:`1px solid ${C.accent}33`, borderRadius:8,
      padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
    }}>{label}</button>
  );
}

function RemoveBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background:"rgba(239,71,111,.1)", color:C.danger, border:"none", borderRadius:6,
      width:28, height:28, cursor:"pointer", fontSize:16, lineHeight:1, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>×</button>
  );
}

function DataInputMode({ months, setMonths, channels, setChannels, campaigns, setCampaigns, funnel, setFunnel, onLaunch }) {
  const updateRow = (arr, setArr, idx, key, val) => { const n=[...arr]; n[idx]={...n[idx],[key]:val}; setArr(n); };
  const addRow = (arr, setArr, template) => setArr([...arr, template]);
  const removeRow = (arr, setArr, idx) => { if(arr.length>1){ const n=[...arr]; n.splice(idx,1); setArr(n); }};

  const tabs = [
    { id:"monthly", label:"Monthly Data", icon:"📅" },
    { id:"channels", label:"Channels", icon:"📡" },
    { id:"campaigns", label:"Campaigns", icon:"🚀" },
    { id:"funnel", label:"Funnel", icon:"🔽" },
  ];
  const [tab, setTab] = useState("monthly");

  return (
    <div>
      {/* Helpful intro banner */}
      <div style={{ background:`linear-gradient(135deg, ${C.accent}10, ${C.info}08)`, border:`1px solid ${C.accent}20`,
        borderRadius:14, padding:"18px 24px", marginBottom:24, display:"flex", gap:14, alignItems:"flex-start" }}>
        <span style={{ fontSize:22, flexShrink:0, marginTop:1 }}>💡</span>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:4 }}>Enter your marketing data to generate your dashboard</div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
            Fill in each section using the tabs below. Sample data is pre-loaded — replace it with your real numbers. 
            You can add or remove rows as needed, then click <strong style={{ color:C.accent }}>Generate Dashboard</strong> when ready.
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:6, marginBottom:24, flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"10px 20px", fontSize:13, fontWeight:600, cursor:"pointer",
            background: tab===t.id ? C.accent : C.card, color: tab===t.id ? C.bg : C.muted,
            border:`1px solid ${tab===t.id ? C.accent : C.border}`, borderRadius:10,
            fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", gap:6,
          }}><span>{t.icon}</span>{t.label}</button>
        ))}
      </div>

      {/* Monthly */}
      {tab === "monthly" && (
        <SectionCard title="Monthly Performance Data" subtitle="Enter spend, revenue, and leads for each reporting month"
          action={<AddBtn onClick={() => addRow(months, setMonths, { month:"", spend:0, revenue:0, leads:0 })} label="+ Add Month" />}>
          {/* Column headers */}
          <div style={{ display:"flex", gap:10, marginBottom:8, paddingRight:38 }}>
            {["Month","Spend ($)","Revenue ($)","Leads"].map((h,i) => (
              <div key={i} style={{ flex:1, fontSize:10, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".06em" }}>{h}</div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {months.map((m, i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ flex:1 }}><input style={inputStyle} value={m.month} placeholder="e.g. Jan" onChange={e => updateRow(months, setMonths, i, "month", e.target.value)} onFocus={focusRing} onBlur={blurRing} /></div>
                <div style={{ flex:1 }}><input style={inputStyle} value={m.spend} type="number" placeholder="50000" onChange={e => updateRow(months, setMonths, i, "spend", e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing} /></div>
                <div style={{ flex:1 }}><input style={inputStyle} value={m.revenue} type="number" placeholder="200000" onChange={e => updateRow(months, setMonths, i, "revenue", e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing} /></div>
                <div style={{ flex:1 }}><input style={inputStyle} value={m.leads} type="number" placeholder="1500" onChange={e => updateRow(months, setMonths, i, "leads", e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing} /></div>
                <RemoveBtn onClick={() => removeRow(months, setMonths, i)} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Channels */}
      {tab === "channels" && (
        <SectionCard title="Channel Performance" subtitle="Enter total spend and revenue per marketing channel"
          action={<AddBtn onClick={() => addRow(channels, setChannels, { name:"", spend:0, revenue:0 })} label="+ Add Channel" />}>
          <div style={{ display:"flex", gap:10, marginBottom:8, paddingRight:38 }}>
            {["Channel Name","Spend ($)","Revenue ($)"].map((h,i) => (
              <div key={i} style={{ flex:1, fontSize:10, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".06em" }}>{h}</div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {channels.map((ch, i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ flex:1 }}><input style={inputStyle} value={ch.name} placeholder="e.g. Paid Search" onChange={e => updateRow(channels, setChannels, i, "name", e.target.value)} onFocus={focusRing} onBlur={blurRing} /></div>
                <div style={{ flex:1 }}><input style={inputStyle} value={ch.spend} type="number" onChange={e => updateRow(channels, setChannels, i, "spend", e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing} /></div>
                <div style={{ flex:1 }}><input style={inputStyle} value={ch.revenue} type="number" onChange={e => updateRow(channels, setChannels, i, "revenue", e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing} /></div>
                <RemoveBtn onClick={() => removeRow(channels, setChannels, i)} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Campaigns */}
      {tab === "campaigns" && (
        <SectionCard title="Campaign Details" subtitle="Add individual campaigns with their performance data"
          action={<AddBtn onClick={() => addRow(campaigns, setCampaigns, { name:"", channel:"", spend:0, revenue:0, status:"active" })} label="+ Add Campaign" />}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {campaigns.map((cp, i) => (
              <div key={i} style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", background:C.cardAlt, borderRadius:10, padding:"12px 14px", border:`1px solid ${C.border}` }}>
                <div style={{ flex:"2 1 150px", minWidth:0 }}><InputField label="Campaign Name" value={cp.name} onChange={v => updateRow(campaigns, setCampaigns, i, "name", v)} placeholder="e.g. Q4 Launch" /></div>
                <div style={{ flex:"1 1 110px", minWidth:0 }}><InputField label="Channel" value={cp.channel} onChange={v => updateRow(campaigns, setCampaigns, i, "channel", v)} placeholder="e.g. Email" /></div>
                <div style={{ flex:"1 1 90px", minWidth:0 }}><InputField label="Spend ($)" value={cp.spend} onChange={v => updateRow(campaigns, setCampaigns, i, "spend", v)} type="number" /></div>
                <div style={{ flex:"1 1 90px", minWidth:0 }}><InputField label="Revenue ($)" value={cp.revenue} onChange={v => updateRow(campaigns, setCampaigns, i, "revenue", v)} type="number" /></div>
                <div style={{ flex:"1 1 90px", minWidth:0 }}>
                  <label style={inputLabel}>Status</label>
                  <select value={cp.status} onChange={e => updateRow(campaigns, setCampaigns, i, "status", e.target.value)}
                    style={{ ...inputStyle, cursor:"pointer", appearance:"auto" }} onFocus={focusRing} onBlur={blurRing}>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div style={{ alignSelf:"flex-end", paddingBottom:1 }}><RemoveBtn onClick={() => removeRow(campaigns, setCampaigns, i)} /></div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Funnel */}
      {tab === "funnel" && (
        <SectionCard title="Marketing Funnel Stages" subtitle="Enter the volume at each funnel stage from top (widest) to bottom (narrowest)"
          action={<AddBtn onClick={() => addRow(funnel, setFunnel, { stage:"", value:0 })} label="+ Add Stage" />}>
          <div style={{ display:"flex", gap:10, marginBottom:8, paddingRight:38 }}>
            {["Stage Name","Volume"].map((h,i) => (
              <div key={i} style={{ flex:1, fontSize:10, fontWeight:700, color:C.faint, textTransform:"uppercase", letterSpacing:".06em" }}>{h}</div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {funnel.map((f, i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ flex:1 }}><input style={inputStyle} value={f.stage} placeholder="e.g. Impressions" onChange={e => updateRow(funnel, setFunnel, i, "stage", e.target.value)} onFocus={focusRing} onBlur={blurRing} /></div>
                <div style={{ flex:1 }}><input style={inputStyle} value={f.value} type="number" placeholder="100000" onChange={e => updateRow(funnel, setFunnel, i, "value", e.target.value===""?"":Number(e.target.value))} onFocus={focusRing} onBlur={blurRing} /></div>
                <RemoveBtn onClick={() => removeRow(funnel, setFunnel, i)} />
              </div>
            ))}
          </div>
          <div style={{ marginTop:14, padding:"10px 14px", borderRadius:8, background:"rgba(255,209,102,.06)", border:`1px solid rgba(255,209,102,.12)`, fontSize:12, color:C.muted }}>
            💡 <strong style={{ color:C.warn }}>Tip:</strong> Order stages from top of funnel (e.g. Impressions) to bottom (e.g. Closed Won). Each stage volume should generally be smaller than the one above it.
          </div>
        </SectionCard>
      )}

      {/* Launch button */}
      <div style={{ display:"flex", justifyContent:"center", marginTop:16 }}>
        <button onClick={onLaunch} style={{
          background:`linear-gradient(135deg, ${C.accent}, #04B890)`, color:C.bg, border:"none",
          borderRadius:12, padding:"15px 52px", fontSize:16, fontWeight:700, cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif", boxShadow:`0 4px 24px ${C.accent}33`, transition:"transform .15s",
        }}
        onMouseDown={e => e.currentTarget.style.transform="scale(.97)"}
        onMouseUp={e => e.currentTarget.style.transform="scale(1)"}>
          Generate Dashboard →
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW MODE
// ═══════════════════════════════════════════════════════════════════════════════

function KPI({ title, value, change, icon, color=C.accent }) {
  const pos = change === null || parseFloat(change) >= 0;
  return (
    <div style={{ background:C.card, borderRadius:14, padding:"22px 24px", border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, right:0, width:70, height:70, background:`radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase" }}>{title}</span>
        <span style={{ fontSize:18 }}>{icon}</span>
      </div>
      <div style={{ fontSize:28, fontWeight:700, color:C.text, letterSpacing:"-.02em" }}>{value}</div>
      {change !== null && (
        <div style={{ marginTop:6, display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ background: pos?"rgba(6,214,160,.14)":"rgba(239,71,111,.14)", color: pos?C.accent:C.danger, fontSize:11, fontWeight:600, padding:"2px 7px", borderRadius:5 }}>
            {pos?"▲":"▼"} {Math.abs(parseFloat(change))}%
          </span>
          <span style={{ color:C.dim, fontSize:11 }}>vs prior period</span>
        </div>
      )}
    </div>
  );
}

function DashboardView({ months, channels, campaigns, funnel, onBack }) {
  const [tab, setTab] = useState("overview");

  // ── derived metrics ────────────────────────────────────────────────────────
  const enrichedMonths = months.map(m => ({
    ...m,
    roas: m.spend ? +(m.revenue / m.spend).toFixed(2) : 0,
    cpl: m.leads ? +(m.spend / m.leads).toFixed(2) : 0,
  }));

  const totalSpend = sum(months, "spend");
  const totalRev   = sum(months, "revenue");
  const totalLeads = sum(months, "leads");
  const blendedROAS = totalSpend ? (totalRev / totalSpend).toFixed(2) : 0;
  const avgCPL = totalLeads ? (totalSpend / totalLeads).toFixed(2) : 0;

  const half = Math.floor(months.length / 2) || 1;
  const firstHalf  = months.slice(0, half);
  const secondHalf = months.slice(half);
  const chg = (k) => { const a = sum(firstHalf,k), b = sum(secondHalf,k); return a ? (((b-a)/a)*100).toFixed(1) : null; };
  const revChange = chg("revenue");
  const spendChange = chg("spend");
  const leadChange = chg("leads");
  const firstROAS = sum(firstHalf,"spend") ? sum(firstHalf,"revenue")/sum(firstHalf,"spend") : 0;
  const secondROAS = sum(secondHalf,"spend") ? sum(secondHalf,"revenue")/sum(secondHalf,"spend") : 0;
  const roasChange = firstROAS ? (((secondROAS - firstROAS)/firstROAS)*100).toFixed(1) : null;
  const firstCPL = sum(firstHalf,"leads") ? sum(firstHalf,"spend")/sum(firstHalf,"leads") : 0;
  const secondCPL = sum(secondHalf,"leads") ? sum(secondHalf,"spend")/sum(secondHalf,"leads") : 0;
  const cplChange = firstCPL ? (((secondCPL - firstCPL)/firstCPL)*100).toFixed(1) : null;

  const enrichedChannels = channels.map((ch,i) => ({
    ...ch,
    roi: ch.spend ? Math.round(((ch.revenue - ch.spend)/ch.spend)*100) : 0,
    color: CH_COLORS[i % CH_COLORS.length],
  }));
  const totalChSpend = sum(channels,"spend");
  const pieData = enrichedChannels.map(ch => ({ name:ch.name, value: totalChSpend ? Math.round((ch.spend/totalChSpend)*100) : 0, color:ch.color }));

  const enrichedCampaigns = campaigns.map(cp => ({
    ...cp,
    roi: cp.spend ? Math.round(((cp.revenue - cp.spend)/cp.spend)*100) : 0,
  }));

  const bestCampaign = enrichedCampaigns.length ? enrichedCampaigns.reduce((a,b) => a.roi > b.roi ? a : b) : null;
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  const tabs = [
    { id:"overview", label:"Overview" },
    { id:"channels", label:"Channel Performance" },
    { id:"campaigns", label:"Campaigns" },
    { id:"funnel", label:"Funnel Analysis" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:28, flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer",
            background: tab===t.id ? C.card : "transparent", color: tab===t.id ? C.accent : C.dim,
            border: tab===t.id ? `1px solid ${C.border}` : "1px solid transparent",
            borderRadius:9, fontFamily:"'DM Sans',sans-serif", transition:"all .2s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Overview ───────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:28 }}>
            <KPI title="Total Revenue" value={fmt$(totalRev)} change={revChange} icon="💰" color={C.accent} />
            <KPI title="Total Spend" value={fmt$(totalSpend)} change={spendChange} icon="📊" color={C.info} />
            <KPI title="Blended ROAS" value={`${blendedROAS}x`} change={roasChange} icon="🎯" color={C.purple} />
            <KPI title="Total Leads" value={totalLeads.toLocaleString()} change={leadChange} icon="👥" color={C.warn} />
            <KPI title="Avg CPL" value={`$${avgCPL}`} change={cplChange} icon="⬇️" color={C.cyan} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:18, marginBottom:18 }}>
            <div style={{ background:C.card, borderRadius:16, padding:26, border:`1px solid ${C.border}` }}>
              <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:700, color:C.text }}>Revenue vs. Marketing Spend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={enrichedMonths} margin={{ top:5, right:20, left:10, bottom:5 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity={.3}/><stop offset="100%" stopColor={C.accent} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gSpd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.info} stopOpacity={.2}/><stop offset="100%" stopColor={C.info} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fill:C.dim, fontSize:11 }} axisLine={{ stroke:C.border }} />
                  <YAxis tick={{ fill:C.dim, fontSize:11 }} axisLine={{ stroke:C.border }} tickFormatter={fmt$} />
                  <Tooltip content={<Tip fmt={fmt$} />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.accent} fill="url(#gRev)" strokeWidth={2.5} dot={{ fill:C.accent, r:3.5 }} />
                  <Area type="monotone" dataKey="spend" name="Spend" stroke={C.info} fill="url(#gSpd)" strokeWidth={2} dot={{ fill:C.info, r:2.5 }} />
                  <Legend wrapperStyle={{ color:C.muted, fontSize:11, paddingTop:10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:C.card, borderRadius:16, padding:26, border:`1px solid ${C.border}` }}>
              <h3 style={{ margin:"0 0 14px", fontSize:15, fontWeight:700, color:C.text }}>Budget Allocation</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                  {pieData.map((e,i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie><Tooltip content={({active,payload}) => active && payload?.length ? <div style={{background:"#1A2235",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px"}}><span style={{color:C.text,fontSize:11,fontWeight:600}}>{payload[0].name}: {payload[0].value}%</span></div> : null} /></PieChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
                {pieData.map((d,i) => <div key={i} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:C.muted }}><span style={{ width:7, height:7, borderRadius:"50%", background:d.color }} />{d.name}</div>)}
              </div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
            <div style={{ background:C.card, borderRadius:16, padding:26, border:`1px solid ${C.border}` }}>
              <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:700, color:C.text }}>ROAS Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={enrichedMonths} margin={{ top:5, right:20, left:10, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fill:C.dim, fontSize:11 }} axisLine={{ stroke:C.border }} />
                  <YAxis tick={{ fill:C.dim, fontSize:11 }} axisLine={{ stroke:C.border }} tickFormatter={v=>`${v}x`} />
                  <Tooltip content={<Tip fmt={v=>`${v}x`} />} />
                  <Line type="monotone" dataKey="roas" name="ROAS" stroke={C.purple} strokeWidth={3} dot={{ fill:C.purple, r:4.5, strokeWidth:2, stroke:C.card }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background:C.card, borderRadius:16, padding:26, border:`1px solid ${C.border}` }}>
              <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:700, color:C.text }}>Lead Generation & CPL</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={enrichedMonths} margin={{ top:5, right:20, left:10, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="month" tick={{ fill:C.dim, fontSize:11 }} axisLine={{ stroke:C.border }} />
                  <YAxis yAxisId="l" tick={{ fill:C.dim, fontSize:11 }} axisLine={{ stroke:C.border }} />
                  <YAxis yAxisId="r" orientation="right" tick={{ fill:C.dim, fontSize:11 }} axisLine={{ stroke:C.border }} tickFormatter={v=>`$${v}`} />
                  <Tooltip content={<Tip fmt={(v,n) => n==="CPL" ? `$${v}` : fmtN(v)} />} />
                  <Bar yAxisId="l" dataKey="leads" name="Leads" fill={C.info} radius={[4,4,0,0]} barSize={24} />
                  <Line yAxisId="r" type="monotone" dataKey="cpl" name="CPL" stroke={C.warn} strokeWidth={2.5} dot={{ fill:C.warn, r:3.5 }} />
                  <Legend wrapperStyle={{ color:C.muted, fontSize:11, paddingTop:8 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ── Channels ───────────────────────────────────────────────────────── */}
      {tab === "channels" && (
        <>
          <div style={{ background:C.card, borderRadius:16, padding:26, border:`1px solid ${C.border}`, marginBottom:20 }}>
            <h3 style={{ margin:"0 0 18px", fontSize:15, fontWeight:700, color:C.text }}>Channel ROI Comparison</h3>
            <ResponsiveContainer width="100%" height={Math.max(200, enrichedChannels.length * 52)}>
              <BarChart data={enrichedChannels} layout="vertical" margin={{ top:5, right:30, left:90, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                <XAxis type="number" tick={{ fill:C.dim, fontSize:11 }} axisLine={{ stroke:C.border }} tickFormatter={v=>`${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill:C.muted, fontSize:12, fontWeight:500 }} axisLine={{ stroke:C.border }} width={85} />
                <Tooltip content={<Tip fmt={v=>`${v}%`} />} />
                <Bar dataKey="roi" name="ROI %" radius={[0,6,6,0]} barSize={22}>
                  {enrichedChannels.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {enrichedChannels.map((ch,i) => (
              <div key={i} style={{ background:C.card, borderRadius:14, padding:22, border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, width:"100%", height:3, background:`linear-gradient(90deg,${ch.color},transparent)` }} />
                <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:14 }}>{ch.name}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div><div style={{ color:C.dim, fontSize:10, textTransform:"uppercase", letterSpacing:".05em", marginBottom:3 }}>Spend</div><div style={{ color:C.text, fontSize:17, fontWeight:600 }}>{fmt$(ch.spend)}</div></div>
                  <div><div style={{ color:C.dim, fontSize:10, textTransform:"uppercase", letterSpacing:".05em", marginBottom:3 }}>Revenue</div><div style={{ color:C.accent, fontSize:17, fontWeight:600 }}>{fmt$(ch.revenue)}</div></div>
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ color:C.dim, fontSize:10, textTransform:"uppercase", letterSpacing:".05em", marginBottom:5 }}>ROI</div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ flex:1, height:5, background:C.border, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ width:`${Math.min(ch.roi/7,100)}%`, height:"100%", background:ch.color, borderRadius:3 }} />
                      </div>
                      <span style={{ color:ch.color, fontSize:15, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" }}>{ch.roi}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Campaigns ──────────────────────────────────────────────────────── */}
      {tab === "campaigns" && (
        <>
          <div style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`, overflow:"hidden", marginBottom:20 }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                  {["Campaign","Channel","Spend","Revenue","ROI","Status"].map((h,i) => (
                    <th key={i} style={{ padding:"13px 18px", textAlign:"left", fontSize:10, fontWeight:600, color:C.dim, textTransform:"uppercase", letterSpacing:".06em", background:"rgba(0,0,0,.2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrichedCampaigns.map((c,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, cursor:"default" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.cardHover}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"13px 18px", fontSize:13, fontWeight:600, color:C.text }}>{c.name}</td>
                    <td style={{ padding:"13px 18px", fontSize:12, color:C.muted }}>{c.channel}</td>
                    <td style={{ padding:"13px 18px", fontSize:13, color:C.text, fontFamily:"'JetBrains Mono',monospace" }}>{fmt$(c.spend)}</td>
                    <td style={{ padding:"13px 18px", fontSize:13, color:C.accent, fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{fmt$(c.revenue)}</td>
                    <td style={{ padding:"13px 18px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:55, height:4, background:C.border, borderRadius:3, overflow:"hidden" }}>
                          <div style={{ width:`${Math.min(c.roi/7,100)}%`, height:"100%", borderRadius:3, background: c.roi>=400?C.accent:c.roi>=200?C.info:C.warn }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:600, fontFamily:"'JetBrains Mono',monospace", color:c.roi>=400?C.accent:c.roi>=200?C.info:C.warn }}>{c.roi}%</span>
                      </div>
                    </td>
                    <td style={{ padding:"13px 18px" }}>
                      <span style={{ fontSize:10, fontWeight:600, textTransform:"uppercase", padding:"3px 9px", borderRadius:5,
                        background: c.status==="active"?"rgba(6,214,160,.1)":c.status==="completed"?"rgba(131,56,236,.1)":"rgba(255,209,102,.1)",
                        color: c.status==="active"?C.accent:c.status==="completed"?C.purple:C.warn }}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            <div style={{ background:C.card, borderRadius:14, padding:22, border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ color:C.dim, fontSize:11, marginBottom:6, textTransform:"uppercase" }}>Active Campaigns</div>
              <div style={{ color:C.accent, fontSize:32, fontWeight:800 }}>{activeCampaigns}</div>
            </div>
            <div style={{ background:C.card, borderRadius:14, padding:22, border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ color:C.dim, fontSize:11, marginBottom:6, textTransform:"uppercase" }}>Avg Campaign ROI</div>
              <div style={{ color:C.info, fontSize:32, fontWeight:800 }}>{enrichedCampaigns.length ? Math.round(enrichedCampaigns.reduce((s,c)=>s+c.roi,0)/enrichedCampaigns.length) : 0}%</div>
            </div>
            <div style={{ background:C.card, borderRadius:14, padding:22, border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ color:C.dim, fontSize:11, marginBottom:6, textTransform:"uppercase" }}>Best Performer</div>
              <div style={{ color:C.purple, fontSize:16, fontWeight:700 }}>{bestCampaign?.name || "—"}</div>
              <div style={{ color:C.dim, fontSize:12, marginTop:2 }}>{bestCampaign ? `${bestCampaign.roi}% ROI` : ""}</div>
            </div>
            <div style={{ background:C.card, borderRadius:14, padding:22, border:`1px solid ${C.border}`, textAlign:"center" }}>
              <div style={{ color:C.dim, fontSize:11, marginBottom:6, textTransform:"uppercase" }}>Total Pipeline</div>
              <div style={{ color:C.warn, fontSize:32, fontWeight:800 }}>{fmt$(sum(campaigns,"revenue"))}</div>
            </div>
          </div>
        </>
      )}

      {/* ── Funnel ─────────────────────────────────────────────────────────── */}
      {tab === "funnel" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
            <div style={{ background:C.card, borderRadius:16, padding:28, border:`1px solid ${C.border}` }}>
              <h3 style={{ margin:"0 0 24px", fontSize:15, fontWeight:700, color:C.text }}>Conversion Funnel</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:5, alignItems:"center" }}>
                {funnel.map((f,i) => {
                  const w = 30 + 70 * (1 - i/(funnel.length-1||1));
                  const op = .4 + .6 * (1 - i/(funnel.length-1||1));
                  return (
                    <div key={i} style={{ width:`${w}%`, padding:"12px 18px", borderRadius:9,
                      background:`linear-gradient(135deg,rgba(6,214,160,${op*.3}),rgba(17,138,178,${op*.2}))`,
                      border:`1px solid rgba(6,214,160,${op*.3})`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{f.stage}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:C.accent, fontFamily:"'JetBrains Mono',monospace" }}>{fmtN(f.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background:C.card, borderRadius:16, padding:28, border:`1px solid ${C.border}` }}>
              <h3 style={{ margin:"0 0 24px", fontSize:15, fontWeight:700, color:C.text }}>Stage Conversion Rates</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {funnel.slice(1).map((f,i) => {
                  const prev = funnel[i].value;
                  const rate = pct(f.value, prev);
                  return (
                    <div key={i}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                        <span style={{ fontSize:12, color:C.muted }}>{funnel[i].stage} → {f.stage}</span>
                        <span style={{ fontSize:13, fontWeight:700, color:C.accent, fontFamily:"'JetBrains Mono',monospace" }}>{rate}%</span>
                      </div>
                      <div style={{ height:7, background:C.border, borderRadius:4, overflow:"hidden" }}>
                        <div style={{ width:`${Math.min(parseFloat(rate)*2.5,100)}%`, height:"100%", borderRadius:4, background:`linear-gradient(90deg,${C.accent},${C.info})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {funnel.length >= 2 && (
                <div style={{ marginTop:24, padding:18, borderRadius:11, background:"rgba(6,214,160,.05)", border:`1px solid rgba(6,214,160,.12)` }}>
                  <div style={{ color:C.dim, fontSize:10, textTransform:"uppercase", letterSpacing:".05em", marginBottom:6 }}>Overall Funnel Conversion</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                    <span style={{ fontSize:28, fontWeight:800, color:C.accent, fontFamily:"'JetBrains Mono',monospace" }}>
                      {pct(funnel[funnel.length-1].value, funnel[0].value)}%
                    </span>
                    <span style={{ fontSize:12, color:C.muted }}>{funnel[0].stage} → {funnel[funnel.length-1].stage}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [mode, setMode] = useState("input");
  const [months, setMonths]       = useState(defaultMonths);
  const [channels, setChannels]   = useState(defaultChannels);
  const [campaigns, setCampaigns] = useState(defaultCampaigns);
  const [funnel, setFunnel]       = useState(defaultFunnel);
  const [ready, setReady]         = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setTimeout(() => setReady(true), 80);
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans',sans-serif", color:C.text, opacity:ready?1:0, transition:"opacity .5s" }}>
      {/* Header */}
      <div style={{ padding:"24px 36px", borderBottom:`1px solid ${C.border}`,
        background:"linear-gradient(180deg,rgba(6,214,160,.03) 0%,transparent 100%)",
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:`linear-gradient(135deg,${C.accent},${C.info})`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:800, color:C.bg }}>M</div>
          <div>
            <h1 style={{ margin:0, fontSize:21, fontWeight:800, letterSpacing:"-.02em" }}>Marketing ROI Dashboard</h1>
            <p style={{ margin:"2px 0 0", color:C.dim, fontSize:12 }}>
              {mode === "input" ? "Enter your marketing data below" : "Executive Performance Report"}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {mode === "dashboard" && (
            <button onClick={() => setMode("input")} style={{
              background:C.card, color:C.muted, border:`1px solid ${C.border}`, borderRadius:9,
              padding:"8px 16px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
            }}>✏️ Edit Data</button>
          )}
          {mode === "input" && (
            <button onClick={() => { setMonths(defaultMonths()); setChannels(defaultChannels()); setCampaigns(defaultCampaigns()); setFunnel(defaultFunnel()); }} style={{
              background:C.card, color:C.muted, border:`1px solid ${C.border}`, borderRadius:9,
              padding:"8px 16px", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
            }}>↺ Reset to Sample</button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"28px 36px 48px" }}>
        {mode === "input" ? (
          <DataInputMode
            months={months} setMonths={setMonths}
            channels={channels} setChannels={setChannels}
            campaigns={campaigns} setCampaigns={setCampaigns}
            funnel={funnel} setFunnel={setFunnel}
            onLaunch={() => setMode("dashboard")}
          />
        ) : (
          <DashboardView
            months={months} channels={channels}
            campaigns={campaigns} funnel={funnel}
            onBack={() => setMode("input")}
          />
        )}
      </div>
    </div>
  );
}
