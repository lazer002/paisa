import { useState } from 'react'

import { useDeleteOrganizationMutation } from '@/features/organizations/organizationsApi'

import ConfirmDeleteDialog from './ConfirmDeleteDialog'
import { apiErrorMessage } from './apiError'

export interface DeleteOrganizationDialogProps {
  organization: { publicId?: string; _id: string; name: string; orgCode?: string }
  onClose: () => void
  onDeleted?: () => void
}

/**
 * Confirms and calls DELETE /organizations/:publicId (super admin only).
 * Server behaviour: soft delete (isDeleted=true, deletedAt set). The org
 * disappears from every list and its members fail authentication
 * (ORGANIZATION_NOT_FOUND). User accounts and data are not erased.
 */
export default function DeleteOrganizationDialog({
  organization,
  onClose,
  onDeleted,
}: DeleteOrganizationDialogProps) {
  const [deleteOrganization, { isLoading }] = useDeleteOrganizationMutation()
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setError(null)
    try {
      await deleteOrganization(organization.publicId ?? organization._id).unwrap()
      onDeleted?.()
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to delete this organization'))
    }
  }

  return (
    <ConfirmDeleteDialog
      open
      title="Delete organization"
      entityName={organization.name}
      description={
        <>
          {organization.orgCode ? <>Code {organization.orgCode}. </> : null}
          The server performs a <strong>soft delete</strong>: the organization is flagged as deleted and
          hidden everywhere; its data is not erased.
        </>
      }
      consequences={[
        'Every member of this organization (admins included) is locked out immediately.',
        'Users, classes, invoices and other records stay in the database.',
        'There is no restore button in the app yet — restoring needs a database change.',
      ]}
      requireTypedName
      confirmLabel="Delete organization"
      busy={isLoading}
      error={error}
      onConfirm={confirm}
      onClose={onClose}
    />
  )
}
