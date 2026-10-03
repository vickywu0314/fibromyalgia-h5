// 录入开始：一次随诊的各录入模块入口。从随诊列表进入，URL 参数 patientId、followUpId、name、date。
const params = new URLSearchParams(location.search);
const context = {
  patientId: params.get('patientId') || '',
  followUpId: params.get('followUpId') || ''
};
const displayName = params.get('name') || '患者';
const date = params.get('date') || '';
document.getElementById('visitContext').textContent = '当前患者：' + displayName + (date ? ' · 随访日期 ' + date : '');

const toast = document.getElementById('toast');
function tip(t) { toast.textContent = t; toast.classList.add('show'); clearTimeout(window.tt); window.tt = setTimeout(() => toast.classList.remove('show'), 1500); }

// 各模块页带上患者 ID 和随诊 ID。
const query = new URLSearchParams(context).toString();
document.querySelectorAll('.module[data-href]').forEach(link => { link.href = link.dataset.href + '?' + query; });
document.getElementById('viewRecord').onclick = () => tip('随诊病历页面尚未接入');
