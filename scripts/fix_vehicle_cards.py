from pathlib import Path
path = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
text = path.read_text()
old = 'const itemTrips = allTrips.filter(t => t.vehiclePlate === item.plate); const itemRecords = rawRecords.filter(r => r.vehiclePlate === item.plate);'
new = 'const itemTrips = vehicleFilteredTrips.filter(t => t.vehiclePlate === item.plate); const itemRecords = vehicleFilteredRecords.filter(r => r.vehiclePlate === item.plate);'
if text.count(old) != 1:
    raise SystemExit(f'card source count: {text.count(old)}')
path.write_text(text.replace(old, new))
