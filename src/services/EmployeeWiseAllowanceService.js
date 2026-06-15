import axios from "../utils/axios";

/**
 * @typedef {Object} EmployeeWiseAllowance
 * @property {number} id
 * @property {string} allowance_code
 * @property {string} allowance_name
 * @property {string} allowance_description
 * @property {number} employee_id
 * @property {string} employee_name
 * @property {number} amount
 * @property {string} date
 * @property {string} status
 * @property {date} created_at
 * @property {date} updated_at
 */

/**
 * @typedef {Omit<EmployeeWiseAllowance, 'id' | 'employee_name' | 'status' | 'created_at' | 'updated_at'>} CreateEmployeeWiseAllowancePayload
 */

/**
 * @typedef {Omit<EmployeeWiseAllowance, 'id' | 'employee_name' | 'created_at' | 'updated_at'} UpdateEmployeeWiseAllowancePayload
 */

/**
 * Fetches all the records in employee_wise_allowance table in the database.
 * @returns {Promise<Array<EmployeeWiseAllowance>>}
 */
export function getAll() {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.get("/employee-wise-allowance");

            if (!res) throw new Error("Failed to get the response!");

            if (res.status !== 200) throw new Error("Something went wrong!");

            resolve(res.data);
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Fetches a single record from employee_wise_allowance table in the database.
 * It requires `id` parameter.
 * @param {string} id 
 * @returns {Promise<EmployeeWiseAllowance>}
 */
export function getOneById(id) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.get(`/employee-wise-allowance/${id}`);

            if (!res) throw new Error("Failed to get the response!");

            if (res.status !== 200) throw new Error("Something went wrong!");

            resolve(res.data);
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * @param {CreateEmployeeWiseAllowancePayload} data
 * @returns {Promise<EmployeeWiseAllowance>}
 */
export function createOne(data) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.post(
                "/employee-wise-allowance",
                data,
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!res) throw new Error("Failed to get the response!");

            if (res.status !== 200 && res.status !== 201) throw new Error("Something went wrong!");

            resolve(res.data.data);
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * @param {number} id 
 * @param {UpdateEmployeeWiseAllowancePayload} data
 * @returns {Promise<EmployeeWiseAllowance}
 */
export function updateOne(id, data) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.put(
                `/employee-wise-allowance/${id}`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!res) throw new Error("Failed to get the response!");

            if (res.status !== 200 && res.status !== 201) throw new Error("Something went wrong!");

            resolve(res.data.data);
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * @param {number} id 
 * @returns {Promise<string>}
 */
export function deleteOne(id) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.delete(`/employee-wise-allowance/${id}`);

            if (!res) throw new Error("Failed to get the response");

            if (res.status !== 200) throw new Error("Something went wrong!");

            resolve(res.data.message);
        } catch (err) {
            reject(err);
        }
    });
}