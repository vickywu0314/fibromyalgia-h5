const list = document.getElementById('patientList');
const empty = document.getElementById('empty');
const searchInput = document.getElementById('search');
let patients = [];
document.getElementById('addPatient').onclick = () => { location.href = './patient-add.html'; };
function showState(message) {
  list.replaceChildren();
  empty.textContent = message;
  empty.style.display = 'block';
}
// 接口没有姓名搜索参数，搜索在已取回的列表里按姓名本地过滤。
function render() {
  const keyword = searchInput.value.trim();
  const rows = keyword ? patients.filter(p => p.name.includes(keyword)) : patients;
  if (!rows.length) return showState(keyword ? '没有找到匹配的患者' : '暂无患者资料，可点击下方按钮新增');
  empty.style.display = 'none';
  list.replaceChildren(...rows.map(patient => {
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
  }));
}
async function loadPatients() {
  showState('正在加载患者列表...');
  try {
    const doctorId = FmsApi.getDoctorId();
    if (!doctorId) throw new Error('未取得医生身份，请在 App 内打开');
    const prefetched = FmsApi.takePatientListPrefetch(doctorId);
    patients = (prefetched || await FmsApi.fetchPatientList(doctorId)).patients;
    render();
  } catch (error) {
    showState(error.name === 'AbortError' ? '请求超时，可点击重试' : error.message);
    const retry = document.createElement('button');
    retry.textContent = '重新加载';
    retry.onclick = loadPatients;
    empty.append(document.createElement('br'), retry);
  }
}
searchInput.oninput = render;
loadPatients();
