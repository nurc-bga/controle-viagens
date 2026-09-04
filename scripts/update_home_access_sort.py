from pathlib import Path
import re

path = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
text = path.read_text()

text = text.replace('import { useMemo, useRef, useState } from "react";', 'import { useMemo, useState } from "react";')
text = text.replace('CircleAlert, ClipboardList, FileUp, Filter, Gauge, LayoutDashboard,', 'CircleAlert, ClipboardList, Filter, Gauge, LayoutDashboard,')

text = text.replace('  const tripsQuery = trpc.trips.list.useQuery(undefined, { enabled: Boolean(user) });\n  const vehiclesQuery = trpc.vehicles.list.useQuery(undefined, { enabled: Boolean(user) });\n  const recordsQuery = trpc.departureArrival.list.useQuery(undefined, { enabled: Boolean(user) });\n  const teamQuery = trpc.team.list.useQuery(undefined, { enabled: Boolean(user && user.role === "admin") });\n  const importMutation = trpc.trips.importCsv.useMutation({ onSuccess: result => { toast.success(`${result.imported} viagens importadas com sucesso.`); tripsQuery.refetch(); vehiclesQuery.refetch(); }, onError: error => toast.error(error.message) });\n', '  const visitorAccessQuery = trpc.auth.visitorAccess.useQuery();\n  const canViewData = Boolean(user) || visitorAccessQuery.data === true;\n  const tripsQuery = trpc.trips.list.useQuery(undefined, { enabled: canViewData });\n  const vehiclesQuery = trpc.vehicles.list.useQuery(undefined, { enabled: canViewData });\n  const recordsQuery = trpc.departureArrival.list.useQuery(undefined, { enabled: canViewData });\n  const teamQuery = trpc.team.list.useQuery(undefined, { enabled: Boolean(user && user.role === "admin") });\n  const visitorMutation = trpc.auth.setVisitorAccess.useMutation({ onSuccess: enabled => { visitorAccessQuery.refetch(); toast.success(enabled ? "Visitantes liberados." : "Visitantes bloqueados."); }, onError: error => toast.error(error.message) });\n')

text = text.replace('  const [tripSearch, setTripSearch] = useState(""); const [tripView, setTripView] = useState<"table" | "cards">("table");', '  const [tripSearch, setTripSearch] = useState(""); const [tripView, setTripView] = useState<"table" | "cards">("table");\n  const [tripSort, setTripSort] = useState<SortState>({ key: "tripDate", direction: "desc" }); const [recordSort, setRecordSort] = useState<SortState>({ key: "recordedAt", direction: "desc" });')
text = text.replace('  const fileInput = useRef<HTMLInputElement>(null);\n', '')
text = text.replace('  const rawTrips = (tripsQuery.data ?? []) as Trip[]; const usingDemo = false; const allTrips = rawTrips;', '  const rawTrips = (tripsQuery.data ?? []) as Trip[]; const allTrips = rawTrips;')

text = re.sub(r'  const handleFile = async \(event: React\.ChangeEvent<HTMLInputElement>\) => \{.*?\};\n', '', text)

# Replace filter derivations with sorted filtered arrays.
lines = text.splitlines()
new_lines = []
for line in lines:
    if line.startswith('  const filteredTrips = useMemo'):
        new_lines.append('  const filteredTrips = useMemo(() => { const rows = allTrips.filter(trip => { const haystack = [trip.vehiclePlate, trip.vehicleModel, trip.driverName, trip.origin, trip.destination, trip.purpose].join(" ").toLowerCase(); return dateWithin(trip.tripDate, from, to) && (vehicle === "todos" || trip.vehiclePlate === vehicle) && (driver === "todos" || trip.driverName === driver) && (status === "todos" || trip.status === status) && (destination === "todos" || trip.destination === destination) && haystack.includes(tripSearch.toLowerCase()); }); return [...rows].sort((a, b) => compareSortValues(a[tripSort.key as keyof Trip], b[tripSort.key as keyof Trip], tripSort.direction)); }, [allTrips, from, to, vehicle, driver, status, destination, tripSearch, tripSort]);')
    elif line.startswith('  const filteredRecords = useMemo'):
        new_lines.append('  const filteredRecords = useMemo(() => { const rows = rawRecords.filter(record => { const haystack = [record.respondentName, record.employeeId, record.vehiclePlate, record.event, record.serviceType, record.summary, record.email].join(" ").toLowerCase(); return dateWithin(record.recordedAt, from, to) && (recordVehicle === "todos" || record.vehiclePlate === recordVehicle) && (recordEvent === "todos" || record.event === recordEvent) && haystack.includes(recordSearch.toLowerCase()); }); return [...rows].sort((a, b) => compareSortValues(a[recordSort.key as keyof RecordRow], b[recordSort.key as keyof RecordRow], recordSort.direction)); }, [rawRecords, from, to, recordVehicle, recordEvent, recordSearch, recordSort]);')
    else:
        new_lines.append(line)
