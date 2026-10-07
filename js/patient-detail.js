// 患者资料（本次病例）：模块完成状态取自病例草稿，完成后整体提交。
const draft = FmsCase.load();
let prefill = {};
try { prefill = JSON.parse(sessionStorage.getItem('fms_patient_prefill') || '{}'); } catch {}
// 查重信息只在属于当前病例的患者时使用
if ((prefill.entered?.cardNo || '') !== (draft.jbxx.idCard || '')) prefill = {};
const q = new URLSearchParams(location.search);
const n = draft.jbxx.name || prefill.patient?.name || prefill.entered?.name || q.get('name') || '待填写患者';
const code = prefill.patient?.researchNo || prefill.patient?.patientNo || q.get('code') || '待分配';
pname.textContent = n; pid.textContent = '研究编号 ' + code; avatar.textContent = n.slice(-1);

// 随访：同一患者下的新病例，不含基本信息模块；显示可修改的随访日期
const isFollowUp = draft.visitType === '随诊';
// 从随访记录进入（新增随诊或打开已有记录）的，完成后回随访记录；新增患者的回患者列表
const fromFollowUp = sessionStorage.getItem('fms_case_from') === 'followup';
const backUrl = (isFollowUp || fromFollowUp) && draft.patientId != null
  ? './follow-up-list.html?' + new URLSearchParams({ patientId: draft.patientId ?? '', name: draft.jbxx.name || '', cardno: draft.jbxx.idCard || '' })
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
  location.href = './follow-up-list.html?' + new URLSearchParams({ patientId: draft.patientId, name: draft.jbxx.name || '', cardno: draft.jbxx.idCard || '' });
};

// 查看已有记录：回到这一页即恢复只读；点模块进入只读页，在模块页点「编辑」只放开那一个模块
const viewing = FmsCase.isViewingRecord();
if (viewing) {
  FmsCase.setMode('view');
  document.title = isFollowUp ? '随诊记录' : '基线访问';
  visitDate.disabled = true;
}

const modules = [...document.querySelectorAll('.module[data-part]')];
let done = 0;
modules.forEach(m => {
  // 已保存且已成功提交到后端才算完成；本地有未提交的改动时显示「待同步」
  const saved = !!(draft[m.dataset.part] && draft[m.dataset.part].finish);
  const finished = saved && FmsCase.isSynced(m.dataset.part);
  if (finished) done++;
  const state = m.querySelector('.state');
  state.classList.toggle('done', finished);
  state.textContent = finished ? '✓' : '○';
  if (saved && !finished) state.title = '有改动尚未提交，点击完成录入时会自动提交';
});
// 病情评估：9 个量表边填边暂存在草稿里；未全部完成（或有未提交改动）时显示已完成量表数 x/9
{
  const m = modules.find(x => x.dataset.part === 'bqpg');
  const p = draft.bqpg || {};
  const scales = FmsCase.BQPG_SCALES;
  const doneN = scales.filter(k => p[k] && p[k].finish).length;
  const started = scales.some(k => p[k] && (p[k].finish || Number(p[k].answered) > 0));
  const state = m && m.querySelector('.state');
  if (state && started && !state.classList.contains('done')) {
    state.textContent = doneN + '/' + scales.length;
    state.classList.add('partial');
    state.title = doneN === scales.length ? '9 个量表已填完，有改动尚未提交' : '已完成 ' + doneN + ' 个量表，共 ' + scales.length + ' 个';
    state.style.cssText = 'width:auto;min-width:28px;padding:0 4px;font-size:11px;background:#fff4e5;color:#b26a00;font-weight:600';
    const desc = m.querySelector('.mdesc');
    if (desc) desc.textContent = '已完成 ' + doneN + '/' + scales.length + ' 个量表';
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
