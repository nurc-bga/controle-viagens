import mysql from "mysql2/promise";
function key(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); }
function score(value) {
  const lower = (value.match(/[a-zà-ÿ]/g) || []).length;
  const accents = (value.match(/[À-ÿ]/g) || []).length;
  const allCapsPenalty = value === value.toUpperCase() ? 100 : 0;
  return lower + accents * 3 - allCapsPenalty;
}
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const [table, column] of [["trips", "driverName"], ["departureArrivalRecords", "respondentName"]]) {
    const [rows] = await db.query(`SELECT DISTINCT ${column} AS name FROM ${table} WHERE ${column} IS NOT NULL AND TRIM(${column}) <> ''`);
    const groups = new Map();
    for (const row of rows) { const name = String(row.name).trim(); const k = key(name); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(name); }
    let changed = 0;
    for (const variants of groups.values()) {
      const canonical = [...variants].sort((a, b) => score(b) - score(a) || a.localeCompare(b, "pt-BR"))[0];
      for (const variant of variants) {
        if (variant !== canonical) {
          const [result] = await db.query(`UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`, [canonical, variant]);
          changed += result.affectedRows ?? 0;
        }
      }
    }
    console.log(`${table}.${column}: groups=${groups.size}, changed=${changed}`);
  }
} finally { await db.end(); }
