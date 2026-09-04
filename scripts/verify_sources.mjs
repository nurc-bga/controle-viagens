import mysql from 'mysql2/promise';
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [summary] = await db.query("SELECT (SELECT COUNT(*) FROM trips) AS monthlyTrips, (SELECT COUNT(DISTINCT sourceSheet) FROM trips) AS monthlySheets, DATE_FORMAT((SELECT MIN(tripDate) FROM trips), '%Y-%m-%d') AS monthlyStart, DATE_FORMAT((SELECT MAX(tripDate) FROM trips), '%Y-%m-%d') AS monthlyEnd, (SELECT COUNT(*) FROM `departureArrivalRecords`) AS rawRecords, DATE_FORMAT((SELECT MIN(recordedAt) FROM `departureArrivalRecords`), '%Y-%m-%d') AS rawStart, DATE_FORMAT((SELECT MAX(recordedAt) FROM `departureArrivalRecords`), '%Y-%m-%d') AS rawEnd, (SELECT COUNT(*) FROM vehicles) AS vehicles, (SELECT COUNT(DISTINCT vehiclePlate) FROM trips) AS monthlyVehicleRefs, (SELECT COUNT(DISTINCT vehiclePlate) FROM `departureArrivalRecords`) AS rawVehicleRefs");
  const [sheets] = await db.query('SELECT sourceSheet, COUNT(*) AS trips FROM trips GROUP BY sourceSheet ORDER BY sourceSheet');
  console.log(JSON.stringify({ summary: summary[0], sheets }, null, 2));
} finally { await db.end(); }
