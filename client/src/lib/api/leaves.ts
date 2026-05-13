import api from "./axios";

export const leaveAPI = {
  getLeaves: (params?: Record<string, string>) => api.get("/leaves", { params }),
  applyLeave: (data: any) => api.post("/leaves", data),
  updateStatus: (id: string, status: string, rejectionReason?: string) =>
    api.put(`/leaves/${id}/status`, { status, rejectionReason }),
  cancelLeave: (id: string) => api.put(`/leaves/${id}/cancel`),
};
