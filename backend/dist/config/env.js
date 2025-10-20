export const isMockMode = String(process.env.MOCK_MODE ?? '').toLowerCase() === 'true' || !process.env.PG_URL;
export function describeMockMode() {
    if (!isMockMode) {
        return 'database';
    }
    if (process.env.PG_URL) {
        return 'mock_mode_forced';
    }
    return 'pg_url_missing';
}
