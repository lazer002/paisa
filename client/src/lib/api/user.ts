import API from "./axios";

// 🔹 Types (optional but good)
export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: string;
  status?: string;
}

export const userAPI = {
  // ✅ Get all users
  getUsers: async () => {
    const res = await API.get("/users");
    return res.data;
  },

  // ✅ Create user
  createUser: async (data: CreateUserDTO) => {
    const res = await API.post("/users", data);
    return res.data;
  },

  // ✅ Update user
  updateUser: async (id: string, data: any) => {
    const res = await API.put(`/users/${id}`, data);
    return res.data;
  },

  // ✅ Delete user
  deleteUser: async (id: string) => {
    const res = await API.delete(`/users/${id}`);
    return res.data;
  },
};