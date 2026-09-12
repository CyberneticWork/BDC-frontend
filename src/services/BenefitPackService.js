import axios from "@utils/axios";

export const getMyWeeklyOffs = (params = {}) =>
  axios.get("/me/weekly-offs", { params }).then((r) => r.data);

export const submitWeeklyOff = (payload) =>
  axios.post("/me/weekly-offs", payload).then((r) => r.data);

export const listWeeklyOffs = (params = {}) =>
  axios.get("/hr/weekly-offs", { params }).then((r) => r.data);

export const createWeeklyOff = (payload) =>
  axios.post("/hr/weekly-offs", payload).then((r) => r.data);

export const reviewWeeklyOff = (id, payload) =>
  axios.post(`/hr/weekly-offs/${id}/review`, payload).then((r) => r.data);

export const getMyMedicalClaims = () =>
  axios.get("/me/medical-claims").then((r) => r.data);

export const submitMedicalClaim = (formData) =>
  axios.post("/me/medical-claims", formData).then((r) => r.data);

export const listMedicalClaims = (params = {}) =>
  axios.get("/hr/medical-claims", { params }).then((r) => r.data);

export const reviewMedicalClaim = (id, payload) =>
  axios.post(`/hr/medical-claims/${id}/review`, payload).then((r) => r.data);

export const medicalClaimBill = (id) =>
  axios.get(`/hr/medical-claims/${id}/bill`).then((r) => r.data);

export const saveMedicalQuota = (payload) =>
  axios.post("/hr/medical-quotas", payload).then((r) => r.data);

export const listPendingPayments = (params = {}) =>
  axios.get("/hr/pending-payments", { params }).then((r) => r.data);

export const markPendingPaymentPaid = (id, payload = {}) =>
  axios.post(`/hr/pending-payments/${id}/paid`, payload).then((r) => r.data);
