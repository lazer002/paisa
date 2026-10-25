// client/scripts/generate-permissions.mjs
//
// Regenerates the client-side permission mirror from the server's RBAC
// matrix, which is the single source of truth.
//
//   node scripts/generate-permissions.mjs     (from client/)
//
// Run this whenever server/src/utils/permissions.js changes.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  rolePermissions,
} from '../../server/src/utils/permissions.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(here, '..', 'src', 'config', 'permissions.ts')

const permissionLines = Object.entries(PERMISSIONS)
  .map(([key, value]) => `  ${key}: '${value}',`)
  .join('\n')

const roleLines = Object.entries(rolePermissions)
  .map(
    ([role, perms]) =>
      `  ${role}: [\n${perms
        .map((p) => `    '${p}',`)
        .join('\n')}\n  ],`,
  )
  .join('\n')

const header = `/* eslint-disable */
// ---------------------------------------------------------------------------
// PERMISSIONS — client mirror (AUTO-GENERATED, do not edit by hand)
//
// Source of truth: server/src/utils/permissions.js
// Regenerate after changing the server matrix:
//     node scripts/generate-permissions.mjs     (from client/)
//
// The server is always the authority at request time; this mirror lets the
// UI predict the same allow/deny decisions without a network round-trip.
// ---------------------------------------------------------------------------

`

const body = `export const PERMISSIONS = {
${permissionLines}
} as const

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ALL_PERMISSIONS: readonly Permission[] = [
${ALL_PERMISSIONS.map((p) => `  '${p}',`).join('\n')}
]

/**
 * Permission grants per role. Mirrors \`rolePermissions\` on the server.
 * \`super_admin\` holds every permission by definition.
 */
export const ROLE_PERMISSIONS: Readonly<
  Record<string, readonly Permission[]>
> = {
${roleLines}
}

/**
 * Effective permission set for a role (unknown roles get nothing).
 */
export function permissionsForRole(
  role: string | null | undefined,
): readonly Permission[] {
  if (!role) return []
  return ROLE_PERMISSIONS[role] ?? []
}

/**
 * Does this role hold the given permission?
 */
export function roleCan(
  role: string | null | undefined,
  permission: Permission,
): boolean {
  if (role === 'super_admin') return true
  return permissionsForRole(role).includes(permission)
}

/**
 * Does this role hold ANY of the given permissions?
 */
export function roleCanAny(
  role: string | null | undefined,
  permissions: readonly Permission[],
): boolean {
  if (role === 'super_admin') return true
  if (permissions.length === 0) return false
  const granted = permissionsForRole(role)
  return permissions.some((permission) => granted.includes(permission))
}

/**
 * Does this role hold ALL of the given permissions?
 */
export function roleCanAll(
  role: string | null | undefined,
  permissions: readonly Permission[],
): boolean {
  if (role === 'super_admin') return true
  if (permissions.length === 0) return false
  const granted = permissionsForRole(role)
  return permissions.every((permission) => granted.includes(permission))
}
`

writeFileSync(outPath, header + body, 'utf8')
console.log(
  `Wrote ${path.relative(process.cwd(), outPath)} — ` +
    `${Object.keys(PERMISSIONS).length} permissions, ` +
    `${Object.keys(rolePermissions).length} roles.`,
)
