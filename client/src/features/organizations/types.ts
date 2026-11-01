export type OrgType =
  | 'school'
  | 'college'
  | 'coaching'
  | 'company'
  | 'institute'
  | 'startup'
  | 'ngo'
  | 'others'

export type OrgPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type OrgStatus = 'active' | 'inactive' | 'suspended'

export interface OrgContact {
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pincode?: string
}

export interface OrgMeta {
  industry?: string
  registrationNo?: string
  gstNumber?: string
  board?: string
  affiliationNo?: string
  establishedYear?: number
}

export interface OrgSettings {
  allowPublicJoin: boolean
  requireApproval: boolean
  maxMembers: number
    features?: Record<string, boolean>;
}

export interface Organization {
  _id: string
  /** Opaque external identifier — used in ALL client-facing URLs. */
  publicId?: string
  name: string
  slug: string
  type: OrgType
  description?: string
  logo?: string
  website?: string
  branding?: { logo?: string | null; website?: string | null }
  orgCode: string
  contact: OrgContact
  owner: string | { _id: string; name: string; email: string }
  membersCount: number
  meta: OrgMeta
  plan: OrgPlan
  planExpiresAt?: string
  settings: OrgSettings
  status: OrgStatus
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  admin?: unknown
  billing?: {
  plan?: string;
  status?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
};
}

export interface CreateOrgPayload {
  name: string
  type: OrgType
  description?: string
  logo?: string
  website?: string
  /**
   * `contact.email` is REQUIRED by the server on create: it becomes the login
   * of the organization's first admin. `contact.name` is only used as that
   * admin's display name (it is not stored on the organization).
   */
  contact?: OrgContact & { name?: string }
  meta?: OrgMeta
  plan?: OrgPlan
  settings?: Partial<OrgSettings>
}

/** `data` of a successful POST /organizations. */
export interface CreateOrgResult {
  organization: Organization
  admin: {
    id: string
    email: string
    name: string
    role: string
    mustChangePassword: boolean
  }
  /** One-time temporary password for the new admin (must be changed on first login). */
  temporaryPassword: string
}

export type UpdateOrgPayload = Partial<CreateOrgPayload> & { status?: OrgStatus }
