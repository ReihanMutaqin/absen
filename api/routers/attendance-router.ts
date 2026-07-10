import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { attendances, employees, departments } from "@db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export const attendanceRouter = createRouter({
  // Check-in or Check-out
  record: publicQuery
    .input(
      z.object({
        employeeId: z.number(),
        type: z.enum(["check_in", "check_out"]),
        date: z.string(), // YYYY-MM-DD
        time: z.string(), // HH:MM:SS
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        locationName: z.string().optional(),
        photoUrl: z.string().optional(),
        faceMatched: z.enum(["yes", "no", "pending"]).default("pending"),
        faceSimilarity: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if employee exists and is approved
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

      // Check if already checked in/out today
      const existing = await db
        .select()
        .from(attendances)
        .where(
          and(
            eq(attendances.employeeId, input.employeeId),
            eq(attendances.date, input.date),
            eq(attendances.type, input.type)
          )
        );

      if (existing.length > 0) {
        throw new Error(
          input.type === "check_in"
            ? "Anda sudah check-in hari ini"
            : "Anda sudah check-out hari ini"
        );
      }

      const result = await db.insert(attendances).values({
        employeeId: input.employeeId,
        type: input.type,
        date: input.date,
        time: input.time,
        latitude: input.latitude || null,
        longitude: input.longitude || null,
        locationName: input.locationName || null,
        photoUrl: input.photoUrl || null,
        faceMatched: input.faceMatched,
        faceSimilarity: input.faceSimilarity || null,
        notes: input.notes || null,
      });

      return {
        success: true,
        attendanceId: Number(result[0].insertId),
        message: input.type === "check_in" ? "Check-in berhasil" : "Check-out berhasil",
      };
    }),

  // Get today's attendance for an employee
  getToday: publicQuery
    .input(
      z.object({
        employeeId: z.number(),
        date: z.string(), // YYYY-MM-DD
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(attendances)
        .where(
          and(
            eq(attendances.employeeId, input.employeeId),
            eq(attendances.date, input.date)
          )
        )
        .orderBy(attendances.time);

      return result;
    }),

  // Get attendance history for an employee
  getHistory: publicQuery
    .input(
      z.object({
        employeeId: z.number(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions = [eq(attendances.employeeId, input.employeeId)];

      if (input.startDate && input.endDate) {
        conditions.push(
          and(
            gte(attendances.date, input.startDate),
            lte(attendances.date, input.endDate)
          )!
        );
      }

      const result = await db
        .select({
          id: attendances.id,
          employeeId: attendances.employeeId,
          type: attendances.type,
          date: attendances.date,
          time: attendances.time,
          latitude: attendances.latitude,
          longitude: attendances.longitude,
          locationName: attendances.locationName,
          photoUrl: attendances.photoUrl,
          faceMatched: attendances.faceMatched,
          faceSimilarity: attendances.faceSimilarity,
          notes: attendances.notes,
          createdAt: attendances.createdAt,
        })
        .from(attendances)
        .where(and(...conditions))
        .orderBy(desc(attendances.date), desc(attendances.time))
        .limit(input.limit);

      return result;
    }),

  // Get all attendances (admin view)
  list: publicQuery
    .input(
      z.object({
        date: z.string().optional(),
        departmentId: z.number().optional(),
        limit: z.number().default(100),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];

      if (input?.date) {
        conditions.push(eq(attendances.date, input.date));
      }

      const baseQuery = db
        .select({
          id: attendances.id,
          employeeId: attendances.employeeId,
          employeeName: employees.name,
          employeeNik: employees.nik,
          departmentName: departments.name,
          type: attendances.type,
          date: attendances.date,
          time: attendances.time,
          latitude: attendances.latitude,
          longitude: attendances.longitude,
          locationName: attendances.locationName,
          faceMatched: attendances.faceMatched,
          faceSimilarity: attendances.faceSimilarity,
          notes: attendances.notes,
          createdAt: attendances.createdAt,
        })
        .from(attendances)
        .leftJoin(employees, eq(attendances.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id));

      let result;
      if (conditions.length > 0) {
        result = await baseQuery
          .where(and(...conditions))
          .orderBy(desc(attendances.date), desc(attendances.time))
          .limit(input?.limit || 100);
      } else {
        result = await baseQuery
          .orderBy(desc(attendances.date), desc(attendances.time))
          .limit(input?.limit || 100);
      }

      return result;
    }),

  // Get attendance statistics
  stats: publicQuery
    .input(
      z.object({
        date: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = getDb();
      const today = input?.date || new Date().toISOString().split("T")[0];

      const todayAttendances = await db
        .select()
        .from(attendances)
        .where(eq(attendances.date, today));

      const checkIns = todayAttendances.filter((a) => a.type === "check_in").length;
      const checkOuts = todayAttendances.filter((a) => a.type === "check_out").length;
      const faceMatched = todayAttendances.filter((a) => a.faceMatched === "yes").length;
      const facePending = todayAttendances.filter((a) => a.faceMatched === "pending").length;
      const faceNotMatched = todayAttendances.filter((a) => a.faceMatched === "no").length;

      return {
        date: today,
        totalRecords: todayAttendances.length,
        checkIns,
        checkOuts,
        faceMatched,
        facePending,
        faceNotMatched,
      };
    }),
});
