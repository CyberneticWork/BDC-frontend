import axios from "@utils/axios";

export const fetchTimeCards = async () => {
  try {
    const response = await axios.get(`/overtime`);
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
};

export const approveOt = async (id, sts) => {
  try {
    const response = await axios.post(`/overtime/approve/${id}`, {
      status: sts
    });
    return response.data;
  } catch (error) {
    console.error("Error approving overtime:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

