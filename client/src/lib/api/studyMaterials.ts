import api from "./axios";

export const studyMaterialAPI = {
  getMaterials: (params?: Record<string, string>) => api.get("/study-materials", { params }),
  createMaterial: (data: any) => api.post("/study-materials", data),
  updateMaterial: (id: string, data: any) => api.put(`/study-materials/${id}`, data),
  deleteMaterial: (id: string) => api.delete(`/study-materials/${id}`),
};
