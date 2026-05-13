import api from "./axios";

export const classAPI = {
  getClasses: (params?: Record<string, string>) => api.get("/classes", { params }),
  getClass: (id: string) => api.get(`/classes/${id}`),
  createClass: (data: any) => api.post("/classes", data),
  updateClass: (id: string, data: any) => api.put(`/classes/${id}`, data),
  deleteClass: (id: string) => api.delete(`/classes/${id}`),
  enrollStudent: (id: string, studentId: string) => api.post(`/classes/${id}/enroll`, { studentId }),
  removeStudent: (id: string, studentId: string) => api.delete(`/classes/${id}/students/${studentId}`),
};
