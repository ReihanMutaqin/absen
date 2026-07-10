// Vercel serverless function entry point
import app from "../server/boot";

export default app.fetch;

export const config = {
  runtime: "nodejs",
};
