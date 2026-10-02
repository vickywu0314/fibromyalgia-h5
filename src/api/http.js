import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  withCredentials: true,
  timeout: 10000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' }
})

http.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
)

export default http
