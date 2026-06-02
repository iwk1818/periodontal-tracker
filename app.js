// Date
const d = new Date();
document.getElementById('dateLabel').textContent =
  d.getFullYear() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0');

let patients = [
  { id: 1, name: '患者A', bp: 10, bn: 15, pp: 5, pn: 5 },
  { id: 2, name: '患者B', bp: 80, bn: 90, pp: 6, pn: 9 },
  { id: 3, name: '患者C', bp: 12, bn: 21, pp: 5, pn: 6 },
];
let nextId = 4;

function switchTab(tab) {
  document.getElementById('tabInput').classList.toggle('active', tab === 'input');
  document.getElementById('tabResult').classList.toggle('active', tab === 'result');
  document.getElementById('inputSection').classList.toggle('active', tab === 'input');
  document.getElementById('resultSection').classList.toggle('active', tab === 'result');
}

function renderTable() {
  const body = document.getElementById('patientBody');
  body.innerHTML = patients.map(p => `
    <tr id="row-${p.id}">
      <td><input class="name-input" value="${p.name}" placeholder="患者名" oninput="upd(${p.id},'name',this.value)" aria-label="患者名"></td>
      <td class="col-sep"><input class="num-input" type="number" min="0" max="100" step="1" value="${p.bp}" oninput="upd(${p.id},'bp',this.value)" aria-label="BOP前回"><span class="unit">%</span></td>
      <td><input class="num-input" type="number" min="0" max="100" step="1" value="${p.bn}" oninput="upd(${p.id},'bn',this.value)" aria-label="BOP今回"><span class="unit">%</span></td>
      <td class="col-sep"><input class="num-input" type="number" min="0" max="20" step="0.5" value="${p.pp}" oninput="upd(${p.id},'pp',this.value)" aria-label="PPD前回"><span class="unit">mm</span></td>
      <td><input class="num-input" type="number" min="0" max="20" step="0.5" value="${p.pn}" oninput="upd(${p.id},'pn',this.value)" aria-label="PPD今回"><span class="unit">mm</span></td>
      <td><button class="del-btn" onclick="del(${p.id})" aria-label="削除" title="削除">✕</button></td>
    </tr>
  `).join('');
}

function upd(id, field, val) {
  const p = patients.find(x => x.id === id);
  if (!p) return;
  p[field] = field === 'name' ? val : (parseFloat(val) || 0);
}

function addPatient() {
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const name = '患者' + (labels[patients.length] || (patients.length + 1));
  patients.push({ id: nextId++, name, bp: 0, bn: 0, pp: 0, pn: 0 });
  renderTable();
}

function del(id) {
  patients = patients.filter(x => x.id !== id);
  renderTable();
}

function syncFromDOM() {
  patients.forEach(p => {
    const row = document.getElementById('row-' + p.id);
    if (!row) return;
    const ins = row.querySelectorAll('input');
    p.name = ins[0].value;
    p.bp = parseFloat(ins[1].value) || 0;
    p.bn = parseFloat(ins[2].value) || 0;
    p.pp = parseFloat(ins[3].value) || 0;
    p.pn = parseFloat(ins[4].value) || 0;
  });
}

function classify(p) {
  const bd = p.bn - p.bp;
  const pd = p.pn - p.pp;
  if (bd > 10 || pd >= 2) return 'critical';
  if (bd > 0 || pd > 0) return 'warning';
  return 'ok';
}

function fmt(v, unit) {
  const n = parseFloat(v);
  return Number.isInteger(n) ? n + unit : n.toFixed(1) + unit;
}

function fmtDiff(d, unit) {
  if (d === 0) return '変化なし';
  const s = d > 0 ? '+' : '';
  return s + (Number.isInteger(d) ? d : d.toFixed(1)) + unit;
}

function runAnalysis() {
  syncFromDOM();
  const order = { critical: 0, warning: 1, ok: 2 };
  const sorted = [...patients].sort((a, b) => order[classify(a)] - order[classify(b)]);

  let crit = 0, warn = 0, ok = 0;
  const cards = sorted.map((p, i) => {
    const cls = classify(p);
    if (cls === 'critical') crit++;
    else if (cls === 'warning') warn++;
    else ok++;

    const bd = p.bn - p.bp;
    const pd = p.pn - p.pp;
    const bDir = bd > 0 ? 'up' : bd < 0 ? 'down' : 'flat';
    const pDir = pd > 0 ? 'up' : pd < 0 ? 'down' : 'flat';
    const badgeMap = { critical: 'badge-critical', warning: 'badge-warning', ok: 'badge-ok' };
    const badgeTxt = { critical: '要注意', warning: '軽度悪化', ok: '安定' };

    return `
      <div class="result-card ${cls}" style="animation-delay:${i * 0.06}s">
        <div>
          <div class="rc-name">${p.name}</div>
          <div class="rc-metrics">
            <div class="rc-metric">
              <div class="rc-metric-label">BOP</div>
              <div class="rc-vals">
                <span class="rc-prev">${fmt(p.bp,'%')}</span>
                <span class="rc-arr">→</span>
                <span class="rc-now ${bDir}">${fmt(p.bn,'%')}</span>
              </div>
              <div class="rc-diff ${bDir}">${fmtDiff(bd,'%')}</div>
            </div>
            <div class="rc-metric">
              <div class="rc-metric-label">最深 PPD</div>
              <div class="rc-vals">
                <span class="rc-prev">${fmt(p.pp,'mm')}</span>
                <span class="rc-arr">→</span>
                <span class="rc-now ${pDir}">${fmt(p.pn,'mm')}</span>
              </div>
              <div class="rc-diff ${pDir}">${fmtDiff(pd,'mm')}</div>
            </div>
          </div>
        </div>
        <span class="badge ${badgeMap[cls]}">${badgeTxt[cls]}</span>
      </div>`;
  }).join('');

  document.getElementById('resultList').innerHTML = cards;
  document.getElementById('sumCritical').textContent = crit;
  document.getElementById('sumWarning').textContent = warn;
  document.getElementById('sumOk').textContent = ok;
  switchTab('result');
}

renderTable();
