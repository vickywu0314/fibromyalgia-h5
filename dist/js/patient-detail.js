// 患者资料（本次病例）：模块完成状态取自病例草稿，完成后整体提交。
const draft = FmsCase.load();
let prefill = {};
try { prefill = JSON.parse(sessionStorage.getItem('fms_patient_prefill') || '{}'); } catch {}
// 查重信息只在属于当前病例的患者时使用
if ((prefill.entered?.cardNo || '') !== (draft.jbxx.idCard || '')) prefill = {};
const q = new URLSearchParams(location.search);
const n = draft.jbxx.name || prefill.patient?.name || prefill.entered?.name || q.get('name') || '待填写患者';
// 研究编号：后端字段 researchNo（病例详情 / 患者列表 / 查重结果返回），还没有时显示「待分配」
const code = draft.researchNo || prefill.patient?.researchNo || prefill.patient?.patientNo || q.get('code') || '待分配';
pname.textContent = n; pid.textContent = '研究编号 ' + code; avatar.textContent = n.slice(-1);

// 随访：同一患者下的新病例，不含基本信息模块；显示可修改的随访日期
const isFollowUp = draft.visitType === '随诊';
// 从随访记录进入（新增随诊或打开已有记录）的，完成后回随访记录；新增患者的回患者列表
const fromFollowUp = sessionStorage.getItem('fms_case_from') === 'followup';
const backUrl = (isFollowUp || fromFollowUp) && draft.patientId != null
  ? './follow-up-list.html?' + new URLSearchParams({ patientId: draft.patientId ?? '', name: draft.jbxx.name || '', cardno: draft.jbxx.idCard || '', researchNo: draft.researchNo || '' })
  : './patient-list.html';
if (isFollowUp) {
  document.title = '新增随访记录';
  baseGroup.remove();
  visitDateCard.hidden = false;
  visitDate.value = draft.visitDate || '';
  visitDate.onchange = () => { FmsCase.set('visitDate', visitDate.value); };
}
document.getElementById('history').onclick = () => {
  if (draft.patientId == null) { FmsCase.toast('保存基本信息后可查看随访记录'); return; }
  location.href = './follow-up-list.html?' + new URLSearchParams({ patientId: draft.patientId, name: draft.jbxx.name || '', cardno: draft.jbxx.idCard || '', researchNo: draft.researchNo || '' });
};

// 查看已有记录：回到这一页即恢复只读；点模块进入只读页，在模块页点「编辑」只放开那一个模块
const viewing = FmsCase.isViewingRecord();
if (viewing) {
  FmsCase.setMode('view');
  document.title = isFollowUp ? '随诊记录' : '基线访问';
  visitDate.disabled = true;
}

// 载入上次随访：仅新增/编辑随诊时（非查看记录），且该患者此前已有随诊记录（即第二次及以上随访）才显示
const PREFILL_PARTS = ['bsbq', 'zhpd', 'fzjc', 'bqpg', 'zlfa', 'blsj'];
if (isFollowUp && !viewing && draft.patientId != null) (async () => {
  try {
    const doctorId = FmsApi.getDoctorId();
    if (!doctorId) return;
    const result = await FmsApi.get('/api/fms/patient/followup/list', { pageNo: 1, pageSize: 100, patientId: draft.patientId, doctorId, researchType: 12 });
    const d = result && result.data;
    const rows = [d, d?.list, d?.records, d?.rows, result?.list].find(Array.isArray) || [];
    const pickV = (o, keys) => { for (const k of keys) if (o && o[k] != null && o[k] !== '') return o[k]; return ''; };
    const idOf = r => pickV(r, ['caseId', 'id', 'followupId']);
    const dateOf = r => String(pickV(r, ['visitDate', 'followupDate', 'followUpDate', 'createTime', 'createdAt'])).slice(0, 10);
    const cmp = (a, b) => dateOf(a).localeCompare(dateOf(b)) || String(idOf(a)).localeCompare(String(idOf(b)), undefined, { numeric: true });
    const sorted = rows.slice().sort(cmp);
    const baselineId = sorted.length ? String(idOf(sorted[0])) : '';
    // 与随访记录页一致：最早一条为基线，其余为随诊（后端返回 visitType 时以后端为准）
    const visits = sorted.filter(r => (pickV(r, ['visitType']) || (String(idOf(r)) === baselineId ? '基线' : '随诊')) === '随诊' && String(idOf(r)) !== String(draft.id ?? ''));
    if (!visits.length) return;
    const cur = draft.visitDate || '';
    const prev = visits.filter(r => !cur || !dateOf(r) || dateOf(r) <= cur).pop() || visits[visits.length - 1];
    prefillBar.hidden = false;
    loadPrev.onclick = async () => {
      const cur = FmsCase.load();
      const filled = PREFILL_PARTS.some(p => FmsCase.hasData(Object.assign({}, cur[p], { finish: undefined })));
      if (filled && !confirm('载入后将用上次随访（' + (dateOf(prev) || '') + '）的内容覆盖本次已填写的内容，确定载入吗？')) return;
      loadPrev.disabled = true; loadPrev.textContent = '正在载入…';
      try {
        const c = await FmsCase.fetchCase({ caseId: idOf(prev), patientId: draft.patientId });
        FmsCase.prefillFrom(c, PREFILL_PARTS);
        location.reload();
      } catch (e) {
        FmsCase.toast(e.message || '上次随访加载失败');
        loadPrev.disabled = false; loadPrev.textContent = '载入上次随访';
      }
    };
  } catch (e) { /* 列表取不到时不显示按钮 */ }
})();
// 提示条：停留到保存为止，或载入 60 秒后自动收起，撤回按钮随之消失
{
  const left = viewing ? 0 : FmsCase.prefillUndoLeft();
  if (left > 0) {
    prefillTip.hidden = false;
    const timer = setTimeout(() => { prefillTip.hidden = true; }, left);
    undoPrefill.onclick = () => {
      clearTimeout(timer);
      if (FmsCase.undoPrefill()) { FmsCase.toast('已撤回'); setTimeout(() => location.reload(), 300); }
      else { prefillTip.hidden = true; FmsCase.toast('已超过可撤回时间'); }
    };
  }
}

