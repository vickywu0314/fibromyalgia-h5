const searchInput = document.getElementById('search');
document.getElementById('addPatient').onclick = () => { location.href = './patient-add.html'; };

function patientRow(patient) {
  const button = document.createElement('button');
  button.className = 'card patient-row';
  button.innerHTML = '<div class="rowtop"><div class="name"></div><div class="chev">›</div></div><div class="meta"><span></span><span></span></div>';
  button.querySelector('.name').textContent = patient.name;
  button.querySelector('.meta span').textContent = patient.lastFollowUpDate ? '上次新增记录时间：' + patient.lastFollowUpDate : '暂无新增记录';
  button.querySelector('.meta span:last-child').textContent = `已添加${patient.followUpCount}条`;
  button.onclick = () => {
    location.href = './follow-up-list.html?' + new URLSearchParams({ id: patient.id ?? '', name: patient.name });
  };
  return button;
}

const patientList = PagedList({
  list: document.getElementById('patientList'),
  footer: document.getElementById('listFooter'),
  empty: document.getElementById('empty'),
  precheck: () => FmsApi.getDoctorId() ? '' : '未取得医生身份，请在 App 内打开',
  async fetchPage(pageNo) {
    const doctorId = FmsApi.getDoctorId();
    // 第 1 页优先使用研究平台入口预取的数据。
    const page = (pageNo === 1 && FmsApi.takePatientListPrefetch(doctorId)) || await FmsApi.fetchPatientList(doctorId, pageNo);
    return { items: page.patients, hasMore: page.hasMore };
  },
  renderItem: patientRow,
  // 接口没有姓名搜索参数，搜索在已加载的患者里按姓名本地过滤；继续上拉会加载更多页参与过滤。
  filter(items) {
    const keyword = searchInput.value.trim();
    return keyword ? items.filter(p => p.name.includes(keyword)) : items;
  },
  emptyText: () => searchInput.value.trim() ? '没有找到匹配的患者' : '暂无患者资料，可点击下方按钮新增'
});
searchInput.oninput = patientList.refresh;
patientList.reload();
