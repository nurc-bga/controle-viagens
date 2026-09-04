import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';

const mainFile = '/home/ubuntu/Downloads/BARRA DO GARÇAS - Respostas ao formulário 1.csv';
const vehicleFile = '/home/ubuntu/Downloads/Controle de Viagens_Veículos - MAIO 2022.csv';

function parseLine(line) {
  const values = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') { current += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { values.push(current.trim()); current = ''; continue; }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function normalize(value) {
  return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
function numberPt(value) {
  const cleaned = String(value || '').replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
function dateBr(value) {
  const match = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2}))?/);
  if (!match) return new Date('2022-05-01T12:00:00Z');
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] || 12), Number(match[5] || 0), Number(match[6] || 0)));
}
function dateMay2022(day) {
  return new Date(Date.UTC(2022, 4, Number(day || 1), 12, 0, 0));
}
function modelFromVehicle(value) {
  return String(value || '').split(' - ')[0].trim() || null;
}
function splitLines(file) {
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim().length > 0);
}

const mainLines = splitLines(mainFile);
const mainHeaders = parseLine(mainLines[0]);
const mainRows = mainLines.slice(1).map(line => Object.fromEntries(mainHeaders.map((header, index) => [header, parseLine(line)[index] || ''])));
const get = (row, names) => {
  const key = Object.keys(row).find(existing => names.some(name => normalize(existing) === normalize(name)));
  return key ? row[key] : '';
};

const trips = [];
const vehicleMap = new Map();
const lastInitialByVehicle = new Map();
for (const row of mainRows) {
  const vehicle = get(row, ['SELECIONE O VEÍCULO']) || 'Não informado';
  const driver = get(row, ['NOME DO RESPONDENTE']) || get(row, ['Endereço de e-mail']) || `Matrícula ${get(row, ['INFORME SUA MATRÍCULA:'])}`;
  const event = get(row, ['QUAL EVENTO DO CHECK LIST?']);
  const purpose = get(row, ['TIPO DE ATENDIMENTO']);
  const summary = get(row, ['RESUMO DO ATENDIMENTO']);
  const initial = numberPt(get(row, ['KM INICIAL']));
  const final = numberPt(get(row, ['KM FINAL']));
  if (!get(row, ['Carimbo de data/hora']) || vehicle === 'Não informado' && !driver) continue;
  const plate = vehicle.trim().toUpperCase();
  const eventKey = normalize(event);
  let distanceKm = initial > 0 && final > initial ? final - initial : 0;
  if (eventKey.includes('saida') && initial > 0) lastInitialByVehicle.set(plate, initial);
  if (eventKey.includes('chegada') && final > 0 && lastInitialByVehicle.has(plate)) {
    const pairedInitial = lastInitialByVehicle.get(plate);
    if (final > pairedInitial) distanceKm = final - pairedInitial;
    lastInitialByVehicle.delete(plate);
  }
  const trip = {
    tripDate: dateBr(get(row, ['Carimbo de data/hora'])),
    vehiclePlate: plate,
    vehicleModel: modelFromVehicle(vehicle),
    driverName: driver.trim() || 'Não informado',
    origin: null,
    destination: null,
    purpose: purpose || event || 'Controle de viagem',
    distanceKm,
    durationMinutes: 0,
    status: 'Concluída',
    notes: [event, summary].filter(Boolean).join(' — ') || null,
    importedFile: path.basename(mainFile),
  };
  trips.push(trip);
  vehicleMap.set(plate, { plate, model: trip.vehicleModel, category: 'Frota operacional', year: null });
}

const vehicleLines = splitLines(vehicleFile);
const vehicleHeader = parseLine(vehicleLines[0]);
const vehicleNames = parseLine(vehicleLines[1]);
let currentDay = 1;
for (const line of vehicleLines.slice(2)) {
  const cells = parseLine(line);
  if (cells[0]) currentDay = Number(cells[0]) || currentDay;
  const destination = cells[2] || null;
  const purpose = cells[3] || null;
  const driver = cells[4] || null;
  const markers = cells.slice(5, 8);
  if (!driver && !destination && !purpose) continue;
  markers.forEach((marker, index) => {
    if (!marker || marker === '-') return;
    const vehicleName = (vehicleNames[5 + index] || vehicleHeader[5 + index] || `Veículo ${index + 1}`).trim().toUpperCase();
    trips.push({
      tripDate: dateMay2022(currentDay), vehiclePlate: vehicleName, vehicleModel: vehicleName,
      driverName: driver || 'Não informado', origin: 'Barra do Garças, MT', destination,
      purpose: purpose || 'Controle de viagem', distanceKm: 0, durationMinutes: 0,
      status: 'Concluída', notes: cells[8] || null, importedFile: path.basename(vehicleFile),
    });
    vehicleMap.set(vehicleName, { plate: vehicleName, model: vehicleName, category: 'Frota operacional', year: 2022 });
  });
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [countRows] = await connection.query('SELECT COUNT(*) AS total FROM trips');
  const currentTotal = Number(countRows[0].total);
  if (currentTotal > 0 && !process.argv.includes('--replace')) throw new Error(`Importação interrompida: a tabela trips já possui ${currentTotal} registros. Use --replace somente para reconstruir a importação atual.`);
  if (process.argv.includes('--replace')) await connection.query('DELETE FROM trips WHERE importedFile IN (?, ?)', [path.basename(mainFile), path.basename(vehicleFile)]);
  for (const vehicle of vehicleMap.values()) {
    await connection.query('INSERT INTO vehicles (plate, model, category, year) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE model = VALUES(model), category = VALUES(category), year = VALUES(year)', [vehicle.plate, vehicle.model, vehicle.category, vehicle.year]);
  }
  const tripSql = 'INSERT INTO trips (tripDate, vehiclePlate, vehicleModel, driverName, origin, destination, purpose, distanceKm, durationMinutes, status, notes, importedFile) VALUES ?';
  for (let index = 0; index < trips.length; index += 100) {
    const batch = trips.slice(index, index + 100);
    await connection.query(tripSql, [batch.map(trip => [trip.tripDate, trip.vehiclePlate, trip.vehicleModel, trip.driverName, trip.origin, trip.destination, trip.purpose, trip.distanceKm, trip.durationMinutes, trip.status, trip.notes, trip.importedFile])]);
  }
  const [result] = await connection.query('SELECT COUNT(*) AS trips, COUNT(DISTINCT vehiclePlate) AS vehicles FROM trips');
  console.log(JSON.stringify({ importedTrips: trips.length, vehicles: vehicleMap.size, totals: result[0] }));
} finally {
  await connection.end();
}
