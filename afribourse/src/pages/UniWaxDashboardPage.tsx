const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>UNIWAX (UNXC) – Dashboard Analytique AfriBourse</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"><\/script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');
  :root {
    --gold: #C8940A; --gold-lt: #F2C94C; --dark: #0D0F1A; --dark2: #151828; --dark3: #1E2235;
    --teal: #0D7377; --teal-lt: #14BDBB; --red: #C0392B; --red-lt: #E74C3C;
    --green: #27AE60; --green-lt: #2ECC71; --orange: #E67E22; --orange-lt: #F39C12;
    --gray: #8899AA; --border: rgba(200,148,10,0.25); --card: rgba(255,255,255,0.04);
    --glow: 0 0 30px rgba(200,148,10,0.15);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: var(--dark); color: #E8EAF0; font-family: 'DM Sans', sans-serif; min-height: 100vh;
    background-image: radial-gradient(ellipse 60% 40% at 10% 0%, rgba(200,148,10,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 90% 100%, rgba(13,115,119,0.08) 0%, transparent 60%);
  }
  .header {
    padding: 40px 48px 28px; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: flex-end;
    position: sticky; top: 0; background: rgba(13,15,26,0.96); backdrop-filter: blur(12px); z-index: 100;
  }
  .header-left h1 {
    font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 900; letter-spacing: -0.5px;
    background: linear-gradient(135deg, #F2C94C 0%, #C8940A 50%, #E8D5A0 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .header-left .sub { font-size: 0.82rem; color: var(--gray); letter-spacing: 2px; text-transform: uppercase; margin-top: 4px; }
  .header-right { display: flex; gap: 24px; align-items: center; }
  .badge { padding: 6px 16px; border-radius: 20px; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.5px; }
  .badge-gold { background: rgba(200,148,10,0.15); border: 1px solid var(--gold); color: var(--gold-lt); }
  .badge-teal { background: rgba(13,115,119,0.15); border: 1px solid var(--teal); color: var(--teal-lt); }
  .cours-badge { display: flex; flex-direction: column; align-items: flex-end; }
  .cours-value { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700; color: var(--gold-lt); }
  .cours-label { font-size: 0.7rem; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; }
  .main { padding: 32px 48px 60px; max-width: 1600px; margin: 0 auto; }
  .kpi-strip { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 32px; }
  .kpi {
    background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px 18px;
    position: relative; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;
  }
  .kpi:hover { transform: translateY(-2px); box-shadow: var(--glow); }
  .kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .kpi.gold::before { background: linear-gradient(90deg, var(--gold), var(--gold-lt)); }
  .kpi.teal::before { background: linear-gradient(90deg, var(--teal), var(--teal-lt)); }
  .kpi.red::before { background: linear-gradient(90deg, var(--red), var(--red-lt)); }
  .kpi.green::before { background: linear-gradient(90deg, var(--green), var(--green-lt)); }
  .kpi.orange::before { background: linear-gradient(90deg, var(--orange), var(--orange-lt)); }
  .kpi-label { font-size: 0.7rem; color: var(--gray); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 10px; }
  .kpi-value { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; }
  .kpi.gold .kpi-value { color: var(--gold-lt); } .kpi.teal .kpi-value { color: var(--teal-lt); }
  .kpi.red .kpi-value { color: var(--red-lt); } .kpi.green .kpi-value { color: var(--green-lt); }
  .kpi.orange .kpi-value { color: var(--orange-lt); }
  .kpi-delta { font-size: 0.75rem; margin-top: 6px; }
  .delta-pos { color: var(--green-lt); } .delta-neg { color: var(--red-lt); } .delta-neu { color: var(--gray); }
  .charts-grid { display: grid; grid-template-columns: 7fr 5fr; gap: 20px; margin-bottom: 20px; }
  .charts-bottom { display: grid; grid-template-columns: 5fr 7fr; gap: 20px; margin-bottom: 20px; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; position: relative; overflow: hidden; }
  .card-title { font-family: 'Playfair Display', serif; font-size: 1rem; color: var(--gold-lt); margin-bottom: 4px; font-weight: 700; }
  .card-sub { font-size: 0.73rem; color: var(--gray); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
  .chart-container { position: relative; }
  .timeline { display: flex; gap: 0; margin-bottom: 20px; overflow: hidden; border-radius: 12px; border: 1px solid var(--border); }
  .timeline-period { flex: 1; padding: 16px 14px; position: relative; cursor: default; transition: background 0.2s; }
  .timeline-period:hover { background: rgba(255,255,255,0.04); }
  .tp-year { font-size: 0.72rem; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .tp-label { font-weight: 600; font-size: 0.82rem; margin-bottom: 6px; }
  .tp-bar { height: 4px; border-radius: 2px; margin-bottom: 8px; }
  .tp-result { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; }
  .tp-note { font-size: 0.68rem; color: var(--gray); margin-top: 4px; line-height: 1.4; }
  .scenarios-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
  .scenario { border-radius: 16px; padding: 24px; border: 1px solid; position: relative; overflow: hidden; }
  .scenario::before { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; opacity: 0.08; }
  .scenario.bull { border-color: rgba(39,174,96,0.4); background: rgba(39,174,96,0.06); }
  .scenario.bull::before { background: var(--green); }
  .scenario.base { border-color: rgba(230,126,34,0.4); background: rgba(230,126,34,0.06); }
  .scenario.base::before { background: var(--orange); }
  .scenario.bear { border-color: rgba(192,57,43,0.4); background: rgba(192,57,43,0.06); }
  .scenario.bear::before { background: var(--red); }
  .sc-emoji { font-size: 1.5rem; margin-bottom: 8px; }
  .sc-title { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; margin-bottom: 4px; }
  .scenario.bull .sc-title { color: var(--green-lt); } .scenario.base .sc-title { color: var(--orange-lt); } .scenario.bear .sc-title { color: var(--red-lt); }
  .sc-subtitle { font-size: 0.72rem; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
  .sc-target { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; margin-bottom: 4px; }
  .scenario.bull .sc-target { color: var(--green-lt); } .scenario.base .sc-target { color: var(--orange-lt); } .scenario.bear .sc-target { color: var(--red-lt); }
  .sc-range { font-size: 0.75rem; color: var(--gray); margin-bottom: 14px; }
  .sc-items { list-style: none; }
  .sc-items li { font-size: 0.78rem; color: #BCC5D0; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.05); line-height: 1.4; }
  .sc-items li::before { content: '→ '; opacity: 0.5; }
  .wacc-block { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .wacc-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; }
  .wacc-title { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1.2px; color: var(--gray); margin-bottom: 12px; }
  .wacc-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.82rem; }
  .wacc-key { color: #99A8B8; } .wacc-val { font-weight: 600; }
  .wacc-result { margin-top: 12px; padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
  .wacc-result.gold { background: rgba(200,148,10,0.12); border: 1px solid rgba(200,148,10,0.3); }
  .wacc-result.red { background: rgba(192,57,43,0.12); border: 1px solid rgba(192,57,43,0.3); }
  .wacc-result.teal { background: rgba(13,115,119,0.12); border: 1px solid rgba(13,115,119,0.3); }
  .wacc-result-key { font-size: 0.78rem; color: var(--gray); }
  .wacc-result-val { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; }
  .wacc-result.gold .wacc-result-val { color: var(--gold-lt); } .wacc-result.red .wacc-result-val { color: var(--red-lt); } .wacc-result.teal .wacc-result-val { color: var(--teal-lt); }
  .footer-strip { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .footer-strip span { font-size: 0.72rem; color: var(--gray); }
  .section-divider { margin: 28px 0 24px; border: none; border-top: 1px solid var(--border); }
  .section-header {
    font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; color: var(--gold-lt);
    margin-bottom: 16px; display: flex; align-items: center; gap: 12px;
  }
  .section-header::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .tip {
    border-bottom: 1px dashed rgba(200,148,10,0.5);
    cursor: help;
    display: inline;
    transition: border-color 0.15s;
  }
  .tip:hover { border-bottom-color: var(--gold-lt); }
  #ttip {
    position: fixed; z-index: 9999; max-width: 300px; padding: 12px 16px;
    background: rgba(13,15,26,0.97); border: 1px solid rgba(200,148,10,0.5);
    border-radius: 10px; color: #E8EAF0; font-size: 0.78rem; line-height: 1.6;
    pointer-events: none; opacity: 0; transition: opacity 0.15s;
    backdrop-filter: blur(8px); box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    font-family: 'DM Sans', sans-serif;
  }
  #ttip b { color: var(--gold-lt); display: block; margin-bottom: 4px; font-size: 0.82rem; }
  #ttip .ts { color: var(--gray); margin-top: 4px; }
  /* ── THEME TOGGLE BUTTON ── */
  #theme-btn {
    background: var(--card); border: 1px solid var(--border); border-radius: 20px;
    color: var(--gray); font-size: 1rem; cursor: pointer; padding: 6px 14px;
    display: flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif;
    font-size: 0.78rem; font-weight: 500; transition: all 0.2s; white-space: nowrap;
  }
  #theme-btn:hover { border-color: var(--gold-lt); color: var(--gold-lt); }
  /* ── LIGHT MODE ── */
  body.light {
    background: #F4EFE6; color: #1A202E;
    background-image:
      radial-gradient(ellipse 60% 40% at 10% 0%, rgba(200,148,10,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 40% 60% at 90% 100%, rgba(13,115,119,0.07) 0%, transparent 60%);
  }
  body.light .header { background: rgba(244,239,230,0.96); border-bottom-color: rgba(200,148,10,0.3); }
  body.light .kpi { background: rgba(255,255,255,0.75); border-color: rgba(200,148,10,0.2); }
  body.light .card { background: rgba(255,255,255,0.8); border-color: rgba(200,148,10,0.2); }
  body.light .wacc-card { background: rgba(255,255,255,0.7); border-color: rgba(0,0,0,0.1); }
  body.light .wacc-result.gold { background: rgba(200,148,10,0.1); }
  body.light .wacc-result.red { background: rgba(192,57,43,0.08); }
  body.light .wacc-result.teal { background: rgba(13,115,119,0.08); }
  body.light .timeline { border-color: rgba(200,148,10,0.3); }
  body.light .timeline-period:hover { background: rgba(0,0,0,0.03); }
  body.light .scenario.bull { background: rgba(39,174,96,0.07); }
  body.light .scenario.base { background: rgba(230,126,34,0.07); }
  body.light .scenario.bear { background: rgba(192,57,43,0.07); }
  body.light .sc-items li { color: #2A3545; border-bottom-color: rgba(0,0,0,0.07); }
  body.light .wacc-row { border-bottom-color: rgba(0,0,0,0.07); }
  body.light .section-divider { border-top-color: rgba(200,148,10,0.2); }
  body.light .section-header::after { background: rgba(200,148,10,0.2); }
  body.light .footer-strip { border-top-color: rgba(200,148,10,0.2); }
  body.light .kpi-label,
  body.light .card-sub,
  body.light .tp-note,
  body.light .tp-year,
  body.light .header-left .sub,
  body.light .cours-label,
  body.light .sc-subtitle,
  body.light .sc-range,
  body.light .footer-strip span,
  body.light .wacc-key,
  body.light .wacc-title,
  body.light #theme-btn { color: #556677; }
  body.light #theme-btn { border-color: rgba(200,148,10,0.3); }
  body.light #theme-btn:hover { color: var(--gold); border-color: var(--gold); }
  body.light .delta-pos { color: #1E8B4D; }
  body.light .delta-neg { color: #B03020; }
  body.light .badge-gold { color: #9A6E05; }
  body.light .badge-teal { color: #0A5D61; }
  body.light #ttip { background: rgba(255,255,255,0.98); color: #1A202E; box-shadow: 0 4px 24px rgba(0,0,0,0.15); }
  body.light #ttip b { color: var(--gold); }
  body.light #ttip .ts { color: #556677; }
  @media (max-width: 1200px) {
    .kpi-strip { grid-template-columns: repeat(3, 1fr); }
    .charts-grid, .charts-bottom { grid-template-columns: 1fr; }
    .scenarios-grid { grid-template-columns: 1fr; }
    .wacc-block { grid-template-columns: 1fr; }
    .header { flex-direction: column; gap: 16px; align-items: flex-start; }
    .main { padding: 20px 20px 40px; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="header-left">
    <h1>UNIWAX S.A. (UNXC)</h1>
    <div class="sub">Dashboard Analytique · AfriBourse · BRVM · Rapport Mars 2026</div>
  </div>
  <div class="header-right">
    <button id="theme-btn" onclick="toggleTheme()" title="Changer le thème">☀️ Fond clair</button>
    <span class="badge badge-gold">BRVM – Zone UEMOA</span>
    <span class="badge badge-teal">Textile · Wax</span>
    <div class="cours-badge">
      <div class="cours-value">2 000 FCFA</div>
      <div class="cours-label">Cours actuel · +240% depuis T4 2024</div>
    </div>
  </div>
</div>
<div class="main">
  <div class="kpi-strip">
    <div class="kpi gold"><div class="kpi-label">CA record (2019)</div><div class="kpi-value">40,2 Mds</div><div class="kpi-delta delta-pos">↑ Peak historique FCFA</div></div>
    <div class="kpi red"><div class="kpi-label">CA actuel (T3 2025)</div><div class="kpi-value">22,5 Mds</div><div class="kpi-delta delta-neg">↓ -44% vs record</div></div>
    <div class="kpi green"><div class="kpi-label">Résultat Net T3 2025</div><div class="kpi-value">8,14 Mds</div><div class="kpi-delta delta-pos">↑ Cession terrain +9,99 Mds</div></div>
    <div class="kpi red"><div class="kpi-label">EBIT opérationnel 2024</div><div class="kpi-value">-2,14 Mds</div><div class="kpi-delta delta-neg">↓ Destruction valeur</div></div>
    <div class="kpi orange"><div class="kpi-label"><span class="tip" data-key="wacc">WACC</span> estimé</div><div class="kpi-value">~16%</div><div class="kpi-delta delta-neg">↑ <span class="tip" data-key="beta">Bêta</span> 1,75 – très risqué</div></div>
    <div class="kpi teal"><div class="kpi-label">Taux BCEAO (mars 2026)</div><div class="kpi-value">3,00%</div><div class="kpi-delta delta-pos">↓ Favorable relance</div></div>
  </div>
  <div class="section-header">Épopée Financière 2018 – 2025</div>
  <div class="timeline">
    <div class="timeline-period" style="background:linear-gradient(180deg,rgba(39,174,96,0.1),transparent)">
      <div class="tp-year">2018–2019</div><div class="tp-label" style="color:#2ECC71">L'Âge d'Or</div>
      <div class="tp-bar" style="background:linear-gradient(90deg,#27AE60,#2ECC71)"></div>
      <div class="tp-result" style="color:#2ECC71">+4,19 Mds</div>
      <div class="tp-note">CA record 40,2 Mds<br><span class="tip" data-key="roic">ROIC</span> > <span class="tip" data-key="wacc">WACC</span> ✓<br>Dividende 202 FCFA</div>
    </div>
    <div class="timeline-period" style="background:linear-gradient(180deg,rgba(230,126,34,0.1),transparent)">
      <div class="tp-year">2020</div><div class="tp-label" style="color:#F39C12">Choc COVID</div>
      <div class="tp-bar" style="background:linear-gradient(90deg,#E67E22,#F39C12)"></div>
      <div class="tp-result" style="color:#F39C12">+0,23 Mds</div>
      <div class="tp-note">CA -13%<br>Effet ciseaux #1<br>Dividende suspendu</div>
    </div>
    <div class="timeline-period" style="background:linear-gradient(180deg,rgba(200,148,10,0.1),transparent)">
      <div class="tp-year">2021</div><div class="tp-label" style="color:#F2C94C">Faux Rebond</div>
      <div class="tp-bar" style="background:linear-gradient(90deg,#C8940A,#F2C94C)"></div>
      <div class="tp-result" style="color:#F2C94C">+1,40 Mds</div>
      <div class="tp-note">Stocks 13,9 Mds ⚠<br>100% payout<br><span class="tip" data-key="bfr">BFR</span> explose</div>
    </div>
    <div class="timeline-period" style="background:linear-gradient(180deg,rgba(192,57,43,0.12),transparent)">
      <div class="tp-year">2022</div><div class="tp-label" style="color:#E74C3C">Enfer Opérationnel</div>
      <div class="tp-bar" style="background:linear-gradient(90deg,#C0392B,#E74C3C)"></div>
      <div class="tp-result" style="color:#E74C3C">-1,30 Mds</div>
      <div class="tp-note">EBIT négatif<br>Inflation MP<br>Rupture modèle</div>
    </div>
    <div class="timeline-period" style="background:linear-gradient(180deg,rgba(192,57,43,0.18),transparent)">
      <div class="tp-year">2023</div><div class="tp-label" style="color:#E74C3C">Crise Créances</div>
      <div class="tp-bar" style="background:linear-gradient(90deg,#922B21,#E74C3C); width:80%"></div>
      <div class="tp-result" style="color:#E74C3C">-2,04 Mds</div>
      <div class="tp-note">CA &lt; 30 Mds<br>Créances +29%<br><span class="tip" data-key="ebitda">EBITDA</span> 325 M</div>
    </div>
    <div class="timeline-period" style="background:linear-gradient(180deg,rgba(192,57,43,0.25),transparent)">
      <div class="tp-year">2024</div><div class="tp-label" style="color:#E74C3C">Point de Rupture</div>
      <div class="tp-bar" style="background:linear-gradient(90deg,#7B241C,#C0392B); width:60%"></div>
      <div class="tp-result" style="color:#E74C3C">-2,19 Mds</div>
      <div class="tp-note"><span class="tip" data-key="ebitda">EBITDA</span> négatif!<br>Cours → 410 FCFA<br>Plancher historique</div>
    </div>
    <div class="timeline-period" style="background:linear-gradient(180deg,rgba(13,115,119,0.15),transparent)">
      <div class="tp-year">2025 (T3)</div><div class="tp-label" style="color:#14BDBB">Miracle Immobilier</div>
      <div class="tp-bar" style="background:linear-gradient(90deg,#0D7377,#14BDBB)"></div>
      <div class="tp-result" style="color:#14BDBB">+8,14 Mds *</div>
      <div class="tp-note">Cession terrain<br>9,99 Mds FCFA<br>Cours → 2000 FCFA</div>
    </div>
  </div>
  <div class="charts-grid">
    <div class="card">
      <div class="card-title">Chiffre d'Affaires &amp; Résultat Net</div>
      <div class="card-sub">Évolution 2018–2025 (T3) · en milliards FCFA</div>
      <div class="chart-container" style="height:280px"><canvas id="chartCA"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">Évolution des Marges</div>
      <div class="card-sub"><span class="tip" data-key="marge_ebitda">EBITDA</span> · <span class="tip" data-key="marge_ope">Opérationnelle</span> · <span class="tip" data-key="marge_nette">Nette</span> (%)</div>
      <div class="chart-container" style="height:280px"><canvas id="chartMarges"></canvas></div>
    </div>
  </div>
  <div class="charts-bottom">
    <div class="card">
      <div class="card-title"><span class="tip" data-key="bfr">BFR</span> : Stocks &amp; Créances Clients</div>
      <div class="card-sub">Immobilisation de trésorerie · en milliards FCFA</div>
      <div class="chart-container" style="height:260px"><canvas id="chartBFR"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title">Dynamique <span class="tip" data-key="roic">ROIC</span> vs <span class="tip" data-key="wacc">WACC</span></div>
      <div class="card-sub">Création vs Destruction de Valeur Économique</div>
      <div class="chart-container" style="height:260px"><canvas id="chartROIC"></canvas></div>
    </div>
  </div>
  <hr class="section-divider">
  <div class="section-header">Paramétrage du Coût du Capital (<span class="tip" data-key="wacc">WACC</span>)</div>
  <div class="wacc-block">
    <div class="wacc-card">
      <div class="wacc-title">Coût de la Dette — Kd</div>
      <div class="wacc-row"><span class="wacc-key">Taux BCEAO (mars 2026)</span><span class="wacc-val" style="color:var(--teal-lt)">3,00%</span></div>
      <div class="wacc-row"><span class="wacc-key">Taux débiteur marché</span><span class="wacc-val">6,76%</span></div>
      <div class="wacc-row"><span class="wacc-key">IS Côte d'Ivoire</span><span class="wacc-val">25%</span></div>
      <div class="wacc-result teal"><span class="wacc-result-key">Kd net (après IS)</span><span class="wacc-result-val">5,07%</span></div>
    </div>
    <div class="wacc-card">
      <div class="wacc-title">Coût des Capitaux Propres — Ke (MEDAF)</div>
      <div class="wacc-row"><span class="wacc-key">Taux sans risque Rf (UEMOA)</span><span class="wacc-val">6,00%</span></div>
      <div class="wacc-row"><span class="wacc-key"><span class="tip" data-key="beta">Bêta (β)</span> estimé UNXC</span><span class="wacc-val" style="color:var(--red-lt)">1,75</span></div>
      <div class="wacc-row"><span class="wacc-key">Prime de risque marché Pm</span><span class="wacc-val">6,00%</span></div>
      <div class="wacc-row"><span class="wacc-key">Ke = Rf + β × Pm</span><span class="wacc-val" style="color:var(--red-lt)">16,50%</span></div>
      <div class="wacc-result red"><span class="wacc-result-key">Ke = 6% + 1,75 × 6%</span><span class="wacc-result-val">16,5%</span></div>
    </div>
    <div class="wacc-card">
      <div class="wacc-title"><span class="tip" data-key="wacc">WACC</span> Consolidé</div>
      <div class="wacc-row"><span class="wacc-key">Capitaux propres</span><span class="wacc-val">&gt; 90%</span></div>
      <div class="wacc-row"><span class="wacc-key">Dette financière</span><span class="wacc-val" style="color:var(--green-lt)">&lt; 10%</span></div>
      <div class="wacc-row"><span class="wacc-key">Ke (pondération dominante)</span><span class="wacc-val" style="color:var(--red-lt)">16,5%</span></div>
      <div class="wacc-row"><span class="wacc-key">Kd net (pondération mineure)</span><span class="wacc-val" style="color:var(--teal-lt)">5,07%</span></div>
      <div class="wacc-result gold"><span class="wacc-result-key"><span class="tip" data-key="wacc">WACC</span> estimé</span><span class="wacc-result-val">~16%</span></div>
    </div>
  </div>
  <hr class="section-divider">
  <div class="section-header">Analyse Conditionnelle — 3 Scénarios de Projection</div>
  <div class="scenarios-grid">
    <div class="scenario bull">
      <div class="sc-emoji">🟢</div>
      <div class="sc-title">Retournement Réussi</div>
      <div class="sc-subtitle">Bull Case · Probabilité estimée ~25%</div>
      <div class="sc-target">3 000 – 3 500</div>
      <div class="sc-range">FCFA · +50% à +75% vs cours actuel</div>
      <ul class="sc-items">
        <li>Utilisation des 10 Mds pour réformer le <span class="tip" data-key="bfr">BFR</span></li>
        <li><span class="tip" data-key="ebitda">EBITDA</span> &gt; 3 Mds FCFA d'ici 2027</li>
        <li><span class="tip" data-key="roic">ROIC</span> redevient positif, <span class="tip" data-key="beta">bêta</span> recule vers 1,2</li>
        <li><span class="tip" data-key="wacc">WACC</span> diminue vers ~13%, spread se referme</li>
        <li>Synergies intégration verticale COIC</li>
      </ul>
    </div>
    <div class="scenario base">
      <div class="sc-emoji">🟡</div>
      <div class="sc-title">Piège de la Valeur</div>
      <div class="sc-subtitle">Base Case · Probabilité estimée ~50%</div>
      <div class="sc-target">1 600 – 2 200</div>
      <div class="sc-range">FCFA · Stagnation volatile, trading range</div>
      <ul class="sc-items">
        <li>Cash terrain absorbé par charges courantes</li>
        <li>Pas de réforme structure de coûts</li>
        <li><span class="tip" data-key="beta">Bêta</span> reste à 1,75, destruction de valeur continue</li>
        <li>Pics spéculatifs + corrections violentes</li>
        <li>Attente publication T4 2025 et orientations 2026</li>
      </ul>
    </div>
    <div class="scenario bear">
      <div class="sc-emoji">🔴</div>
      <div class="sc-title">Asphyxie Structurelle</div>
      <div class="sc-subtitle">Bear Case · Probabilité estimée ~25%</div>
      <div class="sc-target">&lt; 1 000</div>
      <div class="sc-range">FCFA · Penny Stock BRVM, fuite institutionnels</div>
      <ul class="sc-items">
        <li>10 Mds brûlés en &lt; 3 ans face concurrence asiatique</li>
        <li>Créances irrécouvrables, cash-burn extrême</li>
        <li><span class="tip" data-key="roic">ROIC</span> chroniquement négatif, valeur terminale → 0</li>
        <li>Rupture support psychologique 1 000 FCFA</li>
        <li>Désaffection totale des investisseurs institutionnels</li>
      </ul>
    </div>
  </div>
  <div class="footer-strip">
    <span>AfriBourse Analytics – Plateforme Aladdin BRVM · Données BRVM 2018–2025 T3</span>
    <span>Ce document est fourni à titre informatif uniquement · Non constitutif de conseil en investissement</span>
    <span>Mars 2026</span>
  </div>
</div>
<script>
// ── TOOLTIPS ──
const TIPS = {
  ebitda: '<b>EBITDA</b>Earnings Before Interest, Taxes, Depreciation & Amortization<div class="ts">Ce que l\'entreprise gagne avec son activité industrielle pure, avant les charges financières et amortissements.</div>',
  bfr: '<b>BFR — Besoin en Fonds de Roulement</b><div class="ts">L\'argent que l\'entreprise doit avancer pour faire tourner son activité avant d\'être payée. Des stocks et créances élevés = BFR qui explose.</div>',
  roic: '<b>ROIC — Return On Invested Capital</b>Retour sur Capital Investi<div class="ts">Ce que l\'entreprise gagne (en %) sur chaque franc investi dans son outil industriel. ROIC > WACC = création de valeur.</div>',
  wacc: '<b>WACC — Weighted Average Cost of Capital</b>Coût Moyen Pondéré du Capital<div class="ts">Taux minimum qu\'Uniwax DOIT générer pour satisfaire ses investisseurs et créanciers. C\'est le seuil de rentabilité du capital (~16% ici).</div>',
  beta: '<b>Bêta (β = 1,75)</b><div class="ts">Mesure la volatilité d\'une action par rapport au marché. β > 1 = plus volatile. Ici, Uniwax amplifie les mouvements de marché × 1,75. Un β élevé = risque perçu plus fort = WACC plus élevé.</div>',
  marge_ebitda: '<b>Marge EBITDA</b><div class="ts">% du CA converti en cash opérationnel brut. Exclut intérêts, impôts et amortissements. Mesure l\'efficacité industrielle pure.</div>',
  marge_ope: '<b>Marge Opérationnelle</b><div class="ts">% du CA restant après toutes les charges d\'exploitation (incluant amortissements). Reflète la rentabilité réelle de l\'activité.</div>',
  marge_nette: '<b>Marge Nette</b><div class="ts">% du CA qui devient bénéfice final pour les actionnaires, après impôts et charges financières. Le résultat ultime.</div>'
};
const ttip = document.createElement('div');
ttip.id = 'ttip';
document.body.appendChild(ttip);
document.querySelectorAll('.tip').forEach(el => {
  el.addEventListener('mouseenter', e => {
    const t = TIPS[el.dataset.key];
    if (!t) return;
    ttip.innerHTML = t;
    ttip.style.opacity = '1';
    mv(e);
  });
  el.addEventListener('mousemove', mv);
  el.addEventListener('mouseleave', () => { ttip.style.opacity = '0'; });
});
function mv(e) {
  const tw = ttip.offsetWidth || 300, th = ttip.offsetHeight || 100;
  let x = e.clientX + 14, y = e.clientY - th - 12;
  if (x + tw > window.innerWidth - 10) x = e.clientX - tw - 14;
  if (y < 10) y = e.clientY + 20;
  ttip.style.left = x + 'px';
  ttip.style.top = y + 'px';
}

// ── THEME TOGGLE ──
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  const btn = document.getElementById('theme-btn');
  btn.textContent = isLight ? '🌙 Fond sombre' : '☀️ Fond clair';
  localStorage.setItem('afribourse-theme', isLight ? 'light' : 'dark');
  rebuildCharts(isLight);
}
if (localStorage.getItem('afribourse-theme') === 'light') {
  document.body.classList.add('light');
  document.getElementById('theme-btn').textContent = '🌙 Fond sombre';
}

// ── CHARTS ──
const years = ['2018','2019','2020','2021','2022','2023','2024','2025 T3'];
const gold = '#C8940A', goldlt = '#F2C94C', teal = '#14BDBB', red = '#E74C3C', green = '#2ECC71', orange = '#F39C12';
const roicValues = [19.1,14.5,1.5,4.2,-4.5,-8.2,-10.5,-1.6];
let chartInstances = {};

function rebuildCharts(isLight) {
  const gridColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
  const tickColor = isLight ? '#556677' : '#8899AA';
  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: tickColor, font: { family: 'DM Sans', size: 11 }, boxWidth: 14 } } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } }
    }
  };
  Object.values(chartInstances).forEach(c => c.destroy());
  chartInstances = {};

  chartInstances.ca = new Chart(document.getElementById('chartCA'), {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        { label: "Chiffre d'Affaires (Mds FCFA)", data: [38.97,40.16,34.92,38.19,36.37,29.69,27.33,22.47], backgroundColor: isLight?'rgba(200,148,10,0.25)':'rgba(200,148,10,0.3)', borderColor: goldlt, borderWidth: 1.5, borderRadius: 4, yAxisID: 'y' },
        { label: 'Résultat Net (Mds FCFA)', data: [4.19,3.09,0.23,1.40,-1.30,-2.04,-2.19,8.14], type: 'line', borderColor: teal, backgroundColor: 'rgba(20,189,187,0.1)', borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: ctx => ctx.raw >= 0 ? green : red, tension: 0.3, fill: false, yAxisID: 'y2' }
      ]
    },
    options: { ...baseOpts, scales: { x:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:10}}}, y:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:10},callback:v=>v+' Mds'},title:{display:true,text:'CA (Mds)',color:tickColor,font:{size:10}}}, y2:{position:'right',grid:{display:false},ticks:{color:tickColor,font:{size:10},callback:v=>v+' Mds'},title:{display:true,text:'RN (Mds)',color:tickColor,font:{size:10}}} } }
  });

  chartInstances.marges = new Chart(document.getElementById('chartMarges'), {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        { label: 'Marge EBITDA (%)', data: [16.5,16.3,7.7,10.5,3.1,1.1,null,null], borderColor: goldlt, backgroundColor: isLight?'rgba(200,148,10,0.06)':'rgba(200,148,10,0.08)', borderWidth: 2.5, pointRadius: 5, tension: 0.3, fill: true },
        { label: 'Marge Opérationnelle (%)', data: [14.1,10.7,1.5,5.2,-3.3,-6.1,-7.8,-1.6], borderColor: teal, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 4, tension: 0.3, pointBackgroundColor: ctx => ctx.raw >= 0 ? teal : red },
        { label: 'Marge Nette (%)', data: [10.8,7.7,0.7,3.7,-3.6,-6.9,-8.0,null], borderColor: orange, backgroundColor: 'transparent', borderWidth: 2, pointRadius: 4, tension: 0.3, borderDash: [5,3], pointBackgroundColor: ctx => ctx.raw >= 0 ? orange : red }
      ]
    },
    options: { ...baseOpts, scales: { x:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:10}}}, y:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:10},callback:v=>v+'%'},min:-12} } }
  });

  chartInstances.bfr = new Chart(document.getElementById('chartBFR'), {
    type: 'bar',
    data: {
      labels: ['2018','2019','2020','2021','2022','2023','2024'],
      datasets: [
        { label: 'Stocks (Mds FCFA)', data: [9.94,12.92,10.98,13.91,14.79,13.52,11.41], backgroundColor: isLight?'rgba(200,148,10,0.45)':'rgba(200,148,10,0.5)', borderColor: goldlt, borderWidth: 1.5, borderRadius: 3, stack: 'bfr' },
        { label: 'Créances Clients (Mds FCFA)', data: [7.12,7.33,3.64,5.21,8.13,10.50,8.12], backgroundColor: isLight?'rgba(20,189,187,0.3)':'rgba(20,189,187,0.35)', borderColor: teal, borderWidth: 1.5, borderRadius: 3, stack: 'bfr' }
      ]
    },
    options: { ...baseOpts, scales: { x:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:10}},stacked:true}, y:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:10},callback:v=>v+' Mds'},stacked:true} } }
  });

  chartInstances.roic = new Chart(document.getElementById('chartROIC'), {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        { label: 'ROIC estimé (%)', data: roicValues, backgroundColor: roicValues.map(v=>v>16?'rgba(39,174,96,0.55)':v>0?'rgba(230,126,34,0.55)':'rgba(192,57,43,0.55)'), borderColor: roicValues.map(v=>v>16?green:v>0?orange:red), borderWidth: 1.5, borderRadius: 4 },
        { label: 'WACC ~16% (seuil création valeur)', data: [16,16,16,16,16,16,16,16], type: 'line', borderColor: goldlt, borderWidth: 2.5, borderDash: [8,4], pointRadius: 0, fill: false }
      ]
    },
    options: { ...baseOpts, scales: { x:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:10}}}, y:{grid:{color:gridColor},ticks:{color:tickColor,font:{size:10},callback:v=>v+'%'},min:-14} } }
  });
}

rebuildCharts(document.body.classList.contains('light'));
<\/script>
</body>
</html>`;

export default function UniWaxDashboardPage() {
  return (
    <iframe
      srcDoc={HTML}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="UNIWAX Dashboard Analytique"
    />
  );
}
