import axios from 'axios';
 
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
 
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});
 
// ── Interceptors ──────────────────────────────────────────────────────────────
 
// Gắn token vào mọi request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cinema_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
 
// Xử lý lỗi toàn cục
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Token hết hạn → xóa cache và về trang login
      localStorage.removeItem('cinema_token');
      localStorage.removeItem('cinema_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
 
// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data)       => api.post('/auth/login', data),
  register:       (data)       => api.post('/auth/register', data),
  me:             ()           => api.get('/auth/me'),
  updateProfile:  (data)       => api.put('/auth/profile', data),
  changePassword: (data)       => api.put('/auth/change-password', data),
};
 
// ── Movies ────────────────────────────────────────────────────────────────────
export const movieAPI = {
  getAll:       (params)       => api.get('/movies', { params }),
  getById:      (id)           => api.get(`/movies/${id}`),
  create:       (data)         => api.post('/movies', data),
  update:       (id, data)     => api.put(`/movies/${id}`, data),
  delete:       (id)           => api.delete(`/movies/${id}`),
  getCategories:()             => api.get('/movies/categories/all'),
};
 
// ── Showtimes ─────────────────────────────────────────────────────────────────
export const showtimeAPI = {
  getAll:   (params)           => api.get('/showtimes', { params }),
  getById:  (id)               => api.get(`/showtimes/${id}`),
  create:   (data)             => api.post('/showtimes', data),
  update:   (id, data)         => api.put(`/showtimes/${id}`, data),
  cancel:   (id)               => api.delete(`/showtimes/${id}`),
};
 
// ── Seats ─────────────────────────────────────────────────────────────────────
export const seatAPI = {
  getByShowtime: (showtime_id) => api.get(`/seats/showtime/${showtime_id}`),
  getByRoom:     (room_id)     => api.get(`/seats/room/${room_id}`),
  generate:      (data)        => api.post('/seats/generate', data),
};
 
// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingAPI = {
  getAll:   (params)           => api.get('/bookings', { params }),
  getById:  (id)               => api.get(`/bookings/${id}`),
  create:   (data)             => api.post('/bookings', data),
  cancel:   (id)               => api.put(`/bookings/${id}/cancel`),
  confirm:  (id)               => api.put(`/bookings/${id}/confirm`),
};
 
// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  create:   (data)             => api.post('/payments', data),
  getAll:   (params)           => api.get('/payments', { params }),
  getById:  (id)               => api.get(`/payments/${id}`),
};
 
// ── Tickets ───────────────────────────────────────────────────────────────────
// Backend routes: GET /today, GET /booking/:id, GET /:id, PUT /verify/:id
export const ticketAPI = {
  getToday:      (params)      => api.get('/tickets/today', { params }),     // staff xem vé hôm nay
  getByBooking:  (booking_id)  => api.get(`/tickets/booking/${booking_id}`), // lấy vé theo booking
  getById:       (id)          => api.get(`/tickets/${id}`),                 // lấy vé theo ticket id
  verify:        (id)          => api.put(`/tickets/verify/${id}`),          // xác minh vé
};
 
// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll:    (params)          => api.get('/users', { params }),
  getById:   (id)              => api.get(`/users/${id}`),
  create:    (data)            => api.post('/users', data),
  update:    (id, data)        => api.put(`/users/${id}`, data),
  ban:       (id)              => api.delete(`/users/${id}`),
  getRoles:  ()                => api.get('/users/roles/all'),
};
 
// ── Rooms ─────────────────────────────────────────────────────────────────────
export const roomAPI = {
  getAll:    (params)          => api.get('/rooms', { params }),
  getById:   (id)              => api.get(`/rooms/${id}`),
  create:    (data)            => api.post('/rooms', data),
  update:    (id, data)        => api.put(`/rooms/${id}`, data),
  delete:    (id)              => api.delete(`/rooms/${id}`),
};
 
// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  // Backend tự trả dữ liệu phù hợp với role (admin/manager full, ticket_staff limited)
  getStats:  ()                => api.get('/dashboard/stats'),
};
 
export default api;