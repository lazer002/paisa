import api from "./axios";

export const announcementAPI = {
  getAnnouncements: (params?: Record<string, string>) => api.get("/announcements", { params }),
  createAnnouncement: (data: any) => api.post("/announcements", data),
  updateAnnouncement: (id: string, data: any) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id: string) => api.delete(`/announcements/${id}`),
};
