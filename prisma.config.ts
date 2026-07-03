import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://mock_user:mock_pass@localhost:5432/mock_db",
  },
  migrations: {
    seed: "npx tsx ./prisma/seed.ts",
  },
});
