// 随访记录：挂在患者（patientId）下。第一条记录为基线访问，之后为随诊。
// 列表：GET /api/fms/patient/followup/list；打开：GET /api/fms/patient/case/detail；删除：GET /api/fms/patient/del/followuphistory
const params = new URLSearchParams(location.search);
const name = params.get('name') || '患者';
const patientId = params.get('patientId') || '';
const cardno = params.get('cardno') || '';
patientName.textContent = '当前患者：' + name;
const listEl = document.getElementById('visits');
const emptyEl = document.getElementById('empty');

function showEmpty(text) {
  listEl.replaceChildren();
  emptyEl.textContent = text;
  emptyEl.style.display = 'block';
}

// 后端字段名未定时的兼容取值
const pick = (o, keys) => { for (const k of keys) if (o && o[k] != null && o[k] !== '') return o[k]; return ''; };
const caseIdOf = r => pick(r, ['caseId', 'id', 'followupId']);
const dateOf = r => String(pick(r, ['visitDate', 'followupDate', 'followUpDate', 'createTime', 'createdAt'])).slice(0, 10);

async function loadList() {
  if (!patientId) { showEmpty('缺少患者 id，请从患者列表进入'); return; }
  showEmpty('正在加载随访记录…');
  try {
    const doctorId = FmsApi.getDoctorId();
    if (!doctorId) throw new Error('未取得医生身份，请在 App 内打开');
    const result = await FmsApi.get('/api/fms/patient/followup/list', { pageNo: 1, pageSize: 100, patientId, doctorId, researchType: 12 });
    if (result.success === false) throw new Error(result.message || '随访记录加载失败');
    const d = result.data;
    const rows = [d, d?.list, d?.records, d?.rows, result.list].find(Array.isArray) || [];
    if (!rows.length) { showEmpty('暂无随访记录，可点击下方按钮新增'); return; }
    emptyEl.style.display = 'none';
    // 第一条记录（日期最早）为基线访问，之后为随诊；后端若返回 visitType 则以后端为准
    const sorted = rows.slice().sort((a, b) => dateOf(a).localeCompare(dateOf(b)) || String(caseIdOf(a)).localeCompare(String(caseIdOf(b)), undefined, { numeric: true }));
    const baselineId = String(caseIdOf(sorted[0]));
    listEl.replaceChildren(...sorted.reverse().map(r => {
      const id = caseIdOf(r);
      const type = pick(r, ['visitType']) || (String(id) === baselineId ? '基线' : '随诊');
      const row = document.createElement('div');
      row.className = 'swipe-row';
      row.innerHTML = '<button class="swipe-del" type="button">删除</button><div class="card visit-card"><div><div class="visit-label"></div><div class="visit-date"></div></div><div class="chev">›</div></div>';
      const card = row.querySelector('.visit-card');
      card.querySelector('.visit-label').textContent = type === '基线' ? '基线访问' : '随诊日期';
      card.querySelector('.visit-date').textContent = dateOf(r) || '未填写日期';
      card.onclick = () => { if (Date.now() - swipedAt < 400) return; if (row.classList.contains('open')) { closeSwipe(); return; } openCase(id, type, dateOf(r)); };
      row.querySelector('.swipe-del').onclick = e => { e.stopPropagation(); closeSwipe(); removeCase(id, type); };
      bindSwipe(row, card);
      return row;
    }));
  } catch (error) {
    showEmpty(error.name === 'AbortError' ? '请求超时，可下拉刷新重试' : error.message);
  }
}

// 向左滑动露出「删除」（抽屉样式），同一时间只展开一条
const DEL_W = 80;
let openRow = null, swipedAt = 0;
function setX(card, x, animate) {
  card.style.transition = animate ? 'transform .2s ease' : 'none';
  card.style.transform = x ? 'translateX(' + x + 'px)' : '';
}
// 收回动画结束后再隐藏红色按钮
function settle(row) { clearTimeout(row._t); row._t = setTimeout(() => row.classList.remove('moving'), 220); }
function closeSwipe() {
  if (!openRow) return;
  setX(openRow.querySelector('.visit-card'), 0, true);
  openRow.classList.remove('open');
  openRow.classList.add('moving');
  settle(openRow);
  openRow = null;
}
function bindSwipe(row, card) {
  let sx = 0, sy = 0, base = 0, dx = 0, dir = '';
  card.addEventListener('touchstart', e => {
    const t = e.touches[0];
    sx = t.clientX; sy = t.clientY; dx = 0; dir = '';
    base = row.classList.contains('open') ? -DEL_W : 0;
    if (openRow && openRow !== row) closeSwipe();
  }, { passive: true });
  card.addEventListener('touchmove', e => {
    const t = e.touches[0];
    const mx = t.clientX - sx, my = t.clientY - sy;
    if (!dir) { if (Math.abs(mx) < 6 && Math.abs(my) < 6) return; dir = Math.abs(mx) > Math.abs(my) ? 'x' : 'y'; }
    if (dir !== 'x') return;
    e.preventDefault();
    dx = mx;
    clearTimeout(row._t);
    row.classList.add('moving');
    setX(card, Math.max(-DEL_W - 20, Math.min(0, base + mx)), false);
  }, { passive: false });
  card.addEventListener('touchend', () => {
    if (dir !== 'x') return;
    settle(row);
    const open = base + dx < -DEL_W / 2;
    setX(card, open ? -DEL_W : 0, true);
    if (open) { row.classList.add('open'); openRow = row; } else { row.classList.remove('open'); if (openRow === row) openRow = null; }
    swipedAt = Date.now(); // 滑动结束后浏览器可能仍触发 click，短时间内忽略，避免误打开记录
  });
}
document.addEventListener('touchstart', e => { if (openRow && !openRow.contains(e.target)) closeSwipe(); }, { passive: true });

async function openCase(caseId, visitType, visitDate) {
  if (!caseId) { FmsCase.toast('记录缺少 id，无法打开'); return; }
  try {
    FmsCase.toast('正在加载…');
    sessionStorage.removeItem('fms_patient_prefill');
    sessionStorage.setItem('fms_case_from', 'followup');
    await FmsCase.loadCase({ caseId, patientId, visitType, visitDate, name, idCard: cardno });
    location.href = './patient-detail.html';
  } catch (error) {
    FmsCase.toast(error.name === 'AbortError' ? '加载超时，请稍后重试' : error.message);
  }
}

async function removeCase(id, type) {
  if (!confirm('确定删除这条' + (type === '基线' ? '基线访问' : '随诊') + '记录吗？删除后不可恢复。')) return;
  try {
    const result = await FmsApi.get('/api/fms/patient/del/followuphistory', { id });
    if (result.success === false || result.data === false) throw new Error(result.message || '删除失败');
    FmsCase.toast('已删除');
    loadList();
  } catch (error) {
    FmsCase.toast(error.message || '删除失败');
  }
}

addVisit.onclick = () => {
  if (!patientId) { FmsCase.toast('缺少患者 id，请从患者列表进入'); return; }
  sessionStorage.removeItem('fms_patient_prefill'); // 清掉上次新增患者的查重信息，避免显示别人的研究编号
  sessionStorage.setItem('fms_case_from', 'followup');
  FmsCase.startFollowUp({ patientId, name, idCard: cardno });
  location.href = './patient-detail.html';
};

loadList();
