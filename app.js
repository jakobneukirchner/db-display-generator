const defaultState = {
  station: 'Berlin Hbf',
  mode: 'platform',
  noteActive: false,
  noteText: 'Bitte auf geänderte Wagenreihung achten.',
  trains: [
    {
      line: 'RE 1',
      time: '10:17',
      destination: 'Magdeburg Hbf',
      via: 'Bln-Charlottenb. – Bln Wannsee – Potsdam Hbf – Werder – Brandenburg – Genthin – Burg(Magdeburg) – Magd.-Neustadt',
      wagen: ['engine-left', 'standard-bike', 'standard-bike', 'standard-second', 'engine-right'],
      sectors: ['A', 'B', 'C', 'D']
    },
    {
      line: 'RE 1',
      time: '11:17',
      destination: 'Magdeburg Hbf',
      via: 'Bln Wannsee – Potsdam Hbf – Werder – Brandenburg – Genthin – Burg(Magdeburg)',
      wagen: ['engine-left', 'slim-second', 'slim-second', 'engine-right'],
      sectors: ['A', 'B', 'C', 'D']
    },
    {
      line: 'RE 1',
      time: '12:17',
      destination: 'Magdeburg Hbf',
      via: 'Bln Wannsee – Potsdam Hbf – Werder – Brandenburg – Genthin – Burg(Magdeburg)',
      wagen: ['engine-left', 'wide-second'],
      sectors: ['A', 'B', 'C']
    }
  ]
};

let state = structuredClone(defaultState);

const trainEditor = document.getElementById('train-editor');
const displayGrid = document.getElementById('display-grid');

function carHTML(type) {
  if (type === 'engine-left') return `<div class="zim-arrow">←</div><div class="zim-car engine"></div>`;
  if (type === 'engine-right') return `<div class="zim-car engine"></div>`;
  if (type === 'standard-bike') return `<div class="zim-car standard"><span class="bike">🚲</span></div>`;
  if (type === 'standard-second') return `<div class="zim-car standard"><span class="cls">2</span></div>`;
  if (type === 'slim-second') return `<div class="zim-car slim"><span class="cls">2</span></div>`;
  if (type === 'wide-second') return `<div class="zim-car wide"><span class="cls">2</span></div>`;
  if (type === 'wc-second') return `<div class="zim-car standard"><span class="wc">♿</span><span class="cls">2</span></div>`;
  return `<div class="zim-car standard"><span class="cls">2</span></div>`;
}

function renderDisplay() {
  displayGrid.innerHTML = '';
  state.trains.slice(0, 3).forEach((train) => {
    const panel = document.createElement('section');
    panel.className = 'zim-panel';

    const note = state.noteActive ? `<div class="zim-note">${escapeHtml(state.noteText)}</div>` : '';
    const sectors = train.sectors.map(s => `<span>${escapeHtml(s)}</span>`).join('');
    const wagons = train.wagen.map(carHTML).join('');

    panel.innerHTML = `
      <div class="zim-line">${escapeHtml(train.line)}</div>
      <div class="zim-time">${escapeHtml(train.time)}</div>
      <div class="zim-destination">${escapeHtml(train.destination)}</div>
      <div class="zim-via">${escapeHtml(train.via)}</div>
      ${note}
      <div class="zim-wagen">
        <div class="zim-sectors">${sectors}</div>
        <div class="zim-wagen-row">${wagons}</div>
      </div>
    `;
    displayGrid.appendChild(panel);
  });
}

function renderEditor() {
  trainEditor.innerHTML = '';
  state.trains.forEach((train, index) => {
    const card = document.createElement('div');
    card.className = 'editor-card';
    card.innerHTML = `
      <div class="editor-card-head">
        <span>Zug ${index + 1}</span>
        <button data-remove="${index}">×</button>
      </div>
      <label>Linie
        <input type="text" data-field="line" data-index="${index}" value="${escapeAttr(train.line)}" />
      </label>
      <label>Zeit
        <input type="text" data-field="time" data-index="${index}" value="${escapeAttr(train.time)}" />
      </label>
      <label>Ziel
        <input type="text" data-field="destination" data-index="${index}" value="${escapeAttr(train.destination)}" />
      </label>
      <label>Via
        <textarea data-field="via" data-index="${index}" rows="3">${escapeHtml(train.via)}</textarea>
      </label>
      <label>Wagenlayout
        <select data-field="wagenPreset" data-index="${index}">
          <option value="long" ${presetOf(train.wagen)==='long'?'selected':''}>Lang mit Fahrradsymbolen</option>
          <option value="mid" ${presetOf(train.wagen)==='mid'?'selected':''}>Mittel</option>
          <option value="short" ${presetOf(train.wagen)==='short'?'selected':''}>Kurz</option>
        </select>
      </label>
    `;
    trainEditor.appendChild(card);
  });
}

