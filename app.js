/* DB Zuganzeiger Generator – app.js */

const TRAIN_TYPES = ['ICE','IC','EC','RE','RB','S','NJ','TGV','FLX'];

const WAGONS = {
  ICE: [
    {c:'wloco',l:'&#9654;'},
    {c:'w1',l:'1'},{c:'w1',l:'1'},
    {c:'wbordrestaurant',l:'&#9749;'},
    {c:'w2',l:'2'},{c:'w2',l:'2'},{c:'w2',l:'2'},
    {c:'wloco',l:'&#9664;'}
  ],
  IC: [
    {c:'wloco',l:'&#9654;'},
    {c:'w2',l:'2'},{c:'w2',l:'2'},
    {c:'wbistro',l:'&#9749;'},
    {c:'w1',l:'1'},{c:'w1',l:'1'}
  ],
  EC: [
    {c:'wloco',l:'&#9654;'},
    {c:'w2',l:'2'},{c:'w2',l:'2'},
    {c:'w1',l:'1'}
  ],
  RE: [
    {c:'wloco',l:'&#9654;'},
    {c:'w2',l:'2'},{c:'w2',l:'2'},{c:'w2',l:'2'},
    {c:'wloco',l:'&#9664;'}
  ],
  RB: [
    {c:'wloco',l:'&#9654;'},
    {c:'w2',l:'2'},{c:'w2',l:'2'},
    {c:'wloco',l:'&#9664;'}
  ],
  S: [
    {c:'wloco',l:'&#9654;'},
    {c:'w2',l:'2'},{c:'w2',l:'2'},
    {c:'wloco',l:'&#9664;'}
  ],
  NJ: [
    {c:'wloco',l:'&#9654;'},
    {c:'w2',l:'2'},{c:'wspecial',l:'&#128716;'},{c:'w1',l:'1'}
  ],
  TGV: [
    {c:'wloco',l:'&#9654;'},
    {c:'w2',l:'2'},{c:'w2',l:'2'},{c:'wbistro',l:'&#9749;'},{c:'w1',l:'1'},
    {c:'wloco',l:'&#9664;'}
  ],
  FLX: [
    {c:'wloco',l:'&#9654;'},
    {c:'w2',l:'2'},{c:'w2',l:'2'},{c:'w2',l:'2'}
  ]
};

let state = {
  station: 'Berlin Hbf',
  track: '7',
  disruption: false,
  disruptionText: 'Aufgrund einer Betriebsstörung kommt es zu Verspätungen im Zugverkehr.',
  trains: [
    { type:'ICE', num:'792',  dest:'München Hbf',    via:'Leipzig Hbf · Nürnberg Hbf', time:'14:22', delay:0 },
    { type:'RE',  num:'3',   dest:'Magdeburg Hbf',  via:'Potsdam Hbf · Genthin',       time:'14:31', delay:4 },
    { type:'S',   num:'S7',  dest:'Potsdam Hbf',    via:'',                             time:'14:35', delay:0 }
  ]
};

/* ---- Clock ---- */
function tick() {
  const n = new Date();
  const pad = v => String(v).padStart(2,'0');
  document.getElementById('zim-clock').textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
  const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  document.getElementById('zim-date').textContent =
    `${days[n.getDay()]}, ${pad(n.getDate())}.${pad(n.getMonth()+1)}.${n.getFullYear()}`;
}
setInterval(tick, 1000);
tick();

/* ---- Helpers ---- */
function addMins(t, m) {
  if (!m || m == 0) return null;
  const [h, min] = t.split(':').map(Number);
  const tot = h*60 + min + parseInt(m);
  return `${String(Math.floor(tot/60)%24).padStart(2,'0')}:${String(tot%60).padStart(2,'0')}`;
}

function badgeClass(type) {
  const t = type.toUpperCase();
  if (['ICE','IC','EC','RE','RB','S','NJ','TGV','FLX'].includes(t)) return `zbadge-${t}`;
  return 'zbadge-other';
}

function wagonsHTML(type) {
  const w = WAGONS[type.toUpperCase()] || WAGONS.RE;
  const blocks = w.map(b => `<div class="wblock ${b.c}">${b.l}</div>`).join('');
  return `
    <div class="zi-wagons-label">Wagenreihung</div>
    <div class="zi-wagons-row">${blocks}</div>
    <div class="zi-wagons-dir">&#8596; Fahrtrichtung</div>
  `;
}

