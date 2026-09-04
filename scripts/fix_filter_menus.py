from pathlib import Path
p = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
t = p.read_text()
anchor = 'function formatDate(value: string | Date | null | undefined) {'
helper = 'function alphaSort(values: string[]) { return [...values].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base", numeric: true })); }\n'
if helper not in t:
    t = t.replace(anchor, helper + anchor)
t = t.replace('Array.from(new Set(trips.map(t => t.vehiclePlate).filter(Boolean))).sort()', 'alphaSort(Array.from(new Set(trips.map(t => t.vehiclePlate).filter(Boolean))) as string[])')
t = t.replace('Array.from(new Set(trips.map(t => t.driverName).filter(Boolean))).sort()', 'alphaSort(Array.from(new Set(trips.map(t => t.driverName).filter(Boolean))) as string[])')
t = t.replace('Array.from(new Set(trips.map(t => t.destination).filter(Boolean))).sort()', 'alphaSort(Array.from(new Set(trips.map(t => t.destination).filter(Boolean))) as string[])')
t = t.replace('Array.from(new Set(records.map(r => r.vehiclePlate).filter(Boolean))).sort()', 'alphaSort(Array.from(new Set(records.map(r => r.vehiclePlate).filter(Boolean))) as string[])')
t = t.replace('Array.from(new Set(records.map(r => r.event).filter(Boolean))).sort()', 'alphaSort(Array.from(new Set(records.map(r => r.event).filter(Boolean))) as string[])')
t = t.replace('<SelectContent>', '<SelectContent className="bg-white text-[#14283f] border-[#dce5de] shadow-xl z-50">')
p.write_text(t)
