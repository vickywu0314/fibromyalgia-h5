// 录入开始（查看某次随诊）：从随诊列表进入，URL 参数 patientId、followUpId、name、date。
// 点击模块先请求 /api/fms/patient/case/detail（parts=模块代码），带着数据跳到模块页查看模式。
const params = new URLSearchParams(location.search);
const patientId = params.get('patientId') || '';
const caseId = params.get('followUpId') || '';
const displayName = params.get('name') || '患者';
const date = params.get('date') || '';
document.getElementById('visitContext').textContent = '当前患者：' + displayName + (date ? ' · 随访日期 ' + date : '');

const toast = document.getElementById('toast');
function tip(t) { toast.textContent = t; toast.classList.add('show'); clearTimeout(window.tt); window.tt = setTimeout(() => toast.classList.remove('show'), 1500); }

let opening = false;
document.querySelectorAll('.module[data-href]').forEach(link => {
  const target = link.dataset.href + '?' + new URLSearchParams({ patientId, caseId, mode: 'view' });
  link.href = target;
  link.onclick = async event => {
    event.preventDefault();
    if (opening) return;
    if (!patientId || !caseId) return tip('缺少随诊信息，请从随访记录进入');
    opening = true;
    tip('正在加载...');
    // 预取失败也照常跳转，由模块页自行请求并提示错误。
    try { CaseView.savePrefetch(caseId, link.dataset.part, await CaseView.fetchPart(patientId, caseId, link.dataset.part)); } catch {}
    location.href = target;
    opening = false;
  };
});
document.getElementById('viewRecord').onclick = () => tip('随诊病历页面尚未接入');
