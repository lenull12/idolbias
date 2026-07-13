import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}
