import api from "./axios";

export const attendanceAPI = {
  getAttendance: (params?: Record<string, string>) => api.get("/attendance", { params }),
  getMyAttendance: (params?: Record<string, string>) => api.get("/attendance/me", { params }),
  markAttendance: (data: any) => api.post("/attendance", data),
};
