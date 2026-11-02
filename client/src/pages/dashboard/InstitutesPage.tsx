import PlatformOrganizationsList, { type OrganizationGroup } from '@/components/platform-admin/PlatformOrganizationsList'

const INSTITUTES: OrganizationGroup = {
  title: 'Institutes',
  subtitle: 'Schools, colleges, coaching centres and institutes on the platform.',
  types: ['school', 'college', 'coaching', 'institute'],
}

/** The platform organization list (search, create, delete, restore), limited to institutes. */
export default function InstitutesPage() {
  return <PlatformOrganizationsList group={INSTITUTES} />
}
