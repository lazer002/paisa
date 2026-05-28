export type OrgType =
  | 'school'
  | 'college'
  | 'coaching'
  | 'company'
  | 'institute'
  | 'startup'
  | 'ngo'
  | 'others'

export type OrgPlan = 'free' | 'pro' | 'enterprise'
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
}

export interface Organization {
  _id: string
  name: string
  slug: string
  type: OrgType
  description?: string
  logo?: string
  website?: string
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
}

export interface CreateOrgPayload {
  name: string
  type: OrgType
  description?: string
  logo?: string
  website?: string
  contact?: OrgContact
  meta?: OrgMeta
  plan?: OrgPlan
  settings?: Partial<OrgSettings>
}

export type UpdateOrgPayload = Partial<CreateOrgPayload> & { status?: OrgStatus }
