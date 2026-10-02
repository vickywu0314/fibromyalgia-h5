import http from './http'

export function getPatientList({ doctorId, keyword = '', pageNo = 1, pageSize = 100 }) {
  return http.get('/api/fms/patient/list', {
    params: {
      pageNo,
      pageSize,
      doctorId,
      keyword,
      researchType: 12
    }
  })
}

/**
 * 按姓名 + 身份证号检查当前医生名下是否已有患者。
 * 后端若找到患者，data 会返回已有患者资料；未找到时继续新建流程。
 */
export function getPatientByCardNo({ name, cardno, doctorId }) {
  return http.get('/api/fms/patient/get/cardno', {
    params: { name, cardno, doctorId }
  })
}
