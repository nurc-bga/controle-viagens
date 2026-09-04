import mysql from "mysql2/promise";
function normalize(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim(); }
function distance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) { const curr = [i]; for (let j = 1; j <= b.length; j++) curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); for (let j = 0; j <= b.length; j++) prev[j] = curr[j]; }
  return prev[b.length];
}
function similarity(a, b) { const longest = Math.max(a.length, b.length); return longest ? 1 - distance(a, b) / longest : 1; }
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await db.query("SELECT driverName AS name, 'Viagens' AS source FROM trips WHERE driverName IS NOT NULL AND TRIM(driverName) <> '' UNION SELECT respondentName AS name, 'Registros' AS source FROM departureArrivalRecords WHERE respondentName IS NOT NULL AND TRIM(respondentName) <> ''");
  const names = [...new Map(rows.map(row => [normalize(String(row.name)), String(row.name)])).entries()].map(([key, name]) => ({ key, name }));
  const pairs = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = names[i]; const b = names[j];
    if (a.key === b.key || a.key.length < 5 || b.key.length < 5) continue;
    const score = similarity(a.key, b.key);
    const firstA = a.key.split(" ")[0]; const firstB = b.key.split(" ")[0];
    if (score >= 0.78 || (firstA.length >= 5 && firstB.length >= 5 && similarity(firstA, firstB) >= 0.8 && score >= 0.65)) pairs.push({ score: Number(score.toFixed(3)), a: a.name, b: b.name });
  }
  pairs.sort((a, b) => b.score - a.score || a.a.localeCompare(b.a, "pt-BR"));
  console.log(JSON.stringify({ uniqueNames: names.length, candidates: pairs }, null, 2));
} finally { await db.end(); }
