import axios from 'axios'
const api = axios.create({ baseURL: '', timeout: 15000 })
api.interceptors.request.use(c => { const t = localStorage.getItem('pyc_farm_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c })
api.interceptors.response.use(r => r.data, e => Promise.reject(new Error(e.response?.data?.error || e.message || 'Network error')))
export default api
