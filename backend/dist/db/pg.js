import { Pool } from "pg";
import { describeMockMode, isMockMode } from "../config/env.js";
const connectionString = process.env.PG_URL;
if (!connectionString && !isMockMode) {
    throw new Error("PG_URL must be provided when mock mode is disabled");
}
function createMockPool() {
    const reason = describeMockMode();
    console.warn(`[database] Running in mock mode (${reason}). Database connections are disabled.`);
    return {
        async query() {
            throw new Error("Database query attempted while running in mock mode");
        },
    };
}
const realPool = !isMockMode
    ? new Pool({
        connectionString: connectionString,
        ssl: /sslmode=require/i.test(connectionString)
            ? { rejectUnauthorized: false }
            : undefined,
    })
    : null;
export const pool = realPool ?? createMockPool();
if (realPool) {
    realPool.on("error", (err) => {
        console.error("Unexpected database error", err);
    });
}
export async function ensureDbReady() {
    if (isMockMode || !realPool) {
        return;
    }
    await realPool.query("select 1");
}
export { isMockMode, describeMockMode };
