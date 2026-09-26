import { User, Roles } from "../models/user.js";
import bcrypt from "bcryptjs";
import Organization from "../models/organization.js";

// Shared helpers for role-based people controllers (employee / hr / student)

const hashPassword = async (plain) => bcrypt.hash(String(plain), 10);

const resolveInstitute = async (actor, requested) => {
  // super_admin may target any org; everyone else is pinned to their own
  if (actor.role === Roles.SUPER_ADMIN) {
    if (requested) {
      const org = await Organization.findById(requested).select("_id").lean();
      if (!org) return null;
      return requested;
    }
    return null; // platform account
  }
  return actor.instituteId;
};

const scopedQuery = (actor) =>
  actor.role === Roles.SUPER_ADMIN ? {} : { instituteId: actor.instituteId };

export { hashPassword, resolveInstitute, scopedQuery, Roles };