const modules = [...document.querySelectorAll('.module[data-part]')];
let done = 0;
// 预填字段（新增患者 / 随诊时自动带入）不算医生已经开始填写
const PREFILLED = { jbxx: ['visitDate', 'name', 'idCard', 'gender'] };
function startedPart(part) {
  const v = draft[part];
  if (!v || typeof v !== 'object') return false;
  const skip = PREFILLED[part] || [];
  return Object.keys(v).some(k => k !== 'finish' && skip.indexOf(k) === -1 && FmsCase.hasData(v[k]));
}
function badge(state, text, title, tone) {
  state.textContent = text;
  state.title = title || '';
  state.classList.add('partial');
  state.style.cssText = 'width:auto;min-width:28px;padding:0 5px;font-size:11px;font-weight:600;' +
    (tone === 'sync' ? 'background:#eaf1fd;color:#1257c4' : 'background:#fff4e5;color:#b26a00');
}
modules.forEach(m => {
  // 状态：未填写 ○ / 填写中（有内容未保存）/ 待提交（已保存但未同步到后端）/ 已完成 ✓
  const part = m.dataset.part;
  const saved = !!(draft[part] && draft[part].finish);
  const finished = saved && FmsCase.isSynced(part);
  if (finished) done++;
  const state = m.querySelector('.state');
  state.classList.toggle('done', finished);
  state.textContent = finished ? '✓' : '○';
  state.title = finished ? '已完成' : '未填写';
  if (saved && !finished) badge(state, '待提交', '已保存，有改动尚未提交，点击完成录入时会自动提交', 'sync');
  else if (!saved && startedPart(part)) badge(state, '填写中', '已填写部分内容，尚未保存');
});
// 病情评估：CSI / TPC / FS + 10 个量表共 13 项（都在 bqpg 下），边填边暂存；未全部完成（或有未提交改动）时显示已完成数 x/10（选填的 TPC / painDETECT / PROMIS-29+2 不计入）
{
  const m = modules.find(x => x.dataset.part === 'bqpg');
  const p = draft.bqpg || {};
  // 只统计必填项（TPC / painDETECT / PROMIS-29+2 选填，不计入 x/10）
  const scales = FmsCase.BQPG_REQUIRED;
  const doneN = scales.filter(k => p[k] && p[k].finish).length;
  const started = FmsCase.BQPG_ALL.some(k => p[k] && (p[k].finish || Number(p[k].answered) > 0 || (FmsCase.BQPG_EXTRA.includes(k) && FmsCase.hasData(p[k]))));
  const state = m && m.querySelector('.state');
  if (state && started && !state.classList.contains('done') && !(p.finish && !FmsCase.isSynced('bqpg'))) {
    state.textContent = doneN + '/' + scales.length;
    state.classList.add('partial');
    state.title = doneN === scales.length ? scales.length + ' 项已填完，有改动尚未提交' : '已完成 ' + doneN + ' 项，共 ' + scales.length + ' 项';
    state.style.cssText = 'width:auto;min-width:28px;padding:0 4px;font-size:11px;background:#fff4e5;color:#b26a00;font-weight:600';
    const desc = m.querySelector('.mdesc');
    if (desc) desc.textContent = '已完成 ' + doneN + '/' + scales.length + ' 项';
  }
}
// 从模块页返回时若命中浏览器页面缓存（bfcache），重新加载以刷新各模块完成状态
window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });
progressNum.textContent = done + ' / ' + modules.length;
progressBar.style.width = (done / modules.length * 100).toFixed(1) + '%';

if (viewing) {
  // 底部按钮改为「查看随诊病历」：把本次记录各模块的数据汇总到一个只读页面
  finishBtn.textContent = isFollowUp ? '查看随诊病历' : '查看病历';
  finishBtn.onclick = () => { location.href = './case-view.html'; };
} else finishBtn.onclick = async () => {
  const missing = modules.filter(m => !(draft[m.dataset.part] && draft[m.dataset.part].finish))
    .map(m => FmsCase.PART_NAMES[m.dataset.part]);
  if (missing.length && !confirm('以下模块尚未完成：\n' + missing.join('、') + '\n\n确定提交本次资料吗？')) return;
  finishBtn.disabled = true;
  finishBtn.textContent = '正在提交…';
  try {
    // 按模块逐个提交（part 为各模块 key），不再使用汇总的 part
    await FmsCase.syncAll((i, total) => { finishBtn.textContent = '正在提交 ' + i + '/' + total + '…'; });
    FmsCase.clear();
    sessionStorage.removeItem('fms_patient_prefill');
    FmsCase.toast('本次资料已提交');
    setTimeout(() => { location.href = backUrl; }, 600);
  } catch (e) {
    FmsCase.toast(e.message || '提交失败，请稍后重试');
    finishBtn.disabled = false;
    finishBtn.textContent = '完成本次资料录入';
  }
};
