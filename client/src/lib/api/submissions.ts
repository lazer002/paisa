import api from "./axios";

export const submissionAPI = {
  getSubmissions: (params?: Record<string, string>) => api.get("/submissions", { params }),
  submitAssignment: (data: any) => api.post("/submissions", data),
  gradeSubmission: (id: string, data: { score: number; feedback: string }) =>
    api.put(`/submissions/${id}/grade`, data),
};
