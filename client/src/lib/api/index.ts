import { organizationAPI } from "./organization";
import { userAPI } from "./user";
import { instituteAPI } from "./institute";
import { classAPI } from "./classes";
import { assignmentAPI } from "./assignments";
import { submissionAPI } from "./submissions";
import { attendanceAPI } from "./attendance";
import { studyMaterialAPI } from "./studyMaterials";
import { announcementAPI } from "./announcements";
import { payrollAPI } from "./payroll";
import { leaveAPI } from "./leaves";
import { departmentAPI } from "./departments";
import { statsAPI } from "./stats";

export { default as api } from "./axios";

export const API = {
  organizations: organizationAPI,
  users: userAPI,
  institutes: instituteAPI,
  classes: classAPI,
  assignments: assignmentAPI,
  submissions: submissionAPI,
  attendance: attendanceAPI,
  studyMaterials: studyMaterialAPI,
  announcements: announcementAPI,
  payroll: payrollAPI,
  leaves: leaveAPI,
  departments: departmentAPI,
  stats: statsAPI,
};

export default API;
