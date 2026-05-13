import api from "./axios";

export const assignmentAPI = {
  getAssignments: (params?: Record<string, string>) => api.get("/assignments", { params }),
  getAssignment: (id: string) => api.get(`/assignments/${id}`),
  createAssignment: (data: any) => api.post("/assignments", data),
  updateAssignment: (id: string, data: any) => api.put(`/assignments/${id}`, data),
  deleteAssignment: (id: string) => api.delete(`/assignments/${id}`),
};
