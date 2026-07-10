// Vercel serverless function entry point
// Hono uses Fetch API which is compatible with Vercel's serverless runtime
import app from "./boot";

export default app.fetch;
export const config = {
  runtime: "nodejs20.x",
};
