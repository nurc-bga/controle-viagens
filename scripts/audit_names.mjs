import mysql from "mysql2/promise";
function key(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const [table, column] of [["trips", "driverName"], ["departureArrivalRecords", "respondentName"]]) {
    const [rows] = await db.query(`SELECT DISTINCT ${column} AS name FROM ${table} WHERE ${column} IS NOT NULL AND TRIM(${column}) <> '' ORDER BY ${column}`);
    const groups = new Map();
    for (const row of rows) { const name = String(row.name).trim(); const k = key(name); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(name); }
    console.log(`--- ${table}.${column} ---`);
    for (const [k, variants] of groups) if (new Set(variants).size > 1) console.log(JSON.stringify({ key: k, variants }));
    console.log(`unique=${groups.size} raw=${rows.length}`);
  }
} finally { await db.end(); }
