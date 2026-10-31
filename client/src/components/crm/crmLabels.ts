import type { CrmParentRef } from '@/features/crm/crmApi'

interface Linked {
  leadId?: CrmParentRef | null
  dealId?: CrmParentRef | null
  contactId?: CrmParentRef | null
  customerId?: CrmParentRef | null
}

const personName = (p?: CrmParentRef | null) =>
  p ? p.fullName || [p.firstName, p.lastName].filter(Boolean).join(' ') || p.displayName || p.companyName || '' : ''

/** "Lead: Aarav Sharma" / "Deal: Fall intake" for a populated CRM record. */
export const parentLabel = (r: Linked) => {
  if (r.dealId) return `Deal: ${r.dealId.title || '—'}`
  if (r.leadId) return `Lead: ${personName(r.leadId) || '—'}`
  if (r.contactId) return `Contact: ${personName(r.contactId) || '—'}`
  if (r.customerId) return `Customer: ${r.customerId.displayName || '—'}`
  return ''
}
