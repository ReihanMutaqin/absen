import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { departmentRouter } from "./routers/department-router";
import { employeeRouter } from "./routers/employee-router";
import { attendanceRouter } from "./routers/attendance-router";
import { faceRouter } from "./routers/face-router";
import { leaveRouter } from "./routers/leave-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  department: departmentRouter,
  employee: employeeRouter,
  attendance: attendanceRouter,
  face: faceRouter,
  leave: leaveRouter,
});

export type AppRouter = typeof appRouter;
