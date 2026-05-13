import api from "./axios";

export const departmentAPI = {
  getDepartments: (params?: Record<string, string>) => api.get("/departments", { params }),
  createDepartment: (data: any) => api.post("/departments", data),
  updateDepartment: (id: string, data: any) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete(`/departments/${id}`),
};
