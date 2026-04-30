import axios from "./axios";

export const instituteAPI = {
  getInstitutes: async () => {
    const res = await axios.get("/institutes");
    return res.data;
  },

  getInstitute: async (id: string) => {
    const res = await axios.get(`/institutes/${id}`);
    return res.data;
  },

  createInstitute: async (data: any) => {
    const res = await axios.post("/institutes", data);
    return res.data;
  },
    deleteInstitute: async (id: string) => {
    const res = await axios.delete(`/institutes/${id}`);
    return res.data;
  },
  updateInstitute: async (id: string, data: any) => {
  const res = await axios.put(`/institutes/${id}`, data);
  return res.data;
},
};