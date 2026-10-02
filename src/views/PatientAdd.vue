<template>
  <main>
    <div class="eyebrow">患者建档</div>
    <div class="lead">建立患者档案</div>
    <div class="sub">填写患者姓名与身份证号。系统会先检查患者是否已经存在，再进入资料录入。</div>

    <section class="card form-card">
      <div class="field">
        <label class="label" for="patient-name">患者姓名 <span class="req">*</span></label>
        <input
          id="patient-name"
          v-model.trim="name"
          class="input"
          :class="{ error: submitted && !name }"
          placeholder="请输入患者姓名"
          autocomplete="name"
          :disabled="checking"
        >
        <div v-if="submitted && !name" class="error-text visible">请输入患者姓名</div>
      </div>

      <div class="field">
        <label class="label" for="patient-cardno">身份证号 <span class="req">*</span></label>
        <input
          id="patient-cardno"
          v-model.trim="idNo"
          class="input"
          :class="{ error: submitted && !validID }"
          placeholder="请输入18位身份证号码"
          maxlength="18"
          inputmode="text"
          :disabled="checking"
        >
        <div class="hint">18 位身份证号：前 17 位为数字，最后 1 位为数字或 X。</div>
        <div v-if="submitted && !validID" class="error-text visible">身份证号码格式不正确</div>
      </div>
    </section>

    <section v-if="errorMessage" class="state-card error-card">
      <strong>暂时无法检查患者信息</strong>
      {{ errorMessage }}
    </section>
  </main>

  <div class="bottom">
    <button class="primary" :disabled="checking" @click="checkPatient">
      {{ checking ? '正在查询患者…' : '下一步' }}
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getPatientByCardNo } from '../api/patient'
import { getDoctorId, initLeftTitle, registerNativeBack } from '../native/bridge'

const PREFILL_KEY = 'fms_patient_prefill'
const router = useRouter()
const name = ref('')
const idNo = ref('')
const submitted = ref(false)
const checking = ref(false)
const errorMessage = ref('')

const validID = computed(() => /^\d{17}[\dXx]$/.test(idNo.value))

function savePrefill(data) {
  sessionStorage.setItem(PREFILL_KEY, JSON.stringify(data))
}

function goToPatientDetail(patient, existed) {
  // 完整资料保存在 sessionStorage，避免把身份证等敏感字段塞进 URL。
  savePrefill({
    existed,
    patient: patient || {},
    entered: {
      name: name.value,
      cardNo: idNo.value.toUpperCase()
    }
  })

  router.push({
    name: 'patient-detail',
    query: {
      name: patient?.name || name.value,
      id: patient?.id || patient?.patientId || '',
      code: patient?.researchNo || patient?.patientNo || '',
      existing: existed ? '1' : '0'
    }
  })
}

async function checkPatient() {
  submitted.value = true
  errorMessage.value = ''
  if (!name.value || !validID.value || checking.value) return

  const doctorId = getDoctorId()
  if (!doctorId) {
    errorMessage.value = '没有取得医生 ID，请在问风湿 App 内打开，或在开发环境配置 VITE_DEV_DOCTOR_ID。'
    return
  }

  checking.value = true
  try {
    const result = await getPatientByCardNo({
      name: name.value,
      cardno: idNo.value.toUpperCase(),
      doctorId
    })

    // 找到患者：把后端返回的完整资料保存下来，下一页后续可以直接预填。
    if (result?.success && result?.data && typeof result.data === 'object' && Object.keys(result.data).length) {
      goToPatientDetail(result.data, true)
      return
    }

    // 当前 FMS 数据库没有该患者：按新患者继续进入资料页。
    // 目前接口在“未找到”场景可能返回 success:false，因此这里不把它当作阻断错误。
    goToPatientDetail({}, false)
  } catch (error) {
    errorMessage.value = error?.response?.data?.message || error?.message || '患者查询失败，请稍后重试。'
  } finally {
    checking.value = false
  }
}

let cleanup
onMounted(() => {
  initLeftTitle(2, '新增患者')
  cleanup = registerNativeBack(() => router.back())
})
onUnmounted(() => cleanup?.())
</script>

<style scoped>
/* 从 reference-static/css/common.css 迁入新增患者页所需样式。 */
main{padding:22px 12px 92px}
.eyebrow{font-size:13px;color:#8a93a3}
.lead{font-size:22px;font-weight:700;margin-top:5px}
.sub{font-size:13px;color:#8a93a3;line-height:1.6;margin-top:7px}
.form-card{margin-top:18px;padding:17px;cursor:default}
.form-card:active{background:#fff;transform:none}
.field{margin-bottom:18px}
.field:last-child{margin-bottom:0}
.label{display:flex;align-items:center;gap:4px;font-size:13px;font-weight:650;margin-bottom:8px}
.req{color:#d93025}
.input{width:100%;height:44px;border:1px solid #dfe4ec;border-radius:9px;padding:0 12px;outline:0;background:#fff;color:#374151}
.input:focus{border-color:#0b57d0;box-shadow:0 0 0 3px rgba(11,87,208,.08)}
.input.error{border-color:#d93025}
.hint{font-size:11px;color:#8a93a3;margin-top:6px;line-height:1.5}
.error-text{font-size:11px;color:#d93025;margin-top:6px}
.bottom{position:fixed;left:0;right:0;bottom:0;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:linear-gradient(to top,#f7f8fa 72%,rgba(247,248,250,0));z-index:20}
@media(min-width:768px){main{padding-left:20px;padding-right:20px}}
.primary:disabled{opacity:.65;cursor:not-allowed}
.input:disabled{background:#f7f8fa;color:#6b7280}
</style>
