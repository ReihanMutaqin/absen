import { relations } from "drizzle-orm";
import { users, departments, employees, faceEmbeddings, attendances, leaves } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  approvedEmployees: many(employees),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  approvedByUser: one(users, {
    fields: [employees.approvedBy],
    references: [users.id],
  }),
  faceEmbeddings: many(faceEmbeddings),
  attendances: many(attendances),
  leaves: many(leaves),
}));

export const faceEmbeddingsRelations = relations(faceEmbeddings, ({ one }) => ({
  employee: one(employees, {
    fields: [faceEmbeddings.employeeId],
    references: [employees.id],
  }),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  employee: one(employees, {
    fields: [attendances.employeeId],
    references: [employees.id],
  }),
}));

export const leavesRelations = relations(leaves, ({ one }) => ({
  employee: one(employees, {
    fields: [leaves.employeeId],
    references: [employees.id],
  }),
  approvedByUser: one(users, {
    fields: [leaves.approvedBy],
    references: [users.id],
  }),
}));
