import axios from "@utils/axios";

const ExcessLateReviewService = {
  async preview(params) {
    const { data } = await axios.get("/excess-late-reviews/preview", { params });
    return data;
  },
  async decide(payload) {
    const { data } = await axios.post("/excess-late-reviews/decide", payload);
    return data;
  },
};

export default ExcessLateReviewService;
