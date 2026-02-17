import axios from "../../utils/axios";

// axios baseURL already includes the '/api' prefix (see src/utils/axios.js)
// keep endpoints relative to that baseURL to avoid double '/api/api' paths
const API_URL = "/product-types";

async function getAllProductTypes() {
  const res = await axios.get(API_URL);
  return res.data;
}

async function addProductType(type) {
  // type: { type, description, created_by, status }
  const res = await axios.post(API_URL, type);
  return res.data;
}

async function updateProductType(id, data) {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
}

async function deleteProductType(id) {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
}

async function toggleProductTypeActive(id) {
  // Fetch current type, then toggle status. Use the standard update (PUT) endpoint
  // because some backends accept partial updates there and there may be no
  // dedicated /set-status endpoint.
  const typeRes = await axios.get(`${API_URL}/${id}`);
  const newStatus =
    typeRes.data && typeRes.data.status === "active" ? "deactive" : "active";
  // Use PUT to update the resource. This keeps behaviour consistent with updateProductType.
  const res = await axios.put(`${API_URL}/${id}`, { status: newStatus });
  return res.data;
}

export {
  getAllProductTypes,
  addProductType,
  updateProductType,
  deleteProductType,
  toggleProductTypeActive,
};
