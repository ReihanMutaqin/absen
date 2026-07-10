import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { departments } from "@db/schema";
import { eq } from "drizzle-orm";

export const departmentRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(departments).orderBy(departments.name);
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(departments)
        .where(eq(departments.id, input.id));
      return result[0] ?? null;
    }),
});
