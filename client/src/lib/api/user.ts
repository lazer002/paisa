import axios from "./axios";

export const userAPI = {
  getUsers: async () => {
    const res = await axios.get("/users");
    return res.data;
  },
};