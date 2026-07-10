import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { faceEmbeddings, employees } from "@db/schema";
import { eq } from "drizzle-orm";

// Euclidean distance calculation for face descriptors
function euclideanDistance(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) {
    throw new Error("Descriptors have different lengths");
  }
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export const faceRouter = createRouter({
  // Save face embedding for an employee
  saveEmbedding: publicQuery
    .input(
      z.object({
        employeeId: z.number(),
        descriptor: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Delete existing embeddings for this employee
      await db
        .delete(faceEmbeddings)
        .where(eq(faceEmbeddings.employeeId, input.employeeId));

      // Insert new embedding
      await db.insert(faceEmbeddings).values({
        employeeId: input.employeeId,
        descriptor: input.descriptor,
      });

      return { success: true, message: "Face embedding saved" };
    }),

  // Get face embeddings for an employee
  getByEmployeeId: publicQuery
    .input(z.object({ employeeId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(faceEmbeddings)
        .where(eq(faceEmbeddings.employeeId, input.employeeId));
      return result;
    }),

  // Get all approved employees with their face embeddings
  getAllApprovedWithFaces: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({
        employeeId: employees.id,
        employeeName: employees.name,
        employeeNik: employees.nik,
        facePhotoUrl: employees.facePhotoUrl,
        embeddingId: faceEmbeddings.id,
        descriptor: faceEmbeddings.descriptor,
      })
      .from(employees)
      .innerJoin(
        faceEmbeddings,
        eq(employees.id, faceEmbeddings.employeeId)
      )
      .where(eq(employees.status, "approved"));

    return result;
  }),

  // Compare face descriptor with all stored embeddings
  recognize: publicQuery
    .input(
      z.object({
        descriptor: z.array(z.number()),
        threshold: z.number().default(0.6),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const allEmbeddings = await db
        .select({
          employeeId: employees.id,
          employeeName: employees.name,
          employeeNik: employees.nik,
          facePhotoUrl: employees.facePhotoUrl,
          embeddingId: faceEmbeddings.id,
          descriptor: faceEmbeddings.descriptor,
        })
        .from(employees)
        .innerJoin(
          faceEmbeddings,
          eq(employees.id, faceEmbeddings.employeeId)
        )
        .where(eq(employees.status, "approved"));

      let bestMatch = null;
      let bestDistance = Infinity;

      for (const record of allEmbeddings) {
        const storedDescriptor = record.descriptor as number[];
        const distance = euclideanDistance(input.descriptor, storedDescriptor);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = record;
        }
      }

      const similarity = bestDistance !== Infinity ? Math.max(0, 1 - bestDistance) : 0;
      const isMatch = bestDistance <= input.threshold;

      return {
        matched: isMatch,
        similarity: Math.round(similarity * 100) / 100,
        distance: Math.round(bestDistance * 10000) / 10000,
        employee: isMatch
          ? {
              id: bestMatch?.employeeId,
              name: bestMatch?.employeeName,
              nik: bestMatch?.employeeNik,
              facePhotoUrl: bestMatch?.facePhotoUrl,
            }
          : null,
      };
    }),

  // Delete face embedding
  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(faceEmbeddings).where(eq(faceEmbeddings.id, input.id));
      return { success: true };
    }),
});
