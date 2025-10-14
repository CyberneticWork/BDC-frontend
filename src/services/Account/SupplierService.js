import axios from '../../utils/axios';

// helpers to map UI <-> API field names
const toApi = (data) => ({
  supplier_name: data.supplierName,
  phone_number: data.phoneNumber,
  nic: data.nic,
  email: data.email,
  address1: data.address1,
  address2: data.address2,
  credit_value: data.creditValue !== '' ? Number(data.creditValue) : null,
  credit_period: data.creditPeriod !== '' ? Number(data.creditPeriod) : null,
});

const fromApi = (data) => ({
  id: data.id,
  supplierName: data.supplier_name || '',
  phoneNumber: data.phone_number || '',
  nic: data.nic || '',
  email: data.email || '',
  address1: data.address1 || '',
  address2: data.address2 || '',
  // return numeric types for easier formatting in UI
  creditValue: data.credit_value != null ? Number(data.credit_value) : 0,
  creditPeriod: data.credit_period != null ? Number(data.credit_period) : 0,
});

const list = async () => {
  const res = await axios.get('/suppliers');
  return res.data.map(fromApi);
};

const get = async (id) => {
  const res = await axios.get(`/suppliers/${id}`);
  return fromApi(res.data);
};

const create = async (payload) => {
  const res = await axios.post('/suppliers', toApi(payload));
  return fromApi(res.data);
};

const update = async (id, payload) => {
  const res = await axios.put(`/suppliers/${id}`, toApi(payload));
  return fromApi(res.data);
};

const remove = async (id) => {
  await axios.delete(`/suppliers/${id}`);
  return true;
};

export default {
  list,
  get,
  create,
  update,
  remove,
};