function presetOf(wagen) {
  const key = JSON.stringify(wagen);
  if (key === JSON.stringify(['engine-left', 'standard-bike', 'standard-bike', 'standard-second', 'engine-right'])) return 'long';
  if (key === JSON.stringify(['engine-left', 'slim-second', 'slim-second', 'engine-right'])) return 'mid';
  return 'short';
}

function applyPreset(index, preset) {
  if (preset === 'long') {
    state.trains[index].wagen = ['engine-left', 'standard-bike', 'standard-bike', 'standard-second', 'engine-right'];
    state.trains[index].sectors = ['A', 'B', 'C', 'D'];
  } else if (preset === 'mid') {
    state.trains[index].wagen = ['engine-left', 'slim-second', 'slim-second', 'engine-right'];
    state.trains[index].sectors = ['A', 'B', 'C', 'D'];
  } else {
    state.trains[index].wagen = ['engine-left', 'wide-second'];
    state.trains[index].sectors = ['A', 'B', 'C'];
  }
}

trainEditor.addEventListener('input', (e) => {
  const idx = e.target.dataset.index;
  const field = e.target.dataset.field;
  if (idx === undefined || !field) return;
  state.trains[idx][field] = e.target.value;
  renderDisplay();
});

trainEditor.addEventListener('change', (e) => {
  const idx = e.target.dataset.index;
  const field = e.target.dataset.field;
  if (e.target.dataset.remove !== undefined) return;
  if (idx === undefined || !field) return;
  if (field === 'wagenPreset') {
    applyPreset(Number(idx), e.target.value);
    renderEditor();
    renderDisplay();
    return;
  }
  state.trains[idx][field] = e.target.value;
  renderDisplay();
});

trainEditor.addEventListener('click', (e) => {
  const remove = e.target.dataset.remove;
  if (remove === undefined) return;
  state.trains.splice(Number(remove), 1);
  if (state.trains.length === 0) state.trains.push(structuredClone(defaultState.trains[0]));
  renderEditor();
  renderDisplay();
});

document.getElementById('cfg-station').addEventListener('input', (e) => {
  state.station = e.target.value;
});

document.getElementById('cfg-mode').addEventListener('change', (e) => {
  state.mode = e.target.value;
});

document.getElementById('cfg-note-active').addEventListener('change', (e) => {
  state.noteActive = e.target.checked;
  renderDisplay();
});

document.getElementById('cfg-note-text').addEventListener('input', (e) => {
  state.noteText = e.target.value;
  renderDisplay();
});

document.getElementById('btn-add-train').addEventListener('click', () => {
  if (state.trains.length >= 3) return;
  state.trains.push({
    line: 'RE 1',
    time: '13:17',
    destination: 'Zielbahnhof',
    via: 'Zwischenhalt 1 – Zwischenhalt 2 – Zwischenhalt 3',
    wagen: ['engine-left', 'wide-second'],
    sectors: ['A', 'B', 'C']
  });
  renderEditor();
  renderDisplay();
});

document.getElementById('btn-collapse').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('collapsed');
});

document.getElementById('btn-fullscreen').addEventListener('click', () => {
  document.body.classList.toggle('fullscreen');
});

document.getElementById('btn-export').addEventListener('click', () => {
  html2canvas(document.getElementById('display-shell'), { backgroundColor: '#0f141b', scale: 2 }).then(canvas => {
    const a = document.createElement('a');
    a.download = 'db-zim-generator.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.body.classList.remove('fullscreen');
});

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function escapeAttr(str) {
  return escapeHtml(str);
}

renderEditor();
renderDisplay();
