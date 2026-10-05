import api from './axios';

/**
 * Authentication & Profile API Service
 */
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwords) => api.put('/auth/change-password', passwords),
};

/**
 * Student Management API Service
 */
export const studentService = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  getByClass: (classId) => api.get(`/students/class/${classId}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

/**
 * Teacher & Educator Management API Service
 */
export const teacherService = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  getMe: () => api.get('/teachers/me'),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
};

/**
 * Parent & Guardian Management API Service
 */
export const parentService = {
  getAll: (params) => api.get('/parents', { params }),
  getById: (id) => api.get(`/parents/${id}`),
  create: (data) => api.post('/parents', data),
  update: (id, data) => api.put(`/parents/${id}`, data),
  delete: (id) => api.delete(`/parents/${id}`),
};

/**
 * Class & Grade Management API Service
 */
export const classService = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
};

/**
 * Attendance Tracking & Records API Service
 */
export const attendanceService = {
  getAll: (params) => api.get('/attendance', { params }),
  getStudentAttendance: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
  markSingle: (data) => api.post('/attendance', data),
  markBulk: (data) => api.post('/attendance/bulk', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
};

/**
 * Class Schedules & Routine API Service
 */
export const scheduleService = {
  getAll: (params) => api.get('/schedules', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  getByClass: (classId) => api.get(`/schedules/class/${classId}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

/**
 * Fees & Billing API Service
 */
export const feeService = {
  getAll: (params) => api.get('/fees', { params }),
  getById: (id) => api.get(`/fees/${id}`),
  getByStudent: (studentId) => api.get(`/fees/student/${studentId}`),
  create: (data) => api.post('/fees', data),
  update: (id, data) => api.put(`/fees/${id}`, data),
  delete: (id) => api.delete(`/fees/${id}`),
  recordPayment: (feeId, data) => api.post(`/fees/${feeId}/payment`, data),
  getPaymentReceipt: (paymentId) => api.get(`/fees/payment/${paymentId}`),
};

/**
 * Payments & Financial Transactions API Service
 */
export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
};

/**
 * Announcements & Notices API Service
 */
export const announcementService = {
  getAll: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  publish: (id) => api.patch(`/announcements/${id}/publish`),
  delete: (id) => api.delete(`/announcements/${id}`),
};

/**
 * School Events Calendar API Service
 */
export const eventService = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

/**
 * Real-time Dashboards API Service
 */
export const dashboardService = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getAdminCharts: () => api.get('/dashboard/admin/charts'),
  getTeacherDashboard: () => api.get('/dashboard/teacher'),
  getParentDashboard: () => api.get('/dashboard/parent'),
};

/**
 * Analytical Reports API Service
 */
export const reportService = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  getFees: (params) => api.get('/reports/fees', { params }),
  getEnrollment: (params) => api.get('/reports/enrollment', { params }),
};

/**
 * User & Role Administration API Service
 */
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

/**
 * School Settings API Service
 */
export const settingService = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