text = '\n'.join(new_lines) + ('\n' if text.endswith('\n') else '')

# Remove CSV upload controls from the page header.
text = re.sub(r'<input ref=\{fileInput\}.*?</Button>}', '', text, count=1)
text = re.sub(r'\{usingDemo && <div className="no-print mb-5.*?</div>\}', '', text, count=1)

# Visitor-friendly auth/loading guards.
text = text.replace('  if (loading) return', '  if (loading || visitorAccessQuery.isLoading) return')
text = text.replace('  if (!user) return <div className="min-h-screen', '  if (!user && visitorAccessQuery.data !== true) return <div className="min-h-screen')

# Header user area: preserve the navigation and swap only the identity/actions block.
start = text.find('<div className="flex items-center gap-2"><div className="hidden sm:flex items-center gap-2.5')
marker = '</div></div>{mobileMenu'
end = text.find(marker, start)
if start == -1 or end == -1:
    raise SystemExit('header identity block not found')
replacement = '<div className="flex items-center gap-2"><div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-[#dce5de]">{user ? <><Avatar className="h-9 w-9 border border-[#cfe0d4]"><AvatarFallback className="bg-[#e8f3ec] text-[#317154] text-xs font-bold">{initials(user.name)}</AvatarFallback></Avatar><div className="leading-tight"><p className="text-sm font-semibold max-w-[130px] truncate">{user.name || "Usuário"}</p><p className="text-[11px] text-[#75827f]">{user.role === "admin" ? "Administrador" : "Usuário"}</p></div></> : <div className="leading-tight"><p className="text-sm font-semibold">Visitante</p><p className="text-[11px] text-[#75827f]">Acesso público</p></div>}</div>{user ? <Button variant="ghost" size="icon" onClick={logout} className="no-print text-[#75827f] hover:text-[#e4684d]" title="Sair"><LogOut className="h-4 w-4" /></Button> : <Button variant="ghost" size="sm" onClick={() => startLogin()} className="no-print text-[#4f8f77]">Entrar</Button>}<Button variant="ghost" size="icon" onClick={() => setMobileMenu(!mobileMenu)} className="xl:hidden"><Menu className="h-5 w-5" /></Button>'
text = text[:start] + replacement + text[end:]

# The team section is admin-only; append visitor toggle beside Add Member.
member_button = '<Button onClick={() => setMemberDialog(true)} className="no-print bg-[#e4684d] hover:bg-[#c9533b] text-white gap-2"><UserPlus className="h-4 w-4" />Adicionar Membro</Button>'
visitor_button = member_button + '<Button onClick={() => visitorMutation.mutate({ enabled: visitorAccessQuery.data !== true })} disabled={visitorMutation.isPending} variant="outline" className={`no-print gap-2 ${visitorAccessQuery.data ? "border-[#b9d8c4] bg-[#e8f3ec] text-[#317154]" : "border-[#f0c7bd] bg-[#fff0eb] text-[#b54e3c]"}`}><span className={`h-2 w-2 rounded-full ${visitorAccessQuery.data ? "bg-[#4f8f77]" : "bg-[#e4684d]"}`} />Visitantes: {visitorAccessQuery.data ? "Ativo" : "Inativo"}</Button>'
if text.count(member_button) != 1:
    raise SystemExit(f'member button count: {text.count(member_button)}')
text = text.replace(member_button, visitor_button)

# Make the vehicle dialog explicitly occupy the viewport, including Radix transforms.
text = text.replace('className="w-screen h-screen max-w-none rounded-none border-0 bg-[#f5f6f2] p-0 overflow-y-auto"', 'className="fixed inset-0 left-0 top-0 translate-x-0 translate-y-0 w-screen h-screen max-w-none max-h-none rounded-none border-0 bg-[#f5f6f2] p-0 overflow-y-auto"', 1)

path.write_text(text)
