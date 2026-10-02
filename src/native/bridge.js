const STORAGE_KEY = 'fms_doctor_id'

function nativeApi() {
  return typeof window !== 'undefined' ? window.WenwenClass : undefined
}

export function isNativeApp() {
  const api = nativeApi()
  return !!(api && typeof api.getUserId === 'function')
}

export function login() {
  const api = nativeApi()
  if (api && typeof api.login === 'function') api.login()
}

export function getDoctorId() {
  const api = nativeApi()
  if (api && typeof api.getUserId === 'function') {
    try {
      const id = api.getUserId()
      if (id !== undefined && id !== null && String(id).trim()) {
        const value = String(id)
        sessionStorage.setItem(STORAGE_KEY, value)
        return value
      }
    } catch (err) {
      console.warn('[FMS] WenwenClass.getUserId() failed:', err)
    }
  }

  const queryId = new URLSearchParams(window.location.search).get('userId')
  if (queryId) {
    sessionStorage.setItem(STORAGE_KEY, queryId)
    return queryId
  }

  const cached = sessionStorage.getItem(STORAGE_KEY)
  if (cached) return cached

  if (import.meta.env.DEV && import.meta.env.VITE_DEV_DOCTOR_ID) {
    return String(import.meta.env.VITE_DEV_DOCTOR_ID)
  }

  return ''
}

export function initLeftTitle(type, title) {
  const api = nativeApi()
  if (api && typeof api.initLeftTitle === 'function') {
    try { api.initLeftTitle(type, title) } catch (err) { console.warn('[FMS] initLeftTitle failed:', err) }
  }
}

export function registerNativeBack(handler) {
  const previous = window.clickLeftTitleBackButton
  window.clickLeftTitleBackButton = (...args) => handler(...args)
  return () => {
    if (previous) window.clickLeftTitleBackButton = previous
    else delete window.clickLeftTitleBackButton
  }
}

export function uploadPictures(...args) {
  const api = nativeApi()
  return api && typeof api.uploadPictures === 'function' ? api.uploadPictures(...args) : undefined
}

export function uploadPicturesLists(...args) {
  const api = nativeApi()
  return api && typeof api.uploadPicturesLists === 'function' ? api.uploadPicturesLists(...args) : undefined
}

export function exportMedicalRecords(url) {
  const api = nativeApi()
  return api && typeof api.exportMedicalRecords === 'function' ? api.exportMedicalRecords(url) : undefined
}
