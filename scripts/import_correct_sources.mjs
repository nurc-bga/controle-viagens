import fs from 'node:fs';
import mysql from 'mysql2/promise';

const payload = JSON.parse(fs.readFileSync('/home/ubuntu/controle-viagens/scripts/import_payload.json', 'utf8'));
const db = await mysql.createConnection(process.env.DATABASE_URL);
const batches = (rows, size = 200) => { const result = []; for (let i = 0; i < rows.length; i += size) result.push(rows.slice(i, i + size)); return result; };
try {
  await db.beginTransaction();
  await db.query('DELETE FROM trips');
  await db.query('DELETE FROM `departureArrivalRecords`');
  await db.query('DELETE FROM vehicles');

  const vehicleRows = payload.vehicles.map(v => [v.plate, v.model ?? null, v.category ?? null, v.year ?? null, 1]);
  for (const batch of batches(vehicleRows)) {
    await db.query('INSERT INTO vehicles (plate, model, category, year, active) VALUES ?', [batch]);
  }

  const tripRows = payload.monthlyTrips.map(t => [t.tripDate, t.vehiclePlate, t.vehicleModel ?? null, t.driverName, t.origin ?? null, t.destination ?? null, t.purpose ?? null, t.distanceKm ?? 0, t.durationMinutes ?? 0, t.status, t.notes ?? null, t.importedFile ?? null, t.sourceSheet ?? null]);
  for (const batch of batches(tripRows)) {
    await db.query('INSERT INTO trips (tripDate, vehiclePlate, vehicleModel, driverName, origin, destination, purpose, distanceKm, durationMinutes, status, notes, importedFile, sourceSheet) VALUES ?', [batch]);
  }

  const recordRows = payload.records.map(r => [r.recordedAt, r.respondentName ?? null, r.employeeId ?? null, r.vehiclePlate, r.event ?? null, r.kmInitial ?? 0, r.kmFinal ?? 0, r.serviceType ?? null, r.summary ?? null, r.fuelLevel ?? null, r.vehicleCondition ?? null, r.irregularity ?? null, r.email ?? null, r.declaration ?? null, r.importedFile ?? null]);
  for (const batch of batches(recordRows)) {
    await db.query('INSERT INTO `departureArrivalRecords` (recordedAt, respondentName, employeeId, vehiclePlate, event, kmInitial, kmFinal, serviceType, summary, fuelLevel, vehicleCondition, irregularity, email, declaration, importedFile) VALUES ?', [batch]);
  }
  await db.commit();
  const [summary] = await db.query('SELECT (SELECT COUNT(*) FROM trips) AS monthlyTrips, (SELECT COUNT(*) FROM `departureArrivalRecords`) AS records, (SELECT COUNT(*) FROM vehicles) AS vehicles, (SELECT COUNT(DISTINCT sourceSheet) FROM trips) AS sheets');
  console.log(JSON.stringify({ summary: summary[0], sourceSheets: payload.monthlySheets.length }));
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
