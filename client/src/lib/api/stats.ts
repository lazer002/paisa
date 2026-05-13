import api from "./axios";

export const statsAPI = {
  getSuperAdminStats: () => api.get("/stats/superadmin"),
  getAdminStats: () => api.get("/stats/admin"),
  getTeacherStats: () => api.get("/stats/teacher"),
  getStudentStats: () => api.get("/stats/student"),
  getHRStats: () => api.get("/stats/hr"),
  getEmployeeStats: () => api.get("/stats/employee"),
};
