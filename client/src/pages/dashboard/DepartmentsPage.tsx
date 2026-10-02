import { useMemo, useState } from 'react'
import {
  Layers,
  Plus,
  Trash2,
  Pencil,
  Search,
  MoreHorizontal,
  Users,
  Building2,
  ChevronDown,
  X,
  Check,
} from 'lucide-react'

import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} from '@/features/departments/departmentsApi'

import { useGetUsersQuery, rid } from '@/features/users/usersApi'
import { useAppSelector } from '@/app/store'

import PageHeader from '@/components/ui/PageHeader'
import { LoadingGrid, ErrorState, EmptyState } from '@/components/ui/StateViews'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Modal from '@/components/ui/Modal'

type DepartmentForm = {
  name: string
  code: string
  description: string
  head: string
  status: 'active' | 'inactive'
}

export default function DepartmentsPage() {
  const user = useAppSelector((s) => s.auth.user)

  const canManage = ['super_admin', 'admin', 'hr'].includes(
    user?.role ?? '',
  )

  const {
    data: departments = [],
    isLoading,
    isError,
    refetch,
  } = useGetDepartmentsQuery()

  const { data: staff = [] } = useGetUsersQuery()

  const [createDepartment, { isLoading: createPending }] =
    useCreateDepartmentMutation()

  const [updateDepartment, { isLoading: updatePending }] =
    useUpdateDepartmentMutation()

  const [deleteDepartment, { isLoading: deletePending }] =
    useDeleteDepartmentMutation()

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [menuId, setMenuId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  )

  const [error, setError] = useState('')

  const [form, setForm] = useState<DepartmentForm>({
    name: '',
    code: '',
    description: '',
    head: '',
    status: 'active',
  })

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return departments.filter((department) => {
      const matchesSearch =
        !query ||
        department.name.toLowerCase().includes(query) ||
        department.code?.toLowerCase().includes(query) ||
        department.description?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || department.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [departments, search, statusFilter])

  const resetForm = () => {
    setForm({
      name: '',
      code: '',
      description: '',
      head: '',
      status: 'active',
    })

    setEditingId(null)
    setError('')
  }

  const openCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const openEdit = (department: (typeof departments)[number]) => {
    setEditingId(department.publicId ?? department._id)

    setForm({
      name: department.name ?? '',
      code: department.code ?? '',
      description: department.description ?? '',
      head:
        typeof department.head === 'object' && department.head
          ? rid(department.head as any)
          : typeof department.head === 'string'
            ? department.head
            : '',
      status: department.status ?? 'active',
    })

    setError('')
    setMenuId(null)
    setShowModal(true)
  }

  const closeModal = () => {
    if (createPending || updatePending) return

    setShowModal(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      setError('Department name is required')
      return
    }

    setError('')

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        head: form.head || undefined,
        ...(editingId ? { status: form.status } : {}),
      }

      if (editingId) {
        await updateDepartment({
          id: editingId,
          payload,
        }).unwrap()
      } else {
        await createDepartment(payload).unwrap()
      }

      setShowModal(false)
      resetForm()
    } catch (e: any) {
      setError(
        e?.data?.message ??
          e?.error?.data?.message ??
          (editingId
            ? 'Failed to update department'
            : 'Failed to create department'),
      )
    }
  }

  const handleDelete = async (id: string) => {
    setMenuId(null)

    const confirmed = window.confirm(
      'Delete this department? This action cannot be undone.',
    )

    if (!confirmed) return

    try {
      await deleteDepartment(id).unwrap()
    } catch (e: any) {
      setError(
        e?.data?.message ??
          e?.error?.data?.message ??
          'Failed to delete department',
      )
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto max-w-[1500px] px-6 py-7 lg:px-8">
        <PageHeader
          title="Departments"
          subtitle="Manage your organization's teams, structure and department heads"
          actions={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus size={16} />
                New department
              </Button>
            ) : undefined
          }
        />

        {/* TOP SUMMARY */}
        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<Building2 size={18} />}
            label="Total departments"
            value={departments.length}
            description="Across your organization"
          />

          <SummaryCard
            icon={<Check size={18} />}
            label="Active"
            value={departments.filter((d) => d.status === 'active').length}
            description="Currently operating"
          />

          <SummaryCard
            icon={<Users size={18} />}
            label="Department heads"
            value={
              departments.filter(
                (d) => typeof d.head === 'object' && d.head,
              ).length
            }
            description="Assigned department heads"
          />
        </div>

        {/* TOOLBAR */}
        <div className="mt-7 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search departments..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
              />

              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                {(['all', 'active', 'inactive'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={[
                      'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition',
                      statusFilter === status
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900',
                    ].join(' ')}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {canManage && (
                <Button onClick={openCreate}>
                  <Plus size={15} />
                  Add
                </Button>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {filteredDepartments.length}{' '}
                {filteredDepartments.length === 1
                  ? 'department'
                  : 'departments'}
              </span>

              {(search || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                  }}
                  className="font-medium text-gray-900 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-4">
          {isLoading ? (
            <LoadingGrid />
          ) : isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : !filteredDepartments.length ? (
            <div className="rounded-2xl border border-gray-200 bg-white py-20">
              <EmptyState
                icon={<Layers size={42} />}
                title={
                  search || statusFilter !== 'all'
                    ? 'No departments found'
                    : 'No departments yet'
                }
                hint={
                  search || statusFilter !== 'all'
                    ? 'Try changing your search or filters'
                    : canManage
                      ? 'Create your first department to structure your organization'
                      : 'Departments will appear here'
                }
                action={
                  canManage && !search && statusFilter === 'all' ? (
                    <Button onClick={openCreate}>
                      <Plus size={16} />
                      New department
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* TABLE HEADER */}
              <div className="hidden grid-cols-[minmax(280px,2fr)_140px_minmax(180px,1fr)_130px_60px] border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400 md:grid">
                <span>Department</span>
                <span>Status</span>
                <span>Head</span>
                <span>Created</span>
                <span />
              </div>

              {/* ROWS */}
              <div className="divide-y divide-gray-100">
                {filteredDepartments.map((department) => {
                  const id = department.publicId ?? department._id

                  const head =
                    typeof department.head === 'object' && department.head
                      ? department.head
                      : null

                  return (
                    <div
                      key={id}
                      className="group relative grid gap-4 px-5 py-5 transition hover:bg-gray-50/60 md:grid-cols-[minmax(280px,2fr)_140px_minmax(180px,1fr)_130px_60px] md:items-center"
                    >
                      {/* DEPARTMENT */}
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                          <Building2 size={19} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-gray-900">
                              {department.name}
                            </h3>

                            {department.code && (
                              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                {department.code}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-gray-500">
                            {department.description || 'No description added'}
                          </p>
                        </div>
                      </div>

                      {/* STATUS */}
                      <div>
                        <Badge
                          color={
                            department.status === 'active'
                              ? 'green'
                              : 'gray'
                          }
                        >
                          {department.status}
                        </Badge>
                      </div>

                      {/* HEAD */}
                      <div className="flex min-w-0 items-center gap-3">
                        {head ? (
                          <>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                              {head.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-800">
                                {head.name}
                              </p>
                              <p className="truncate text-xs text-gray-400">
                                {head.email}
                              </p>
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No head assigned
                          </span>
                        )}
                      </div>

                      {/* DATE */}
                      <div>
                        <p className="text-xs text-gray-400">Created</p>
                        <p className="mt-1 text-sm text-gray-700">
                          {department.createdAt
                            ? new Date(
                                department.createdAt,
                              ).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>

                      {/* ACTIONS */}
                      <div className="relative flex justify-end">
                        {canManage && (
                          <>
                            <button
                              onClick={() =>
                                setMenuId(
                                  menuId === id ? null : id,
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900"
                            >
                              <MoreHorizontal size={18} />
                            </button>

                            {menuId === id && (
                              <>
                                <button
                                  className="fixed inset-0 z-10 cursor-default"
                                  onClick={() => setMenuId(null)}
                                />

                                <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                                  <button
                                    onClick={() =>
                                      openEdit(department)
                                    }
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Pencil size={15} />
                                    Edit department
                                  </button>

                                  <div className="my-1 border-t border-gray-100" />

                                  <button
                                    onClick={() =>
                                      handleDelete(id)
                                    }
                                    disabled={deletePending}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    <Trash2 size={15} />
                                    Delete department
                                  </button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* CREATE / EDIT MODAL */}
        <Modal
          open={showModal}
          onClose={closeModal}
          title={editingId ? 'Edit department' : 'New department'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                  <Building2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {editingId
                      ? 'Update department'
                      : 'Create department'}
                  </p>

                  <p className="text-xs text-gray-500">
                    Manage the department structure and ownership.
                  </p>
                </div>
              </div>
            </div>

            {/* NAME + CODE */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Department name" required>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                  placeholder="e.g. Engineering"
                  className="form-input"
                />
              </FormField>

              <FormField label="Code">
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      code: e.target.value,
                    }))
                  }
                  placeholder="e.g. ENG"
                  className="form-input uppercase"
                />
              </FormField>
            </div>

            {/* DESCRIPTION */}
            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="What does this department handle?"
                className="form-input resize-none"
              />
            </FormField>

            {/* HEAD */}
            <FormField label="Department head">
              <div className="relative">
                <select
                  value={form.head}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      head: e.target.value,
                    }))
                  }
                  className="form-input appearance-none pr-10"
                >
                  <option value="">Assign later</option>

                  {staff.map((u) => (
                    <option key={rid(u)} value={rid(u)}>
                      {u.name} — {u.role}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </FormField>

            {/* STATUS */}
            {editingId && (
              <FormField label="Status">
                <div className="grid grid-cols-2 gap-2">
                  {(['active', 'inactive'] as const).map((status) => (
                    <button
                      type="button"
                      key={status}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          status,
                        }))
                      }
                      className={[
                        'rounded-xl border px-4 py-3 text-left text-sm transition',
                        form.status === status
                          ? 'border-gray-900 bg-gray-50 text-gray-900'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">
                          {status}
                        </span>

                        {form.status === status && (
                          <Check size={16} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </FormField>
            )}

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* FOOTER */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Cancel
              </button>

              <Button
                type="submit"
                loading={createPending || updatePending}
              >
                {editingId ? (
                  <>
                    <Check size={16} />
                    Save changes
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create department
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(229 231 235);
          background: white;
          padding: 0.65rem 0.8rem;
          font-size: 0.875rem;
          color: rgb(17 24 39);
          outline: none;
          transition: all 150ms ease;
        }

        .form-input::placeholder {
          color: rgb(156 163 175);
        }

        .form-input:focus {
          border-color: rgb(17 24 39);
          box-shadow: 0 0 0 3px rgb(17 24 39 / 0.05);
        }
      `}</style>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode
  label: string
  value: number
  description: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  )
}