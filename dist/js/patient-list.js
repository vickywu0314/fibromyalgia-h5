const list = document.getElementById('patientList');
const empty = document.getElementById('empty');
const searchInput = document.getElementById('search');
let requestId = 0;
document.getElementById('addPatient').onclick = () => { location.href = './patient-add.html'; };
function showState(message) {
  list.replaceChildren();
  empty.textContent = message;
  empty.style.display = 'block';
}
async function loadPatients() {
  const current = ++requestId;
  showState('正在加载患者列表...');
  try {
    const doctorId = FmsApi.getDoctorId();
    if (!doctorId) throw new Error('未取得医生身份，请在 App 内打开');
    const result = await FmsApi.get('/api/fms/patient/list', {
      pageNo: 1, pageSize: 100, doctorId, keyword: searchInput.value.trim(), researchType: 12
    });
    if (current !== requestId) return;
    const data = result.data;
    const rows = result.success === false ? [] : [data, data?.list, data?.records, result.list, result.records].find(Array.isArray) || [];
    showState(searchInput.value.trim() ? '没有找到匹配的患者' : '暂无患者资料，可点击下方按钮新增');
    if (!rows.length) return;
    empty.style.display = 'none';
    for (const patient of rows) {
      const button = document.createElement('button');
      button.className = 'card patient-row';
      button.innerHTML = '<div class="rowtop"><div class="name"></div><div class="chev">›</div></div><div class="meta"><span></span><span></span></div>';
      const name = patient.name || patient.patientName || '未命名患者';
      button.querySelector('.name').textContent = name;
      const date = patient.lastRecordTime || patient.lastAddTime || patient.lastFollowTime || patient.updateTime || patient.updatedAt;
      button.querySelector('.meta span').textContent = date ? '上次新增记录时间：' + String(date).slice(0, 10) : '暂无新增记录时间';
      const count = patient.recordCount ?? patient.followCount ?? patient.followUpCount ?? patient.count;
      button.querySelector('.meta span:last-child').textContent = count == null ? '' : `已添加${count}条`;
      // 随访记录挂在患者下：带上患者 id、姓名、身份证号
      const pid = patient.id ?? patient.patientId ?? '';
      const cardNo = patient.cardno || patient.cardNo || patient.idCard || '';
      button.onclick = () => {
        location.href = './follow-up-list.html?' + new URLSearchParams({ patientId: pid, name, cardno: cardNo });
      };
      list.append(button);
    }
  } catch (error) {
    if (current !== requestId) return;
    showState(error.name === 'AbortError' ? '请求超时，可点击重试' : error.message);
    const retry = document.createElement('button');
    retry.textContent = '重新加载';
    retry.onclick = loadPatients;
    empty.append(document.createElement('br'), retry);
  }
}
let searchTimer;
searchInput.oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadPatients, 300); };
searchInput.onkeydown = event => { if (event.key === 'Enter') { clearTimeout(searchTimer); loadPatients(); } };
loadPatients();
