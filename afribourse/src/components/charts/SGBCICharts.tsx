import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  LineChart,
  PieChart,
  Pie,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';

// ── Palette fidèle à l'article HTML ──────────────────────────────────────────
const BLUE   = '#1a4e8a';
const RED    = '#A32D2D';
const GREEN  = '#1e6644';
const AMBER  = '#BA7517';
const GREY   = '#b4b2a9';
const GRID   = 'rgba(26,26,24,0.07)';

const tickStyle = { fill: '#a0a099', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" };

function mdFmt(v: number) { return `${v} Md`; }
function pctFmt(v: number) { return `${v}%`; }

// ── Tooltip partagé ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, suffix = ' Md' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs font-mono">
      <p className="text-slate-500 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>{p.name} : <strong>{p.value !== null ? `${p.value}${suffix}` : '—'}</strong></p>
      ))}
    </div>
  );
}

// ── Wrapper titre + légende ───────────────────────────────────────────────────
function ChartShell({ title, legend, children }: {
  title: string;
  legend: { color: string; label: string; dashed?: boolean }[];
  children: React.ReactNode;
}) {
  return (
    <div className="my-2 bg-[#faf9f6] rounded-xl p-4 border border-slate-200">
      <p className="text-[10px] tracking-widest uppercase text-[#a0a099] font-mono mb-3">{title}</p>
      {children}
      <div className="flex flex-wrap gap-4 mt-3">
        {legend.map((l, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs text-[#5a5a54]">
            {l.dashed
              ? <svg width={20} height={10}><line x1="0" y1="5" x2="20" y2="5" stroke={l.color} strokeWidth={2} strokeDasharray="4 3" /></svg>
              : <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: l.color }} />
            }
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Chart 1 : Résultat Net Annuel + PNB (cAnnuel) ────────────────────────────
export function ChartAnnuel() {
  const data = [
    { an: '2021', rn: 67.4, cout: null,  pnb: 189.1 },
    { an: '2022', rn: 74.6, cout: null,  pnb: 215.1 },
    { an: '2023', rn: 97.2, cout: 27.7,  pnb: 253.3 },
    { an: '2024', rn: 101.2, cout: 36.2, pnb: 263.2 },
    { an: '2025', rn: 101.4, cout: 46.8, pnb: 276.0 },
  ];
  return (
    <ChartShell
      title="Résultat Net Annuel et PNB (Md FCFA) · 2021–2025"
      legend={[
        { color: BLUE,              label: 'Résultat Net' },
        { color: 'rgba(163,45,45,0.6)', label: 'Coût net du risque' },
        { color: GREY, dashed: true, label: 'PNB (axe droit)' },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 48, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="an" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" domain={[0, 120]} tickFormatter={mdFmt} tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" domain={[180, 290]} tickFormatter={mdFmt} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" Md" />} />
          <Bar yAxisId="left" dataKey="rn"   name="Résultat Net"       fill={BLUE}                    radius={[3,3,0,0]} maxBarSize={40} />
          <Bar yAxisId="left" dataKey="cout" name="Coût net du risque" fill="rgba(163,45,45,0.6)"     radius={[3,3,0,0]} maxBarSize={40} />
          <Line yAxisId="right" type="monotone" dataKey="pnb" name="PNB" stroke={GREY} strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3, fill: GREY }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Chart 2 : Résultat Net T1 (cT1) ─────────────────────────────────────────
export function ChartRNT1() {
  const data = [
    { label: 'T1 2023', rn: 22.5, fill: BLUE },
    { label: 'T1 2024', rn: 26.5, fill: BLUE },
    { label: 'T1 2025', rn: 27.1, fill: BLUE },
    { label: 'T1 2026', rn: 24.0, fill: RED  },
  ];
  return (
    <ChartShell
      title="Résultat Net T1 · 2023–2026 (Md FCFA)"
      legend={[
        { color: BLUE, label: 'Progression 2023–2025' },
        { color: RED,  label: 'Rupture T1 2026' },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 32]} tickFormatter={mdFmt} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" Md" />} />
          <Bar dataKey="rn" name="Résultat Net T1" radius={[3,3,0,0]} maxBarSize={50}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Chart 3 : PNB vs Frais généraux T1 / effet ciseaux (cCiseaux) ────────────
export function ChartCiseaux() {
  const data = [
    { label: 'T1 2024', pnb: 65.4, frais: 26.8 },
    { label: 'T1 2025', pnb: 66.3, frais: 24.5 },
    { label: 'T1 2026', pnb: 65.6, frais: 26.6 },
  ];
  return (
    <ChartShell
      title="PNB vs Frais Généraux T1 (Md FCFA) · 2024–2026"
      legend={[
        { color: BLUE, label: 'PNB' },
        { color: RED,  label: 'Frais généraux' },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis domain={[20, 72]} tickFormatter={mdFmt} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" Md" />} />
          <Line type="monotone" dataKey="pnb"   name="PNB"            stroke={BLUE} strokeWidth={2.5} dot={{ r: 5, fill: BLUE }} />
          <Line type="monotone" dataKey="frais"  name="Frais généraux" stroke={RED}  strokeWidth={2.5} dot={{ r: 5, fill: RED }}  />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Chart 4 : Coefficient d'exploitation (cCoeff) ─────────────────────────────
const COEFF_COLORS = [BLUE, BLUE, '#888', '#888', BLUE, RED];

function CoeffDot(props: any) {
  const { cx, cy, index } = props;
  return <circle cx={cx} cy={cy} r={5} fill={COEFF_COLORS[index] ?? BLUE} stroke="none" />;
}

export function ChartCoeff() {
  const data = [
    { label: '2023\n(ann.)',  coeff: 41.7, seuil: 40 },
    { label: '2024\n(ann.)',  coeff: 37.9, seuil: 40 },
    { label: 'T1 2024',      coeff: 41.0, seuil: 40 },
    { label: 'T1 2025',      coeff: 37.0, seuil: 40 },
    { label: '2025\n(ann.)', coeff: 38.8, seuil: 40 },
    { label: 'T1 2026',      coeff: 40.6, seuil: 40 },
  ];
  return (
    <ChartShell
      title="Coefficient d'exploitation (%) · 2023–2026"
      legend={[
        { color: BLUE, label: 'Coefficient (annuel)' },
        { color: '#888', label: 'Trimestriel' },
        { color: RED,   label: 'T1 2026' },
        { color: 'rgba(163,45,45,0.4)', dashed: true, label: 'Seuil 40%' },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis domain={[34, 44]} tickFormatter={pctFmt} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix="%" />} />
          <ReferenceLine y={40} stroke="rgba(163,45,45,0.4)" strokeDasharray="5 4" strokeWidth={1.5} />
          <Line type="monotone" dataKey="coeff" name="Coefficient" stroke={BLUE} strokeWidth={2} dot={<CoeffDot />} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Chart 5 : Sensibilité BPA (cSensib) horizontal bars ───────────────────────
export function ChartSensib() {
  const data = [
    { label: '44%\n(dégradation)',     bpa: 2668, fill: RED },
    { label: '40,6%\n(T1 2026)',       bpa: 2828, fill: AMBER },
    { label: '38,8%\n(niveau 2025)',   bpa: 3022, fill: BLUE },
    { label: '37,9%\n(niveau 2024)',   bpa: 3150, fill: GREEN },
  ];
  return (
    <ChartShell
      title="Sensibilité du BPA au coefficient d'exploitation (PNB fixe 276 Md)"
      legend={[
        { color: GREEN, label: 'BPA estimé (FCFA)' },
        { color: 'rgba(163,45,45,0.4)', dashed: true, label: 'BPA 2025 audité : 3 258 FCFA' },
      ]}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 60, left: 90, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} horizontal={false} />
          <XAxis type="number" domain={[2400, 3400]} tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={v => v.toLocaleString('fr-FR')} />
          <YAxis type="category" dataKey="label" tick={{ ...tickStyle, fontSize: 10 }} axisLine={false} tickLine={false} width={85} />
          <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString('fr-FR')} FCFA`, 'BPA']} />
          <ReferenceLine x={3258} stroke="rgba(163,45,45,0.5)" strokeDasharray="4 3" strokeWidth={1.5} />
          <Bar dataKey="bpa" name="BPA estimé" radius={[0,3,3,0]} maxBarSize={30}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Chart 6 : Dividende (cDiv) ────────────────────────────────────────────────
export function ChartDiv() {
  const data = [
    { an: '2023', div: 1719, taux: 55 },
    { an: '2024', div: 1863, taux: 57.25 },
    { an: '2025', div: 2606, taux: 80 },
  ];
  return (
    <ChartShell
      title="Dividende brut par action (FCFA) · 2023–2025"
      legend={[
        { color: GREEN, label: 'Dividende versé' },
        { color: GREY, dashed: true, label: 'Taux de distribution %' },
      ]}
    >
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 48, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="an" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" domain={[0, 3200]} tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={v => v.toLocaleString('fr-FR')} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={tickStyle} axisLine={false} tickLine={false} tickFormatter={pctFmt} />
          <Tooltip
            formatter={(v: any, name: string | undefined) =>
              name === 'Dividende' ? [`${Number(v).toLocaleString('fr-FR')} FCFA`, name] : [`${v}%`, name ?? '']
            }
          />
          <Bar yAxisId="left" dataKey="div" name="Dividende" fill={GREEN} radius={[3,3,0,0]} maxBarSize={50} />
          <Line yAxisId="right" type="monotone" dataKey="taux" name="Taux distribution" stroke={GREY} strokeWidth={2} strokeDasharray="4 3" dot={{ r: 4, fill: GREY }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Palette CFAC (thème clair) ────────────────────────────────────────────────
const CFAC_BLUE   = '#3b82f6';
const CFAC_GREEN  = '#16a34a';
const CFAC_RED    = '#ef4444';
const CFAC_AMBER  = '#f59e0b';
const CFAC_PURPLE = '#8b5cf6';
const CFAC_NAVY   = '#1e40af';

// ── Chart CFAC 1 : PNB & Résultat Net ────────────────────────────────────────
export function ChartCFACPnbRn() {
  const data = [
    { label: 'T1 2025', pnb: 1080, rn: 13 },
    { label: 'T1 2026', pnb: 1395, rn: 151 },
  ];
  return (
    <ChartShell
      title="PNB & Résultat Net (M FCFA)"
      legend={[
        { color: CFAC_BLUE,  label: 'PNB' },
        { color: CFAC_GREEN, label: 'Résultat Net' },
      ]}
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => v + ' M'} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" M" />} />
          <Bar dataKey="pnb" name="PNB"          fill={CFAC_BLUE}  radius={[3,3,0,0]} maxBarSize={40} />
          <Bar dataKey="rn"  name="Résultat Net" fill={CFAC_GREEN} radius={[3,3,0,0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Chart CFAC 2 : Coût du risque ─────────────────────────────────────────────
export function ChartCFACCoutRisque() {
  const data = [
    { label: 'T1 2025', cout: 89 },
    { label: 'T1 2026', cout: 22 },
  ];
  return (
    <ChartShell
      title="Coût du risque — évolution (M FCFA)"
      legend={[{ color: CFAC_RED, label: 'Charge (M FCFA, valeur abs.)' }]}
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => v + ' M'} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" M" />} />
          <Bar dataKey="cout" name="Coût du risque" radius={[3,3,0,0]} maxBarSize={50}>
            <Cell fill="rgba(239,68,68,0.4)" />
            <Cell fill={CFAC_RED} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Chart CFAC 3 : Structure de l'actif ──────────────────────────────────────
export function ChartCFACActif() {
  const data = [
    { label: 'Trésorerie', t26: 7677,  t25: 6873 },
    { label: 'Clientèle',  t26: 64428, t25: 51337 },
    { label: 'Titres',     t26: 11271, t25: 10587 },
    { label: 'Immo.',      t26: 5043,  t25: 4399 },
  ];
  return (
    <ChartShell
      title="Structure de l'actif — comparaison (M FCFA)"
      legend={[
        { color: CFAC_BLUE, label: 'T1 2026' },
        { color: CFAC_NAVY, label: 'T1 2025' },
      ]}
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ ...tickStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => (v / 1000).toFixed(0) + 'k'} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" M" />} />
          <Bar dataKey="t26" name="T1 2026" fill={CFAC_BLUE} radius={[3,3,0,0]} maxBarSize={24} />
          <Bar dataKey="t25" name="T1 2025" fill={CFAC_NAVY} radius={[3,3,0,0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Chart CFAC 4 : Répartition du passif (donut) ─────────────────────────────
const PASSIF_DATA = [
  { name: 'Interbancaire',  value: 25696, fill: CFAC_BLUE },
  { name: 'Clientèle',      value: 11154, fill: CFAC_GREEN },
  { name: 'Titres & divers',value: 45502, fill: CFAC_AMBER },
  { name: 'Cap. propres',   value: 6067,  fill: CFAC_PURPLE },
];

export function ChartCFACPassif() {
  return (
    <ChartShell
      title="Répartition du passif T1 2026 (M FCFA)"
      legend={[
        { color: CFAC_BLUE,   label: 'Interbancaire' },
        { color: CFAC_GREEN,  label: 'Clientèle' },
        { color: CFAC_AMBER,  label: 'Titres & divers' },
        { color: CFAC_PURPLE, label: 'Cap. propres' },
      ]}
    >
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={PASSIF_DATA}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={78}
            paddingAngle={2}
            dataKey="value"
          >
            {PASSIF_DATA.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip formatter={(v: any, name: string | undefined) => [Number(v).toLocaleString('fr-FR') + ' M FCFA', name ?? '']} />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Dispatch par chartId ──────────────────────────────────────────────────────
// ── Palette NSIA Banque CI ────────────────────────────────────────────────────
const NSIA_NAVY_MID  = '#185FA5';
const NSIA_BLUE_LIGHT = '#B5D4F4';
const NSIA_GREEN     = '#1D9E75';
const NSIA_AMBER     = '#BA7517';
const NSIA_YEARS     = ['T1 20','T1 21','T1 22','T1 23','T1 24','T1 25','T1 26'];

function nsiaCellFill(i: number, total: number) {
  return i === total - 1 ? NSIA_NAVY_MID : NSIA_BLUE_LIGHT;
}

export function ChartNSBCPnb() {
  const data = NSIA_YEARS.map((yr, i) => ({ yr, v: [15.8, 17.0, 17.0, 21.4, 21.8, 22.4, 28.6][i] }));
  return (
    <ChartShell
      title="Produit Net Bancaire — T1 2020 à T1 2026 (Mds FCFA)"
      legend={[
        { color: NSIA_BLUE_LIGHT, label: 'T1 antérieurs' },
        { color: NSIA_NAVY_MID,  label: 'T1 2026 — record' },
      ]}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis domain={[12, 32]} tickFormatter={v => `${v}`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" Mds" />} />
          <Bar dataKey="v" name="PNB" radius={[3,3,0,0]} maxBarSize={44}>
            {data.map((_, i) => <Cell key={i} fill={nsiaCellFill(i, data.length)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCRn() {
  const data = NSIA_YEARS.map((yr, i) => ({ yr, v: [2.5, 3.3, 3.7, 6.6, 7.1, 7.1, 10.9][i] }));
  return (
    <ChartShell
      title="Résultat Net — T1 par année (Mds FCFA)"
      legend={[
        { color: NSIA_BLUE_LIGHT, label: 'T1 antérieurs' },
        { color: NSIA_NAVY_MID,  label: 'T1 2026 — record' },
      ]}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 12]} tickFormatter={v => `${v}`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" Mds" />} />
          <Bar dataKey="v" name="Résultat Net" radius={[3,3,0,0]} maxBarSize={44}>
            {data.map((_, i) => <Cell key={i} fill={nsiaCellFill(i, data.length)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCMarge() {
  const data = NSIA_YEARS.map((yr, i) => ({ yr, v: [15.9, 19.5, 21.6, 30.7, 32.5, 31.8, 38.1][i] }));
  return (
    <ChartShell
      title="Marge Nette — T1 par année · Résultat net / PNB (%)"
      legend={[{ color: NSIA_GREEN, label: 'Marge nette' }]}
    >
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis domain={[10, 42]} tickFormatter={v => `${v}%`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix="%" />} />
          <Line
            type="monotone" dataKey="v" name="Marge nette"
            stroke={NSIA_GREEN} strokeWidth={2.5}
            dot={(props: any) => {
              const isLast = props.index === data.length - 1;
              return <circle key={props.cx} cx={props.cx} cy={props.cy} r={isLast ? 6 : 3} fill={NSIA_GREEN} stroke="#fff" strokeWidth={2} />;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCBilan() {
  const data = NSIA_YEARS.map((yr, i) => ({
    yr,
    credits: [829, 880, 960, 1183, 1270, 1574, 1744][i],
    depots:  [813, 919, 1050, 1283, 1422, 1783, 2163][i],
  }));
  return (
    <ChartShell
      title="Crédits & Dépôts clientèle — T1 2020 à T1 2026 (Mds FCFA)"
      legend={[
        { color: NSIA_NAVY_MID, label: 'Crédits nets' },
        { color: NSIA_AMBER,   label: 'Dépôts clientèle', dashed: true },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis domain={[700, 2400]} tickFormatter={v => `${v}`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" Mds" />} />
          <Line type="monotone" dataKey="credits" name="Crédits nets"     stroke={NSIA_NAVY_MID} strokeWidth={2.5} dot={{ r: 4, fill: NSIA_NAVY_MID, stroke: '#fff', strokeWidth: 2 }} />
          <Line type="monotone" dataKey="depots"  name="Dépôts clientèle" stroke={NSIA_AMBER}    strokeWidth={2.5} strokeDasharray="5 3" dot={{ r: 4, fill: NSIA_AMBER, stroke: '#fff', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ── Palette NSIA Fondamentale 2020-2025 ───────────────────────────────────────
const NF_BLUE   = '#1564A0';
const NF_TEAL   = '#0A7E6A';
const NF_RED    = '#B52828';
const NF_AMBER  = '#C47D0A';
const NF_GOLD   = '#8A6A00';
const NF_PURPLE = '#5B3DA8';
const NF_YEARS  = ['2020','2021','2022','2023','2024','2025'];

export function ChartNSBCFondActes() {
  const data = NF_YEARS.map((yr, i) => ({
    yr,
    rn:   [7201, 23713, 32382, 34813, 38112, 40712][i],
    cout: [16058, 6048, 4152, 3376, -537, 8510][i],
  }));
  return (
    <ChartShell
      title="Résultat Net & Coût du risque — 2020 à 2025 (M FCFA)"
      legend={[{ color: NF_TEAL, label: 'Résultat net' }, { color: NF_RED, label: 'Coût du risque' }]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={tickStyle} axisLine={false} tickLine={false} />
          <ReferenceLine y={0} stroke="#aaa" strokeDasharray="2 2" />
          <Tooltip content={<ChartTooltip suffix=" M" />} />
          <Bar dataKey="rn"   name="Résultat net"   fill="rgba(10,126,106,.2)"  stroke={NF_TEAL} strokeWidth={1.5} radius={[3,3,0,0]} maxBarSize={36} />
          <Bar dataKey="cout" name="Coût du risque" fill="rgba(181,40,40,.2)"   stroke={NF_RED}  strokeWidth={1.5} radius={[3,3,0,0]} maxBarSize={36} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCFondPnbStack() {
  const data = NF_YEARS.map((yr, i) => ({
    yr,
    nim:    [45381, 54595, 54977, 59404, 53895, 81717][i],
    comm:   [11826, 15060, 17822, 21310, 24128, 19885][i],
    titres: [3551,  872,   713,   4738,  11997, 185  ][i],
    autres: [10606, 6095,  6593,  5550,  7799,  11141][i],
  }));
  return (
    <ChartShell
      title="Décomposition du PNB par source de revenus — 2020 à 2025 (M FCFA)"
      legend={[
        { color: NF_BLUE,   label: "Marge nette d'intérêt (NIM)" },
        { color: NF_TEAL,   label: 'Commissions nettes' },
        { color: NF_AMBER,  label: 'Revenus titres variables' },
        { color: NF_PURPLE, label: 'Autres' },
      ]}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" M" />} />
          <Bar dataKey="nim"    name="NIM"          stackId="s" fill={NF_BLUE}   />
          <Bar dataKey="comm"   name="Commissions"  stackId="s" fill={NF_TEAL}   />
          <Bar dataKey="titres" name="Titres var."  stackId="s" fill={NF_AMBER}  />
          <Bar dataKey="autres" name="Autres"       stackId="s" fill={NF_PURPLE} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCFondNpl() {
  const ptColors = ['#B52828','#C47D0A','#0A7E6A','#0A7E6A','#0A7E6A','#C47D0A'];
  const data = NF_YEARS.map((yr, i) => ({ yr, npl: [12.5, 7.6, 1.1, 0.69, 0.27, 0.36][i] }));
  return (
    <ChartShell
      title="Taux NPL net — nettoyage spectaculaire 2020 à 2025 (%)"
      legend={[{ color: NF_RED, label: 'Taux NPL net (créances non performantes)' }]}
    >
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `${v}%`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix="%" />} />
          <Line type="monotone" dataKey="npl" name="NPL %" stroke={NF_RED} strokeWidth={2.5}
            dot={(props: any) => <circle key={props.cx} cx={props.cx} cy={props.cy} r={5} fill={ptColors[props.index]} stroke="#fff" strokeWidth={2} />}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCFondCoutRisque() {
  const vals = [16058, 6048, 4152, 3376, -537, 8510];
  const data = NF_YEARS.map((yr, i) => ({ yr, cout: vals[i] }));
  return (
    <ChartShell
      title="Coût du risque annuel — impact direct sur le résultat (M FCFA)"
      legend={[
        { color: NF_RED,  label: 'Coût du risque (charge)' },
        { color: NF_TEAL, label: 'Reprises nettes 2024 (gain)' },
      ]}
    >
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={tickStyle} axisLine={false} tickLine={false} />
          <ReferenceLine y={0} stroke="#aaa" strokeDasharray="2 2" />
          <Tooltip content={<ChartTooltip suffix=" M" />} />
          <Bar dataKey="cout" name="Coût du risque" radius={[3,3,0,0]} maxBarSize={44}>
            {data.map((d, i) => <Cell key={i} fill={d.cout <= 0 ? 'rgba(10,126,106,.3)' : 'rgba(181,40,40,.25)'} stroke={d.cout <= 0 ? NF_TEAL : NF_RED} strokeWidth={1.5} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCFondLevier() {
  const data = NF_YEARS.map((yr, i) => ({
    yr,
    levier: [14.2, 12.4, 11.4, 10.7, 11.7, 13.2][i],
    ltd:    [101.8, 91.5, 93.5, 92.3, 90.3, 81.1][i],
  }));
  return (
    <ChartShell
      title="Levier financier & ratio LTD (Crédits/Dépôts) — 2020 à 2025"
      legend={[
        { color: NF_RED,  label: 'Levier financier (×, axe gauche)' },
        { color: NF_BLUE, label: 'LTD — Crédits/Dépôts (%, axe droit)', dashed: true },
      ]}
    >
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" domain={[9, 16]}  tickFormatter={v => `${v}×`}  tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" orientation="right" domain={[75, 110]} tickFormatter={v => `${v}%`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix="" />} />
          <Line yAxisId="l" type="monotone" dataKey="levier" name="Levier" stroke={NF_RED}  strokeWidth={2.5} dot={{ r: 4, fill: NF_RED,  stroke: '#fff', strokeWidth: 2 }} />
          <Line yAxisId="r" type="monotone" dataKey="ltd"    name="LTD"    stroke={NF_BLUE} strokeWidth={2}   strokeDasharray="5 3" dot={{ r: 4, fill: NF_BLUE, stroke: '#fff', strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCFondSpreads() {
  const data = NF_YEARS.map((yr, i) => ({
    yr,
    actif:  [8.33, 8.47, 7.95, 8.17, 7.24, 7.97][i],
    passif: [3.35, 2.88, 2.68, 3.09, 3.15, 2.64][i],
    spread: [4.98, 5.59, 5.27, 5.08, 4.09, 5.33][i],
  }));
  return (
    <ChartShell
      title="Taux actif (crédits) vs taux passif (dépôts) — spread NIM (%)"
      legend={[
        { color: NF_BLUE,  label: 'Taux actif (crédits)' },
        { color: NF_RED,   label: 'Taux passif (dépôts)', dashed: true },
        { color: NF_TEAL,  label: 'Spread NIM' },
      ]}
    >
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis domain={[2, 10]} tickFormatter={v => `${v}%`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix="%" />} />
          <Line type="monotone" dataKey="actif"  name="Taux actif"  stroke={NF_BLUE} strokeWidth={2}   dot={{ r: 3, fill: NF_BLUE, stroke: '#fff', strokeWidth: 2 }} />
          <Line type="monotone" dataKey="passif" name="Taux passif" stroke={NF_RED}  strokeWidth={2}   strokeDasharray="4 2" dot={{ r: 3, fill: NF_RED,  stroke: '#fff', strokeWidth: 2 }} />
          <Line type="monotone" dataKey="spread" name="Spread NIM"  stroke={NF_TEAL} strokeWidth={2.5} dot={{ r: 4, fill: NF_TEAL, stroke: '#fff', strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCFondTitres() {
  const data = NF_YEARS.map((yr, i) => ({
    yr,
    btp: [378462, 386873, 428941, 410251, 477358, 465392][i],
    vari: [11657,  9830,   18096,  23600,  23306,  60052 ][i],
  }));
  return (
    <ChartShell
      title="Portefeuille titres — réserve de liquidité et revenus (M FCFA)"
      legend={[
        { color: NF_BLUE,   label: 'Effets publics (BTP, obligations États UEMOA)' },
        { color: NF_PURPLE, label: 'Actions var. + Obligations privées' },
      ]}
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" M" />} />
          <Bar dataKey="btp"  name="Effets publics"     stackId="s" fill="rgba(21,100,160,.25)"  stroke={NF_BLUE}   strokeWidth={1} />
          <Bar dataKey="vari" name="Actions + Oblig."   stackId="s" fill="rgba(91,61,168,.2)"    stroke={NF_PURPLE} strokeWidth={1} radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCFondCapex() {
  const data = NF_YEARS.map((yr, i) => ({
    yr,
    capex: [12093, 25027, 14178, 12336, 35358, 33539][i],
    immo:  [49269, 68290, 75336, 80403, 107287, 132733][i],
  }));
  return (
    <ChartShell
      title="Immobilisations corporelles nettes & CAPEX estimé (M FCFA)"
      legend={[
        { color: NF_AMBER,  label: 'Immobilisations corp. nettes (ligne)' },
        { color: NF_PURPLE, label: 'CAPEX estimé (barres)' },
      ]}
    >
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix=" M" />} />
          <Bar  dataKey="capex" name="CAPEX estimé"          fill="rgba(91,61,168,.25)"  stroke={NF_PURPLE} strokeWidth={1.5} radius={[3,3,0,0]} maxBarSize={36} />
          <Line dataKey="immo"  name="Immo. corp. nettes"    stroke={NF_AMBER} strokeWidth={2.5} dot={{ r: 4, fill: NF_AMBER, stroke: '#fff', strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function ChartNSBCFondDiv() {
  const divColors = ['#D4DDE8','#D4DDE8','#8A6A00','#8A6A00','#8A6A00','rgba(138,106,0,0.5)'];
  const data = NF_YEARS.map((yr, i) => ({
    yr,
    div:    [0, 0, 404, 455, 759, 370][i],
    payout: [0, 0, 36.3, 38.0, 58.0, 26.4][i],
  }));
  return (
    <ChartShell
      title="Dividende par action & taux de distribution — 2020 à 2025"
      legend={[
        { color: NF_GOLD, label: 'Dividende net BRVM (FCFA/action, axe gauche)' },
        { color: NF_TEAL, label: 'Payout brut (%, axe droit)', dashed: true },
      ]}
    >
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 4, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 0" stroke={GRID} vertical={false} />
          <XAxis dataKey="yr" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="l" domain={[0, 850]} tickFormatter={v => `${v}F`}  tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" orientation="right" domain={[0, 70]} tickFormatter={v => `${v}%`} tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip suffix="" />} />
          <Bar yAxisId="l" dataKey="div" name="Dividende net" radius={[3,3,0,0]} maxBarSize={40}>
            {data.map((_, i) => <Cell key={i} fill={divColors[i]} stroke={i < 2 ? '#D4DDE8' : NF_GOLD} strokeWidth={1.5} />)}
          </Bar>
          <Line yAxisId="r" type="monotone" dataKey="payout" name="Payout %" stroke={NF_TEAL} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: NF_TEAL, stroke: '#fff', strokeWidth: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

const CHART_MAP: Record<string, React.ComponentType> = {
  'sgbci-annuel':      ChartAnnuel,
  'sgbci-rn-t1':       ChartRNT1,
  'sgbci-ciseaux':     ChartCiseaux,
  'sgbci-coeff':       ChartCoeff,
  'sgbci-sensib':      ChartSensib,
  'sgbci-div':         ChartDiv,
  'cfac-pnb-rn':       ChartCFACPnbRn,
  'cfac-cout-risque':  ChartCFACCoutRisque,
  'cfac-actif':        ChartCFACActif,
  'cfac-passif':       ChartCFACPassif,
  'nsbc-pnb':          ChartNSBCPnb,
  'nsbc-rn':           ChartNSBCRn,
  'nsbc-marge':        ChartNSBCMarge,
  'nsbc-bilan':            ChartNSBCBilan,
  'nsbc-fond-actes':       ChartNSBCFondActes,
  'nsbc-fond-pnb-stack':   ChartNSBCFondPnbStack,
  'nsbc-fond-npl':         ChartNSBCFondNpl,
  'nsbc-fond-cout-risque': ChartNSBCFondCoutRisque,
  'nsbc-fond-levier':      ChartNSBCFondLevier,
  'nsbc-fond-spreads':     ChartNSBCFondSpreads,
  'nsbc-fond-titres':      ChartNSBCFondTitres,
  'nsbc-fond-capex':       ChartNSBCFondCapex,
  'nsbc-fond-div':         ChartNSBCFondDiv,
};

export function ChartById({ chartId }: { chartId: string }) {
  const Component = CHART_MAP[chartId];
  if (!Component) return null;
  return <Component />;
}