/* ---- Render Display ---- */
function renderDisplay() {
  document.getElementById('zim-station').textContent  = state.station || 'Bahnhof';
  document.getElementById('zim-track-num').textContent = state.track   || '–';

  const db = document.getElementById('zim-disruption');
  if (state.disruption) {
    db.classList.remove('hidden');
    document.getElementById('zim-disruption-text').textContent = state.disruptionText;
  } else {
    db.classList.add('hidden');
  }

  const container = document.getElementById('zim-trains');
  container.innerHTML = '';

  state.trains.slice(0,3).forEach((tr, i) => {
    const primary = i === 0;
    const expTime = addMins(tr.time, tr.delay);

    let timeStatus;
    if (tr.delay > 0) {
      timeStatus = `<span class="zt-exp late">+${tr.delay} Min &nbsp;&#8594; ${expTime}</span>`;
    } else {
      timeStatus = `<span class="zt-exp ontime">&#10003;&nbsp;p&#252;nktlich</span>`;
    }

    const via = tr.via ? `<div class="zi-via">&#252;ber ${tr.via}</div>` : '';
    const wagons = primary ? `<div class="zi-wagons">${wagonsHTML(tr.type)}</div>` : '';

    const row = document.createElement('div');
    row.className = `zrow ${primary ? 'zrow-primary' : 'zrow-secondary'}`;
    row.innerHTML = `
      <div class="zcell-time">
        <span class="zt-planned">${tr.time}</span>
        ${timeStatus}
      </div>
      <div class="zcell-info">
        <div class="zi-header">
          <span class="zbadge ${badgeClass(tr.type)}">${tr.type}&nbsp;${tr.num}</span>
          <span class="zi-destination">${tr.dest}</span>
        </div>
        ${via}
        ${wagons}
      </div>
    `;
    container.appendChild(row);
  });
}

/* ---- Render Editor ---- */
function renderEditor() {
  const el = document.getElementById('train-editor');
  el.innerHTML = '';
  state.trains.forEach((tr, i) => {
    const card = document.createElement('div');
    card.className = 't-card';
    card.innerHTML = `
      <div class="t-card-head">
        <span>Zug ${i+1}${i===0?' &mdash; Primär':''}</span>
        <button class="rm-train" data-i="${i}">&#10005;</button>
      </div>
      <label>Typ
        <select data-f="type" data-i="${i}">
          ${TRAIN_TYPES.map(t=>`<option${t===tr.type?' selected':''}>${t}</option>`).join('')}
        </select>
      </label>
      <label>Nummer
        <input type="text" data-f="num" data-i="${i}" value="${tr.num}" />
      </label>
      <label>Ziel
        <input type="text" data-f="dest" data-i="${i}" value="${tr.dest}" />
      </label>
      <label>Via
        <input type="text" data-f="via" data-i="${i}" value="${tr.via}" />
      </label>
      <label>Abfahrt
        <input type="time" data-f="time" data-i="${i}" value="${tr.time}" />
      </label>
      <label>Verspätung (Min)
        <input type="text" data-f="delay" data-i="${i}" value="${tr.delay}" />
      </label>
    `;
    el.appendChild(card);
  });
}

/* ---- Wire up sidebar controls ---- */
document.getElementById('cfg-station').addEventListener('input', e => { state.station = e.target.value; renderDisplay(); });
document.getElementById('cfg-track').addEventListener('input', e => { state.track = e.target.value; renderDisplay(); });
document.getElementById('cfg-disruption').addEventListener('change', e => { state.disruption = e.target.checked; renderDisplay(); });
document.getElementById('cfg-disruption-text').addEventListener('input', e => { state.disruptionText = e.target.value; renderDisplay(); });

const te = document.getElementById('train-editor');
te.addEventListener('input', e => {
  const {f, i} = e.target.dataset;
  if (!f || i===undefined) return;
  state.trains[i][f] = e.target.value;
  renderDisplay();
});
te.addEventListener('change', e => {
  const {f, i} = e.target.dataset;
  if (!f || i===undefined) return;
  state.trains[i][f] = e.target.value;
  renderDisplay();
});
te.addEventListener('click', e => {
  if (!e.target.classList.contains('rm-train')) return;
  state.trains.splice(parseInt(e.target.dataset.i), 1);
  renderEditor();
  renderDisplay();
});

document.getElementById('btn-add-train').addEventListener('click', () => {
  if (state.trains.length >= 3) return;
  state.trains.push({ type:'RE', num:'', dest:'Ziel', via:'', time:'15:00', delay:0 });
  renderEditor();
  renderDisplay();
});

document.getElementById('btn-collapse').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('closed');
});

document.getElementById('btn-fullscreen').addEventListener('click', () => {
  document.body.classList.toggle('fs');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.body.classList.remove('fs');
});

document.getElementById('btn-export').addEventListener('click', () => {
  html2canvas(document.getElementById('zim'), {
    backgroundColor: '#0A0A0A',
    scale: 2,
    useCORS: true
  }).then(c => {
    const a = document.createElement('a');
    a.download = `zim-${Date.now()}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  });
});

/* ---- Init ---- */
renderEditor();
renderDisplay();
