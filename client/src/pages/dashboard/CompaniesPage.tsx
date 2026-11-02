import PlatformOrganizationsList, { type OrganizationGroup } from '@/components/platform-admin/PlatformOrganizationsList'

const COMPANIES: OrganizationGroup = {
  title: 'Companies',
  subtitle: 'Company and startup organizations on the platform.',
  types: ['company', 'startup'],
}

/** The platform organization list (search, create, delete, restore), limited to companies. */
export default function CompaniesPage() {
  return <PlatformOrganizationsList group={COMPANIES} />
}
