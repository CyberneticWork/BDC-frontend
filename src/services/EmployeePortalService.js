import axios from "@utils/axios";

export const getPortalHome = (params = {}) =>
  axios.get('/me/portal', { params }).then((r) => r.data);

export const getMyAttendance = (params = {}) =>
  axios.get('/me/attendance', { params }).then((r) => r.data);

export const getMyOvertime = (params = {}) =>
  axios.get('/me/overtime', { params }).then((r) => r.data);

export const getMyNopay = (params = {}) =>
  axios.get('/me/nopay', { params }).then((r) => r.data);

export const getMySalary = () =>
  axios.get('/me/salary').then((r) => r.data);

export const getMyLeaves = () =>
  axios.get('/me/leaves').then((r) => r.data);

export const submitLeave = (payload) =>
  axios.post('/me/leaves', payload).then((r) => r.data);

export const getCoveringColleagues = () =>
  axios.get('/me/covering-colleagues').then((r) => r.data);

export const getCoveringLeaves = () =>
  axios.get('/me/covering-leaves').then((r) => r.data);

export const respondCoveringLeave = (id, payload) =>
  axios.put(`/me/covering-leaves/${id}`, payload).then((r) => r.data);

export const getMyAdvances = () =>
  axios.get('/me/advances').then((r) => r.data);

export const submitAdvance = (payload) =>
  axios.post('/me/advances', payload).then((r) => r.data);

export const changeMyPassword = (payload) =>
  axios.post('/me/change-password', payload).then((r) => r.data);

export const listAdvanceRequests = (params = {}) =>
  axios.get('/hr/advance-requests', { params }).then((r) => r.data);

export const reviewAdvanceRequest = (id, payload) =>
  axios.post(`/hr/advance-requests/${id}/review`, payload).then((r) => r.data);
