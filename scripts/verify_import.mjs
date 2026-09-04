import mysql from 'mysql2/promise';
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [summary] = await db.query('SELECT COUNT(*) AS totalViagens, COUNT(DISTINCT vehiclePlate) AS totalVeiculos, DATE_FORMAT(MIN(tripDate), \'%Y-%m-%d\') AS dataInicial, DATE_FORMAT(MAX(tripDate), \'%Y-%m-%d\') AS dataFinal, SUM(distanceKm) AS distanciaTotalKm, SUM(tripDate > \'2026-08-31 23:59:59\') AS foraDoPeriodo FROM trips');
  const [files] = await db.query('SELECT importedFile, COUNT(*) AS registros FROM trips GROUP BY importedFile ORDER BY registros DESC');
  const [vehicles] = await db.query('SELECT COUNT(*) AS totalVeiculosCadastrados FROM vehicles');
  console.log(JSON.stringify({ summary: summary[0], files, vehicles: vehicles[0] }, null, 2));
} finally { await db.end(); }
