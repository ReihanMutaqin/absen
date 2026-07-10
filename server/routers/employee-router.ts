import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { employees, departments, faceEmbeddings } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const employeeRouter = createRouter({
  // Register new employee (public - no auth required)
  register: publicQuery
    .input(
      z.object({
        nik: z.string().min(1).max(50),
        name: z.string().min(1).max(255),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().max(20).optional().or(z.literal("")),
        departmentId: z.number().optional(),
        position: z.string().max(255).optional().or(z.literal("")),
        shift: z.enum(["pagi", "siang", "malam", "flexible"]).default("pagi"),
        facePhotoUrl: z.string().optional(),
        faceDescriptor: z.array(z.number()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if NIK already exists
      const existing = await db
        .select()
        .from(employees)
        .where(eq(employees.nik, input.nik));

      if (existing.length > 0) {
        throw new Error("NIK sudah terdaftar");
      }

      // Insert employee
      const result = await db.insert(employees).values({
        nik: input.nik,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        departmentId: input.departmentId || null,
        position: input.position || null,
        shift: input.shift,
        facePhotoUrl: input.facePhotoUrl || null,
        status: "pending",
      });

      const employeeId = Number(result[0].insertId);

      // Insert face embedding if provided
      if (input.faceDescriptor && input.faceDescriptor.length > 0) {
        await db.insert(faceEmbeddings).values({
          employeeId,
          descriptor: input.faceDescriptor,
        });
      }

      return { success: true, employeeId, message: "Pendaftaran berhasil, menunggu persetujuan admin" };
    }),

  // List all employees (admin only)
  list: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        id: employees.id,
        nik: employees.nik,
        name: employees.name,
        email: employees.email,
        phone: employees.phone,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        position: employees.position,
        facePhotoUrl: employees.facePhotoUrl,
        status: employees.status,
        shift: employees.shift,
        createdAt: employees.createdAt,
        approvedAt: employees.approvedAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .orderBy(desc(employees.createdAt));

    return result;
  }),

  // Get employee by ID
  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          id: employees.id,
          nik: employees.nik,
          name: employees.name,
          email: employees.email,
          phone: employees.phone,
          departmentId: employees.departmentId,
          departmentName: departments.name,
          position: employees.position,
          facePhotoUrl: employees.facePhotoUrl,
          status: employees.status,
          shift: employees.shift,
          createdAt: employees.createdAt,
          approvedAt: employees.approvedAt,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(employees.id, input.id));

      return result[0] ?? null;
    }),

  // Get employee by NIK
  getByNik: publicQuery
    .input(z.object({ nik: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select({
          id: employees.id,
          nik: employees.nik,
          name: employees.name,
          email: employees.email,
          phone: employees.phone,
          departmentId: employees.departmentId,
          departmentName: departments.name,
          position: employees.position,
          facePhotoUrl: employees.facePhotoUrl,
          status: employees.status,
          shift: employees.shift,
          createdAt: employees.createdAt,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(employees.nik, input.nik));

      return result[0] ?? null;
    }),

  // Approve employee (admin only)
  approve: publicQuery
    .input(
      z.object({
        id: z.number(),
        approvedBy: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(employees)
        .set({
          status: "approved",
          approvedBy: input.approvedBy,
          approvedAt: new Date(),
        })
        .where(eq(employees.id, input.id));

      return { success: true, message: "Pegawai berhasil disetujui" };
    }),

  // Reject employee
  reject: publicQuery
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(employees)
        .set({ status: "rejected" })
        .where(eq(employees.id, input.id));

      return { success: true, message: "Pegawai ditolak" };
    }),

  // Update employee
  update: publicQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        departmentId: z.number().optional(),
        position: z.string().optional(),
        shift: z.enum(["pagi", "siang", "malam", "flexible"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      await db.update(employees).set(data).where(eq(employees.id, id));
      return { success: true, message: "Data pegawai diperbarui" };
    }),

  // Delete employee
  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(employees).where(eq(employees.id, input.id));
      return { success: true, message: "Pegawai dihapus" };
    }),

  // Get statistics
  stats: publicQuery.query(async () => {
    const db = getDb();
    const allEmployees = await db.select().from(employees);
    const pending = allEmployees.filter((e) => e.status === "pending").length;
    const approved = allEmployees.filter((e) => e.status === "approved").length;
    const rejected = allEmployees.filter((e) => e.status === "rejected").length;
    const total = allEmployees.length;

    return { total, pending, approved, rejected };
  }),
});
