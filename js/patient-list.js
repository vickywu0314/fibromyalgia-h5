const list = document.getElementById('patientList');
const empty = document.getElementById('empty');
const footer = document.getElementById('listFooter');
const searchInput = document.getElementById('search');
let patients = [];
let pageNo = 0;
let hasMore = false;
let loading = false;
let loadFailed = false;
let generation = 0;
document.getElementById('addPatient').onclick = () => { location.href = './patient-add.html'; };

function showState(message, retry) {
  list.replaceChildren();
  footer.style.display = 'none';
  empty.textContent = message;
  empty.style.display = 'block';
  if (retry) {
    const button = document.createElement('button');
    button.textContent = '重新加载';
    button.onclick = reload;
    empty.append(document.createElement('br'), button);
  }
}

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

function renderFooter() {
  footer.style.display = 'block';
  footer.onclick = null;
  if (loading) footer.textContent = '正在加载...';
  else if (loadFailed) { footer.textContent = '加载失败，点击重试'; footer.onclick = loadNextPage; }
  else if (hasMore) footer.textContent = '上拉加载更多';
  else footer.textContent = '没有更多了';
}

// 接口没有姓名搜索参数，搜索在已加载的患者里按姓名本地过滤；继续上拉会加载更多页参与过滤。
function render() {
  const keyword = searchInput.value.trim();
  const rows = keyword ? patients.filter(p => p.name.includes(keyword)) : patients;
  if (!rows.length && !hasMore && !loading) {
    return showState(keyword ? '没有找到匹配的患者' : '暂无患者资料，可点击下方按钮新增');
  }
  empty.style.display = 'none';
  list.replaceChildren(...rows.map(patientRow));
  renderFooter();
}

async function loadNextPage() {
  if (loading || (!hasMore && pageNo > 0)) return;
  const current = generation;
  const doctorId = FmsApi.getDoctorId();
  if (!doctorId) return showState('未取得医生身份，请在 App 内打开');
  loading = true; loadFailed = false;
  if (pageNo === 0) showState('正在加载患者列表...'); else renderFooter();
  try {
    const next = pageNo + 1;
    const page = (next === 1 && FmsApi.takePatientListPrefetch(doctorId)) || await FmsApi.fetchPatientList(doctorId, next);
    if (current !== generation) return;
    // 分页期间有新增患者时，后一页可能和前一页重复，按 id 去重。
    const seen = new Set(patients.map(p => p.id));
    patients = patients.concat(page.patients.filter(p => p.id == null || !seen.has(p.id)));
    pageNo = next;
    hasMore = page.hasMore;
    loading = false;
    render();
    fillViewport();
  } catch (error) {
    if (current !== generation) return;
    loading = false;
    const message = error.name === 'AbortError' ? '请求超时，可点击重试' : error.message;
    if (pageNo === 0) showState(message, true);
    else { loadFailed = true; renderFooter(); }
  }
}

// 第一页不足一屏时观察器不会再触发，主动继续加载。
function fillViewport() {
  if (hasMore && !loadFailed && footer.getBoundingClientRect().top < window.innerHeight + 200) loadNextPage();
}

function reload() {
  generation++;
  patients = []; pageNo = 0; hasMore = false; loading = false; loadFailed = false;
  loadNextPage();
}

new IntersectionObserver(entries => {
  if (entries.some(e => e.isIntersecting) && hasMore && !loadFailed) loadNextPage();
}, { rootMargin: '0px 0px 200px 0px' }).observe(footer);

searchInput.oninput = () => { render(); fillViewport(); };
loadNextPage();
