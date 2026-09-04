import mysql from "mysql2/promise";
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.query("SELECT respondentName AS name, email, employeeId FROM departureArrivalRecords WHERE respondentName IS NOT NULL AND TRIM(respondentName) <> ''");
  for (const field of ["email", "employeeId"]) {
    const groups = new Map();
    for (const row of rows) {
      const value = String(row[field] ?? "").trim().toLowerCase();
      if (!value || value === "null") continue;
      if (!groups.has(value)) groups.set(value, new Set());
      groups.get(value).add(String(row.name).trim());
    }
    console.log(`--- mesmo ${field} ---`);
    for (const [value, names] of groups) if (names.size > 1) console.log(JSON.stringify({ value, names: [...names] }));
  }
} finally { await db.end(); }
