import axios from "../utils/axios";

/**
 * @typedef {Object} EmployeeWiseBonus
 * @property {number} id
 * @property {string} bonus_code
 * @property {string} bonus_name
 * @property {string} bonus_description
 * @property {number} employee_id
 * @property {string} employee_name
 * @property {number} amount
 * @property {string} date
 * @property {boolean} is_annual
 * @property {number[]} payment_months
 * @property {string} status
 * @property {date} created_at
 * @property {date} updated_at
 */

export function getAll() {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.get("/employee-wise-bonus");
            if (!res || res.status !== 200) throw new Error("Something went wrong!");
            resolve(res.data);
        } catch (err) {
            reject(err);
        }
    });
}

export function getOneById(id) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.get(`/employee-wise-bonus/${id}`);
            if (!res || res.status !== 200) throw new Error("Something went wrong!");
            resolve(res.data);
        } catch (err) {
            reject(err);
        }
    });
}

export function createOne(data) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.post("/employee-wise-bonus", data, {
                headers: { "Content-Type": "application/json" },
            });
            if (!res || (res.status !== 200 && res.status !== 201)) throw new Error("Something went wrong!");
            resolve(res.data.data);
        } catch (err) {
            reject(err);
        }
    });
}

export function updateOne(id, data) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.put(`/employee-wise-bonus/${id}`, data, {
                headers: { "Content-Type": "application/json" },
            });
            if (!res || (res.status !== 200 && res.status !== 201)) throw new Error("Something went wrong!");
            resolve(res.data.data);
        } catch (err) {
            reject(err);
        }
    });
}

export function deleteOne(id) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.delete(`/employee-wise-bonus/${id}`);
            if (!res || res.status !== 200) throw new Error("Something went wrong!");
            resolve(res.data.message);
        } catch (err) {
            reject(err);
        }
    });
}
