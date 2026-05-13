import axios from "./axios";

export const instituteAPI = {
  // 🔹 Get all institutes
  getInstitutes: async () => {
    const res = await axios.get("/institutes");
    return res.data;
  },

  // 🔹 Get single institute
  getInstitute: async (id: string) => {
    const res = await axios.get(`/institutes/${id}`);
    return res.data;
  },

  // 🔹 Create institute
  createInstitute: async (data: any) => {
    const res = await axios.post("/institutes", data);
    return res.data;
  },

  // 🔹 Update institute
  updateInstitute: async (
    id: string,
    data: any
  ) => {
    const res = await axios.put(
      `/institutes/${id}`,
      data
    );

    return res.data;
  },

  // 🔹 Delete institute
  deleteInstitute: async (id: string) => {
    const res = await axios.delete(
      `/institutes/${id}`
    );

    return res.data;
  },
};