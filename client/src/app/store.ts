import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'

import authReducer from '@/lib/store/authSlice'
import { organizationsApi } from '@/features/organizations/organizationsApi'
import { usersApi } from '@/features/users/usersApi'
import { announcementsApi } from '@/features/announcements/announcementsApi'
import { classesApi } from '@/features/classes/classesApi'
import { attendanceApi } from '@/features/attendance/attendanceApi'
import { payrollApi } from '@/features/payroll/payrollApi'
import { leavesApi } from '@/features/leaves/leavesApi'
import { statsApi } from '@/features/stats/statsApi'
import { studentsApi } from '@/features/students/studentsApi'
import { employeesApi, hrsApi } from '@/features/people/peopleApi'
import { departmentsApi } from '@/features/departments/departmentsApi'
import { assignmentsApi, materialsApi, submissionsApi } from '@/features/assignments/assignmentsApi'
import { userDetailApi } from '@/features/users/userDetailApi'
import { assessmentApi } from '@/features/assessment/assessmentApi'
import { platformApi } from '@/features/platform/platformApi'
import { messagingApi } from '@/features/messaging/messagingApi'
import { notificationsApi } from '@/features/notifications/notificationsApi'

const rootReducer = combineReducers({
  auth: authReducer,
  [organizationsApi.reducerPath]: organizationsApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [announcementsApi.reducerPath]: announcementsApi.reducer,
  [classesApi.reducerPath]: classesApi.reducer,
  [attendanceApi.reducerPath]: attendanceApi.reducer,
  [payrollApi.reducerPath]: payrollApi.reducer,
  [leavesApi.reducerPath]: leavesApi.reducer,
  [statsApi.reducerPath]: statsApi.reducer,
  [studentsApi.reducerPath]: studentsApi.reducer,
  [employeesApi.reducerPath]: employeesApi.reducer,
  [hrsApi.reducerPath]: hrsApi.reducer,
  [departmentsApi.reducerPath]: departmentsApi.reducer,
  [assignmentsApi.reducerPath]: assignmentsApi.reducer,
  [materialsApi.reducerPath]: materialsApi.reducer,
  [submissionsApi.reducerPath]: submissionsApi.reducer,
  [userDetailApi.reducerPath]: userDetailApi.reducer,
  [assessmentApi.reducerPath]: assessmentApi.reducer,
  [platformApi.reducerPath]: platformApi.reducer,
  [messagingApi.reducerPath]: messagingApi.reducer,
  [notificationsApi.reducerPath]: notificationsApi.reducer,
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefault) =>
    getDefault().concat(
      organizationsApi.middleware,
      usersApi.middleware,
      announcementsApi.middleware,
      classesApi.middleware,
      attendanceApi.middleware,
      payrollApi.middleware,
      leavesApi.middleware,
      statsApi.middleware,
      studentsApi.middleware,
      employeesApi.middleware,
      hrsApi.middleware,
      departmentsApi.middleware,
      assignmentsApi.middleware,
      materialsApi.middleware,
      submissionsApi.middleware,
      userDetailApi.middleware,
      assessmentApi.middleware,
      platformApi.middleware,
      messagingApi.middleware,
      notificationsApi.middleware,
    ),
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
