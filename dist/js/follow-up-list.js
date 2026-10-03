const params = new URLSearchParams(location.search);
const patientId = (params.get('id') || '').trim();
const displayName = params.get('name') || '患者';
document.getElementById('patientName').textContent = '当前患者：' + displayName;

const toast = document.getElementById('toast');
function tip(t) { toast.textContent = t; toast.classList.add('show'); clearTimeout(window.tt); window.tt = setTimeout(() => toast.classList.remove('show'), 1500); }

function visitRow(visit) {
  const button = document.createElement('button');
  button.className = 'card visit-card';
  button.innerHTML = '<div><div class="visit-label">随访日期</div><div class="visit-date"></div></div><div class="chev">›</div>';
  button.querySelector('.visit-date').textContent = visit.followUpDate || '日期未填写';
  // 随访详情页尚未接入，先带上随诊 ID 提示。
  button.onclick = () => tip(displayName + ' · ' + (visit.followUpDate || '随访') + ' 随访记录');
  button.dataset.id = visit.id ?? '';
  return button;
}

PagedList({
  list: document.getElementById('visits'),
  footer: document.getElementById('listFooter'),
  empty: document.getElementById('empty'),
  precheck() {
    if (!patientId) return '缺少患者信息，请从患者列表进入';
    return FmsApi.getDoctorId() ? '' : '未取得医生身份，请在 App 内打开';
  },
  async fetchPage(pageNo) {
    const page = await FmsApi.fetchFollowUpList(FmsApi.getDoctorId(), patientId, pageNo);
    return { items: page.followUps, hasMore: page.hasMore };
  },
  renderItem: visitRow,
  // 后端按随访日期倒序返回；前端对已加载数据再按日期倒序（同日按 id 倒序）兜底。
  sort: (a, b) => (b.sortTime - a.sortTime) || (Number(b.id) || 0) - (Number(a.id) || 0),
  emptyText: () => '暂无随访记录，可点击下方按钮新增'
}).reload();

document.getElementById('addVisit').onclick = () => tip('为 ' + displayName + ' 新增随访记录');
