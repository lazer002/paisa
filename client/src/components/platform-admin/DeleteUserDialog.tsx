import { useState } from 'react'

import { useDeleteUserMutation } from '@/features/users/usersApi'

import ConfirmDeleteDialog from './ConfirmDeleteDialog'
import { apiErrorMessage } from './apiError'

export interface DeleteUserDialogProps {
  user: { publicId?: string; _id?: string; name?: string; email?: string }
  onClose: () => void
  /** Called after the server confirms the delete. */
  onDeleted?: () => void
}

/**
 * Confirms and calls DELETE /users/:publicId. The server does NOT hard-delete:
 * it sets the account's status to `inactive` (data kept, reversible).
 * Render conditionally so state resets per target.
 */
export default function DeleteUserDialog({ user, onClose, onDeleted }: DeleteUserDialogProps) {
  const [deleteUser, { isLoading }] = useDeleteUserMutation()
  const [error, setError] = useState<string | null>(null)
  const id = user.publicId ?? user._id ?? ''
  const label = user.name || user.email || 'this user'

  const confirm = async () => {
    setError(null)
    try {
      await deleteUser(id).unwrap()
      onDeleted?.()
      onClose()
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to delete this user'))
    }
  }

  return (
    <ConfirmDeleteDialog
      open
      title="Delete user"
      entityName={label}
      description={
        <>
          The server performs a <strong>soft delete</strong>: the account is set to{' '}
          <strong>inactive</strong>; nothing is erased.
        </>
      }
      consequences={[
        'They are signed out on their next request and cannot sign in.',
        'Their records (attendance, payroll, submissions, …) are kept.',
        'An admin can restore access later by setting the status back to active.',
      ]}
      confirmLabel="Delete user"
      busy={isLoading}
      error={error}
      onConfirm={confirm}
      onClose={onClose}
    />
  )
}
