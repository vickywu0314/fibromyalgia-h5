<template>
  <main>
    <div class="searchbox">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      <input v-model.trim="keyword" placeholder="请输入患者姓名进行搜索..." autocomplete="off" @keyup.enter="loadPatients" />
    </div>

    <div v-if="loading" class="empty">正在加载患者列表...</div>
    <div v-else-if="error" class="state-card error-card">
      <strong>患者列表请求失败</strong>
      <div>{{ error }}</div>
      <button class="retry" @click="loadPatients">重新请求</button>
    </div>
    <div v-else-if="!patients.length" class="empty">{{ keyword ? '没有找到匹配的患者' : '暂无患者资料，可点击下方按钮新增' }}</div>

    <div v-else class="list">
      <button v-for="patient in patients" :key="patient.id ?? patient.patientId ?? patient.name" class="card patient-row" @click="openPatient(patient)">
        <div class="rowtop"><div class="name">{{ patient.name || patient.patientName || '未命名患者' }}</div><div class="chev">›</div></div>
        <div class="meta">
          <span>{{ lastRecordText(patient) }}</span>
          <span>{{ recordCountText(patient) }}</span>
        </div>
      </button>
    </div>
  </main>

  <div class="fabbar"><button class="primary" @click="addPatient">新增患者资料</button></div>
  <div v-if="toast" class="toast show">{{ toast }}</div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getDoctorId, isNativeApp, login } from '../native/bridge'
import { getPatientList } from '../api/patient'

const router = useRouter()
const patients = ref([])
const keyword = ref('')
const loading = ref(false)
const error = ref('')
const toast = ref('')

function showToast(text) {
  toast.value = text
  window.setTimeout(() => (toast.value = ''), 1600)
}

function extractList(response) {
  const data = response?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.records)) return data.records
  if (Array.isArray(response?.list)) return response.list
  if (Array.isArray(response?.records)) return response.records
  return []
}

async function loadPatients() {
  const doctorId = getDoctorId()
  if (!doctorId) {
    error.value = '没有取得医生 ID。请在问问风湿 App 内打开，或在开发环境配置 VITE_DEV_DOCTOR_ID。'
    if (isNativeApp()) login()
    return
  }

  loading.value = true
  error.value = ''
  try {
    const response = await getPatientList({ doctorId, keyword: keyword.value, pageNo: 1, pageSize: 100 })
    // 当前先允许 success:false 进入空列表，不阻塞新增入口。
    patients.value = response?.success === false ? [] : extractList(response)
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || '请求服务器失败'
    patients.value = []
    console.error('[FMS] patient/list failed', err)
  } finally {
    loading.value = false
  }
}

function lastRecordText(p) {
  const date = p.lastRecordTime || p.lastAddTime || p.lastFollowTime || p.updateTime || p.updatedAt
  return date ? `上次新增记录时间：${String(date).slice(0, 10)}` : '暂无新增记录时间'
}
function recordCountText(p) {
  const count = p.recordCount ?? p.followCount ?? p.followUpCount ?? p.count
  return count === undefined || count === null ? '' : `已添加${count}条`
}
function openPatient(p) {
  const id = p.id ?? p.patientId ?? ''
  router.push({ name: 'patient-detail', query: { ...(id ? { id } : {}), name: p.name || p.patientName || '' } })
}
function addPatient() { router.push('/patients/add') }

onMounted(loadPatients)
</script>
