import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { leaves, employees, departments } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const leaveRouter = createRouter({
  // Submit leave request (public - employee submits by NIK)
  submit: publicQuery
    .input(
      z.object({
        employeeId: z.number(),
        type: z.enum(["sakit", "cuti", "izin", "dinas"]),
        startDate: z.string(),
        endDate: z.string(),
        reason: z.string().min(5),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Verify employee exists and is approved
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, input.employeeId));

      if (employee.length === 0) {
        throw new Error("Pegawai tidak ditemukan");
      }
      if (employee[0].status !== "approved") {
        throw new Error("Pegawai belum disetujui oleh admin");
      }

      const result = await db.insert(leaves).values({
        employeeId: input.employeeId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
        status: "pending",
      });

      return {
        success: true,
        leaveId: Number(result[0].insertId),
        message: "Permohonan izin berhasil dikirim, menunggu persetujuan admin",
      };
    }),

  // Get leave history for an employee
  getByEmployee: publicQuery
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(leaves)
        .where(eq(leaves.employeeId, input.employeeId))
        .orderBy(desc(leaves.createdAt));
      return result;
    }),

  // List all leaves (admin)
  list: publicQuery
    .input(
      z
        .object({
          status: z.enum(["pending", "approved", "rejected"]).optional(),
          limit: z.number().default(100),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = getDb();

      const result = await db
        .select({
          id: leaves.id,
          employeeId: leaves.employeeId,
          employeeName: employees.name,
          employeeNik: employees.nik,
          departmentName: departments.name,
          type: leaves.type,
          startDate: leaves.startDate,
          endDate: leaves.endDate,
          reason: leaves.reason,
          status: leaves.status,
          notes: leaves.notes,
          createdAt: leaves.createdAt,
          approvedAt: leaves.approvedAt,
        })
        .from(leaves)
        .leftJoin(employees, eq(leaves.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .orderBy(desc(leaves.createdAt))
        .limit(input?.limit ?? 100);

      if (input?.status) {
        return result.filter((l) => l.status === input.status);
      }
      return result;
    }),

  // Approve leave
  approve: publicQuery
    .input(
      z.object({
        id: z.number(),
        approvedBy: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(leaves)
        .set({
          status: "approved",
          approvedBy: input.approvedBy,
          approvedAt: new Date(),
          notes: input.notes ?? null,
        })
        .where(eq(leaves.id, input.id));

      return { success: true, message: "Izin disetujui" };
    }),

  // Reject leave
  reject: publicQuery
    .input(
      z.object({
        id: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      await db
        .update(leaves)
        .set({
          status: "rejected",
          notes: input.notes ?? null,
        })
        .where(eq(leaves.id, input.id));

      return { success: true, message: "Izin ditolak" };
    }),

  // Pending count (for badge)
  pendingCount: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select()
      .from(leaves)
      .where(eq(leaves.status, "pending"));
    return { count: result.length };
  }),
});
