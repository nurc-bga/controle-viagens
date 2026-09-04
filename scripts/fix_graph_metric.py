from pathlib import Path
path = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
text = path.read_text()
old_decl = 'const totalKm = filteredTrips.reduce((sum, trip) => sum + (trip.distanceKm || 0), 0); const completedTrips = filteredTrips.filter(t => t.status === "Concluída").length; const uniqueVehicles = new Set(filteredTrips.map(t => t.vehiclePlate)).size; const uniqueDrivers = new Set(filteredTrips.map(t => t.driverName)).size;'
new_decl = 'const completedTrips = filteredTrips.filter(t => t.status === "Concluída").length; const uniqueVehicles = new Set(filteredTrips.map(t => t.vehiclePlate)).size; const uniqueDrivers = new Set(filteredTrips.map(t => t.driverName)).size; const uniqueDestinations = new Set(filteredTrips.map(t => t.destination).filter(Boolean)).size;'
if text.count(old_decl) != 1:
    raise SystemExit(f'declaration count: {text.count(old_decl)}')
text = text.replace(old_decl, new_decl)
old_card = '<StatCard label="Distância percorrida" value={`${totalKm.toLocaleString("pt-BR")} km`} detail="soma das viagens mensais" icon={ArrowDownUp} accent="bg-[#4f8f77]" />'
new_card = '<StatCard label="Destinos atendidos" value={uniqueDestinations.toLocaleString("pt-BR")} detail="localidades distintas" icon={MapPin} accent="bg-[#4f8f77]" />'
if text.count(old_card) != 1:
    raise SystemExit(f'card count: {text.count(old_card)}')
path.write_text(text.replace(old_card, new_card))
