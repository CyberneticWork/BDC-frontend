import axios from "../utils/axios";

/**
 * @typedef {Object} EmployeeWiseDeduction
 * @property {number} id
 * @property {string} deduction_code
 * @property {string} deduction_name
 * @property {string} deduction_description
 * @property {number} employee_id
 * @property {string} employee_name
 * @property {number} amount
 * @property {string} date
 * @property {string} status
 */

export function getAll() {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.get("/employee-wise-deduction");
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
            const res = await axios.get(`/employee-wise-deduction/${id}`);
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
            const res = await axios.post("/employee-wise-deduction", data, {
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
            const res = await axios.put(`/employee-wise-deduction/${id}`, data, {
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
            const res = await axios.delete(`/employee-wise-deduction/${id}`);
            if (!res || res.status !== 200) throw new Error("Something went wrong!");
            resolve(res.data.message);
        } catch (err) {
            reject(err);
        }
    });
}
