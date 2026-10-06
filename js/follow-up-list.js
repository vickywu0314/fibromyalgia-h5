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
      const card = document.createElement('div');
      card.className = 'card visit-card';
      card.innerHTML = '<div><div class="visit-label"></div><div class="visit-date"></div></div><button class="visit-del" type="button">删除</button><div class="chev">›</div>';
      card.querySelector('.visit-label').textContent = type === '基线' ? '基线访问' : '随诊日期';
      card.querySelector('.visit-date').textContent = dateOf(r) || '未填写日期';
      card.onclick = () => openCase(id, type, dateOf(r));
      card.querySelector('.visit-del').onclick = e => { e.stopPropagation(); removeCase(id, type); };
      return card;
    }));
  } catch (error) {
    showEmpty(error.name === 'AbortError' ? '请求超时，可下拉刷新重试' : error.message);
  }
}

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
