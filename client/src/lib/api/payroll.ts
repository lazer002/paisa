import api from "./axios";

export const payrollAPI = {
  getPayrolls: (params?: Record<string, string>) => api.get("/payroll", { params }),
  createPayroll: (data: any) => api.post("/payroll", data),
  updateStatus: (id: string, status: string) => api.put(`/payroll/${id}/status`, { status }),
  deletePayroll: (id: string) => api.delete(`/payroll/${id}`),
};
