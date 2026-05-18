/* ============================================================
   DB Bahnsteigdisplay Generator – app.js
   ============================================================ */

// ---- Default train templates ----
const DEFAULT_TRAINS = [
  {
    type: 'ICE',
    number: '792',
    destination: 'München Hbf',
    via: 'Leipzig Hbf · Nürnberg Hbf',
    time: '14:22',
    delay: 0,
    platform: ''
  },
  {
    type: 'RE',
    number: '3',
    destination: 'Magdeburg Hbf',
    via: 'Potsdam Hbf · Genthin',
    time: '14:31',
    delay: 4,
    platform: ''
  },
  {
    type: 'S',
    number: 'S7',
    destination: 'Potsdam Hbf',
    via: '',
    time: '14:35',
    delay: 0,
    platform: ''
  }
];

// ---- Wagon presets ----
const WAGON_PRESETS = {
  ICE: [
    { cls: 'wagon-loco',   label: '&#x25B6;' },
    { cls: 'wagon-first',  label: '1' },
    { cls: 'wagon-first',  label: '1' },
    { cls: 'wagon-bistro', label: '&#x2615;' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-loco',   label: '&#x25C4;' }
  ],
  IC: [
    { cls: 'wagon-loco',   label: '&#x25B6;' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-bistro', label: '&#x2615;' },
    { cls: 'wagon-first',  label: '1' },
    { cls: 'wagon-first',  label: '1' }
  ],
  EC: [
    { cls: 'wagon-loco',   label: '&#x25B6;' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-first',  label: '1' }
  ],
  RE: [
    { cls: 'wagon-bahn',   label: '&#x25B6;' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-bahn',   label: '&#x25C4;' }
  ],
  RB: [
    { cls: 'wagon-bahn',   label: '&#x25B6;' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-bahn',   label: '&#x25C4;' }
  ],
  S: [
    { cls: 'wagon-bahn',   label: '&#x25B6;' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-bahn',   label: '&#x25C4;' }
  ],
  NJ: [
    { cls: 'wagon-loco',   label: '&#x25B6;' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-second', label: '2' },
    { cls: 'wagon-first',  label: '1' }
  ]
};

function getWagons(type) {
  return WAGON_PRESETS[type.toUpperCase()] || [
    { cls: 'wagon-bahn', label: '&#x25B6;' },
    { cls: 'wagon-second', label: '2' }
  ];
}

// ---- State ----
let trains = JSON.parse(JSON.stringify(DEFAULT_TRAINS));

// ---- DOM refs ----
const trainList       = document.getElementById('train-list');
const trainRows       = document.getElementById('train-rows');
const stationInput    = document.getElementById('station-name');
const trackInput      = document.getElementById('track');
const displayStation  = document.getElementById('display-station');
const displayTrack    = document.getElementById('display-track-number');
const displayClock    = document.getElementById('display-clock');
const footerDate      = document.getElementById('footer-date');
const disruptionCb    = document.getElementById('disruption-active');
const disruptionText  = document.getElementById('disruption-text');
const disruptionBanner= document.getElementById('disruption-banner');
const disruptionMsg   = document.getElementById('disruption-message');

// ---- Clock ----
function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  displayClock.textContent = `${hh}:${mm}:${ss}`;

  const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  const d = now;
  footerDate.textContent = `${days[d.getDay()]}, ${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}
setInterval(updateClock, 1000);
updateClock();

// ---- Helpers ----
function addMinutes(timeStr, mins) {
  if (!mins || mins === 0) return null;
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + parseInt(mins);
  return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}

function badgeClass(type) {
  const t = type.toUpperCase();
  if (['ICE'].includes(t)) return 'badge-ice';
  if (['IC','EC'].includes(t)) return 'badge-ic';
  if (t === 'RE') return 'badge-re';
  if (t === 'RB') return 'badge-rb';
  if (t === 'S')  return 'badge-s';
  if (t === 'NJ') return 'badge-nj';
  return 'badge-other';
}

function buildWagonHTML(type) {
  const wagons = getWagons(type);
  const blocks = wagons.map(w =>
    `<div class="wagon-block ${w.cls}">${w.label}</div>`
  ).join('');
  return `
    <div class="wagon-label">Wagenreihung</div>
    <div class="wagon-sequence">${blocks}</div>
    <div class="wagon-direction">&#x21C4; Fahrtrichtung</div>
  `;
}

// ---- Render Display ----
function renderDisplay() {
  // Station + track
  displayStation.textContent = stationInput.value || 'Bahnhof';
  displayTrack.textContent   = trackInput.value   || '–';

  // Disruption
  if (disruptionCb.checked) {
    disruptionBanner.classList.remove('hidden');
    disruptionMsg.textContent = disruptionText.value;
  } else {
    disruptionBanner.classList.add('hidden');
  }

  // Trains
  trainRows.innerHTML = '';
  trains.slice(0, 3).forEach((t, i) => {
    const isFirst = i === 0;
    const delayedTime = addMinutes(t.time, t.delay);

    const delayHTML = t.delay > 0
      ? `<span class="delayed">+${t.delay} Min &nbsp;${delayedTime}</span>`
      : `<span class="ontime">&#10003; p&uuml;nktlich</span>`;

    const viaHTML = t.via
      ? `<div class="train-via">über ${t.via}</div>`
      : '';

    const wagonHTML = isFirst ? buildWagonHTML(t.type) : '';

    const row = document.createElement('div');
    row.className = `train-row ${isFirst ? 'first-train' : 'subsequent-train'}`;
    row.innerHTML = `
      <div class="train-time">
        <span class="planned">${t.time}</span>
        ${delayHTML}
      </div>
      <div class="train-info">
        <div class="train-headline">
          <span class="train-type-badge ${badgeClass(t.type)}">${t.type} ${t.number}</span>
          <span class="train-destination">${t.destination}</span>
        </div>
        ${viaHTML}
      </div>
      <div class="train-wagons">
        ${wagonHTML}
      </div>
    `;
    trainRows.appendChild(row);
  });
}

// ---- Render Editor Cards ----
function renderEditor() {
  trainList.innerHTML = '';
  trains.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'train-card';
    card.innerHTML = `
      <div class="train-card-header">
        <span>Zug ${i + 1}${i === 0 ? ' (Hauptzug)' : ''}</span>
        <button class="remove-train" data-i="${i}" title="Entfernen">&#10005;</button>
      </div>
      <label>Typ
        <select data-field="type" data-i="${i}">
          ${['ICE','IC','EC','RE','RB','S','NJ','FLX','TGV'].map(tp =>
            `<option${tp === t.type ? ' selected' : ''}>${tp}</option>`
          ).join('')}
        </select>
      </label>
      <label>Nummer
        <input type="text" data-field="number" data-i="${i}" value="${t.number}" />
      </label>
      <label>Ziel
        <input type="text" data-field="destination" data-i="${i}" value="${t.destination}" />
      </label>
      <label>Via (optional)
        <input type="text" data-field="via" data-i="${i}" value="${t.via}" />
      </label>
      <label>Abfahrt
        <input type="time" data-field="time" data-i="${i}" value="${t.time}" />
      </label>
      <label>Verspätung (Min)
        <input type="text" data-field="delay" data-i="${i}" value="${t.delay}" style="width:55%" />
      </label>
    `;
    trainList.appendChild(card);
  });
}

// ---- Event Delegation: editor inputs ----
trainList.addEventListener('input', e => {
  const el = e.target;
  const i  = el.dataset.i;
  const f  = el.dataset.field;
  if (i === undefined || !f) return;
  trains[i][f] = el.value;
  renderDisplay();
});

trainList.addEventListener('change', e => {
  const el = e.target;
  const i  = el.dataset.i;
  const f  = el.dataset.field;
  if (i === undefined || !f) return;
  trains[i][f] = el.value;
  renderDisplay();
});

trainList.addEventListener('click', e => {
  if (e.target.classList.contains('remove-train')) {
    const i = parseInt(e.target.dataset.i);
    trains.splice(i, 1);
    renderEditor();
    renderDisplay();
  }
});

// ---- Add train ----
document.getElementById('add-train').addEventListener('click', () => {
  if (trains.length >= 3) return;
  trains.push({ type: 'RE', number: '', destination: 'Ziel', via: '', time: '15:00', delay: 0 });
  renderEditor();
  renderDisplay();
});

// ---- Station / track inputs ----
stationInput.addEventListener('input', renderDisplay);
trackInput.addEventListener('input', renderDisplay);

// ---- Disruption ----
disruptionCb.addEventListener('change', renderDisplay);
disruptionText.addEventListener('input', renderDisplay);

// ---- Sidebar toggle ----
document.getElementById('toggle-sidebar').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ---- Fullscreen ----
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  document.body.classList.toggle('fullscreen-active');
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.body.classList.remove('fullscreen-active');
});

// ---- PNG Export ----
document.getElementById('btn-export').addEventListener('click', () => {
  const display = document.getElementById('display');
  html2canvas(display, {
    backgroundColor: '#0D1117',
    scale: 2,
    useCORS: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `db-display-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});

// ---- Initial render ----
renderEditor();
renderDisplay();
