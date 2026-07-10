import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  bigint,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

// ============================
// Users table (OAuth - Management)
// ============================
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================
// Departments table
// ============================
export const departments = mysqlTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

// ============================
// Employees table (Pegawai)
// ============================
export const employees = mysqlTable("employees", {
  id: serial("id").primaryKey(),
  nik: varchar("nik", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  departmentId: bigint("departmentId", { mode: "number", unsigned: true }).references(() => departments.id),
  position: varchar("position", { length: 255 }),
  facePhotoUrl: text("facePhotoUrl"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  shift: mysqlEnum("shift", ["pagi", "siang", "malam", "flexible"]).default("pagi").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }).references(() => users.id),
  approvedAt: timestamp("approvedAt"),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ============================
// Face Embeddings table
// ============================
export const faceEmbeddings = mysqlTable("face_embeddings", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  descriptor: json("descriptor").notNull(), // Array of 128 float values
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FaceEmbedding = typeof faceEmbeddings.$inferSelect;
export type InsertFaceEmbedding = typeof faceEmbeddings.$inferInsert;

// ============================
// Attendances table
// ============================
export const attendances = mysqlTable("attendances", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => employees.id),
  type: mysqlEnum("type", ["check_in", "check_out"]).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  time: varchar("time", { length: 8 }).notNull(), // HH:MM:SS
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  locationName: varchar("locationName", { length: 500 }),
  photoUrl: text("photoUrl"),
  faceMatched: mysqlEnum("faceMatched", ["yes", "no", "pending"]).default("pending").notNull(),
  faceSimilarity: decimal("faceSimilarity", { precision: 5, scale: 4 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attendance = typeof attendances.$inferSelect;
export type InsertAttendance = typeof attendances.$inferInsert;

// ============================
// Leaves table (Izin/Cuti)
// ============================
export const leaves = mysqlTable("leaves", {
  id: serial("id").primaryKey(),
  employeeId: bigint("employeeId", { mode: "number", unsigned: true })
    .notNull()
    .references(() => employees.id),
  type: mysqlEnum("type", ["sakit", "cuti", "izin", "dinas"]).notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(), // YYYY-MM-DD
  endDate: varchar("endDate", { length: 10 }).notNull(),     // YYYY-MM-DD
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: bigint("approvedBy", { mode: "number", unsigned: true }).references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = typeof leaves.$inferInsert;
