import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./auth-schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | undefined;

function getDb(): DrizzleDb {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Configure it in your environment before querying the database.",
      );
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
  has(_target, prop) {
    return prop in (getDb() as object);
  },
});
