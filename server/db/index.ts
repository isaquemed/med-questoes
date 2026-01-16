import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "./schema";

const pool = mysql.createPool({
  host: "localhost",
  user: "host",
  password: "M3dqu3st03s!",
  database: "med_questoes",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = drizzle(pool, {
  mode: "default", // <--- necessário
  schema,
});

export { schema };
