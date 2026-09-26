import { useState } from 'react'
import { Settings as SettingsIcon, KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import api from '@/lib/api/axios'
import { useAppDispatch, useAppSelector } from '@/app/store'
import { setAuth, logout } from '@/lib/store/authSlice'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'

const PERMISSIONS_BY_ROLE: Record<string, string[]> = {
  super_admin: ['Manage all organizations', 'Create any role user', 'Change admin emails', 'Delete organizations', 'Billing & plans'],
  admin: ['Manage own organization profile', 'Create users below admin', 'Approve leaves', 'Mark attendance', 'Post announcements'],
  teacher: ['View own classes', 'Mark attendance', 'View students'],
  student: ['View enrolled classes', 'View own attendance', 'View announcements'],
  hr: ['Manage employees', 'Process payroll', 'Approve/reject leaves'],
  employee: ['View own payslips', 'Apply for leave', 'View announcements', 'View own attendance'],
}

export default function SettingsPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const [name, setName] = useState(user?.name ?? '')
  const [profileMsg, setProfileMsg] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  const token = useAppSelector((s) => s.auth.token)

  const saveProfile = async () => {
    setProfileMsg('')
    try {
      const res = await api.put('/auth/profile', { name })
      if (token) dispatch(setAuth({ user: res.data.data, token }))
      setProfileMsg('Profile updated')
    } catch (e: any) {
      setProfileMsg(e?.response?.data?.message ?? 'Failed to update profile')
    }
  }

  const changePassword = async () => {
    setPwMsg(''); setPwError('')
    try {
      await api.put('/auth/profile', { currentPassword, newPassword })
      setPwMsg('Password changed. Other devices have been logged out.')
      setCurrentPassword(''); setNewPassword('')
    } catch (e: any) {
      setPwError(e?.response?.data?.message ?? 'Failed to change password')
    }
  }

  const logoutAllDevices = async () => {
    try {
      await api.post('/auth/logout-all')
    } finally {
      dispatch(logout())
      window.location.href = '/login'
    }
  }

  const permissions = PERMISSIONS_BY_ROLE[user?.role ?? 'employee'] ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Your account and session preferences" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Profile</h3>
          <label className="mb-1 block text-sm font-medium text-gray-700">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black"
          />
          <label className="mb-1 mt-4 block text-sm font-medium text-gray-400">Email (locked)</label>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-dashed border-gray-300 bg-gray-100 px-3 py-2 text-sm italic text-gray-400"
          />
          {profileMsg && <p className="mt-2 text-xs text-green-600">{profileMsg}</p>}
          <Button className="mt-4" onClick={saveProfile}>Save Profile</Button>
        </div>

        {/* Security */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Security</h3>
          <label className="mb-1 block text-sm font-medium text-gray-700">Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            className="mb-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-black" />
          {pwMsg && <p className="mt-2 text-xs text-green-600">{pwMsg}</p>}
          {pwError && <p className="mt-2 text-xs text-red-600">{pwError}</p>}
          <Button className="mt-4" onClick={changePassword} disabled={!currentPassword || !newPassword}>
            <KeyRound size={15} /> Change Password
          </Button>
          <p className="mt-2 text-xs text-gray-400">Changing your password logs out all other devices.</p>

          <div className="mt-6 border-t pt-4">
            <Button variant="danger" onClick={logoutAllDevices}>
              <LogOut size={15} /> Logout All Devices
            </Button>
          </div>
        </div>
      </div>

      {/* What my role can do */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={18} className="text-gray-400" />
          <h3 className="font-semibold text-gray-900">Your role permissions</h3>
          <Badge color="blue">{user?.role?.replace('_', ' ')}</Badge>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {permissions.map((p) => (
            <div key={p} className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
              <SettingsIcon size={13} className="text-gray-400" /> {p}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-gray-400">
          Permission changes are enforced server-side on every request — this list reflects what your account can actually do.
        </p>
      </div>
    </div>
  )
}
