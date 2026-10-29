import Student from "../models/student.js";
import { Class } from "../models/Class.js";

/**
 * User ids of the students a parent is linked to
 * (student.guardianUserIds), limited to the parent's institute.
 * A parent with no linked child gets an empty list, so every
 * parent-facing query matches nothing instead of the whole institute.
 */
export const childUserIdsFor = async (user) => {
  const children = await Student.find({
    guardianUserIds: user._id,
    instituteId: user.instituteId,
    isDeleted: { $ne: true },
  }).select("userId");

  return children.map((child) => child.userId);
};

/**
 * Class ids a student is enrolled in, or a parent's children are
 * enrolled in. Used to scope by-id fetches the same way the list
 * endpoints are scoped. Other roles get null (no extra restriction).
 */
export const visibleClassIdsFor = async (user) => {
  let userIds;

  if (user.role === "student") {
    userIds = [user._id];
  } else if (user.role === "parent") {
    userIds = await childUserIdsFor(user);
  } else {
    return null;
  }

  const classes = await Class.find({
    studentIds: { $in: userIds },
  }).select("_id");

  return classes.map((cls) => cls._id);
};
