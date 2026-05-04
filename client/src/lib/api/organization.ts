import axios from "./axios";

//
// 🔹 TYPES (important for scaling)
//
export interface Organization {
  _id: string;
  name: string;
  slug: string;
  orgCode: string;

  type: string;
  description?: string;

  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  meta?: {
    industry?: string;
    registrationNo?: string;
    board?: string;
    affiliationNo?: string;

    // 👇 ADD THIS
    customType?: string;
  };

  status: "active" | "inactive" | "suspended";
  plan: "free" | "pro" | "enterprise";

  createdAt: string;
  updatedAt?: string;
}

export interface GetOrganizationsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}

//
// 🔹 API
//
export const organizationAPI = {
  // 🔹 Get all organizations (with filters)
  getOrganizations: async (params: GetOrganizationsParams = {}) => {
    try {
      const res = await axios.get("/organizations", { params });
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || { message: "Failed to fetch organizations" };
    }
  },

  // 🔹 Get single organization
  getOrganization: async (id: string) => {
    try {
      const res = await axios.get(`/organizations/${id}`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || { message: "Failed to fetch organization" };
    }
  },

  // 🔹 Create organization
  createOrganization: async (data: Partial<Organization>) => {
    try {
      const res = await axios.post("/organizations", data);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || { message: "Failed to create organization" };
    }
  },

  // 🔹 Update organization
  updateOrganization: async (
    id: string,
    data: Partial<Organization>
  ) => {
    try {
      const res = await axios.put(`/organizations/${id}`, data);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || { message: "Failed to update organization" };
    }
  },

  // 🔹 Delete organization
  deleteOrganization: async (id: string) => {
    try {
      const res = await axios.delete(`/organizations/${id}`);
      return res.data;
    } catch (err: any) {
      throw err?.response?.data || { message: "Failed to delete organization" };
    }
  },
};