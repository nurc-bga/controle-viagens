import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownUp,
  BarChart3,
  CalendarDays,
  CarFront,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileDown,
  FileUp,
  Filter,
  Gauge,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Printer,
  Search,
  ShieldCheck,
  Truck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#e4684d", "#4f8f77", "#e5b74f"];
const DATE_MIN = "2022-05-01";
const DATE_MAX = "2026-08-31";

type Tab = "gráficos" | "viagens" | "veículos" | "equipe";
type Trip = {
  id: number;
  tripDate: string | Date;
  vehiclePlate: string;
  vehicleModel?: string | null;
  driverName: string;
  origin?: string | null;
  destination?: string | null;
  purpose?: string | null;
  distanceKm: number;
  durationMinutes: number;
  status: "Concluída" | "Em andamento" | "Cancelada";
  notes?: string | null;
};
type Vehicle = { id: number; plate: string; model?: string | null; category?: string | null; year?: number | null };
type TeamMember = { id: number; name?: string | null; email?: string | null; role: "admin" | "user"; lastSignedIn?: string | Date | null; createdAt?: string | Date | null };

const DEMO_TRIPS: Trip[] = [
  { id: -1, tripDate: "2026-08-28", vehiclePlate: "GXR-4H20", vehicleModel: "Fiat Toro", driverName: "Mariana Costa", origin: "São Paulo, SP", destination: "Campinas, SP", purpose: "Visita técnica", distanceKm: 96, durationMinutes: 118, status: "Concluída" },
  { id: -2, tripDate: "2026-08-21", vehiclePlate: "QWE-9B31", vehicleModel: "Toyota Corolla", driverName: "Rafael Mendes", origin: "Santos, SP", destination: "São Paulo, SP", purpose: "Reunião com cliente", distanceKm: 142, durationMinutes: 164, status: "Concluída" },
  { id: -3, tripDate: "2026-08-14", vehiclePlate: "GXR-4H20", vehicleModel: "Fiat Toro", driverName: "Mariana Costa", origin: "Campinas, SP", destination: "Jundiaí, SP", purpose: "Entrega de equipamentos", distanceKm: 82, durationMinutes: 76, status: "Concluída" },
  { id: -4, tripDate: "2026-08-05", vehiclePlate: "HJK-2K88", vehicleModel: "VW Saveiro", driverName: "João Silva", origin: "Sorocaba, SP", destination: "Itu, SP", purpose: "Operação de campo", distanceKm: 68, durationMinutes: 88, status: "Cancelada" },
  { id: -5, tripDate: "2026-07-29", vehiclePlate: "QWE-9B31", vehicleModel: "Toyota Corolla", driverName: "Rafael Mendes", origin: "São Paulo, SP", destination: "São José dos Campos, SP", purpose: "Auditoria", distanceKm: 188, durationMinutes: 205, status: "Concluída" },
  { id: -6, tripDate: "2026-07-22", vehiclePlate: "MNO-7C44", vehicleModel: "Renault Master", driverName: "Camila Rocha", origin: "São Paulo, SP", destination: "Guarulhos, SP", purpose: "Logística", distanceKm: 42, durationMinutes: 64, status: "Em andamento" },
  { id: -7, tripDate: "2026-07-11", vehiclePlate: "HJK-2K88", vehicleModel: "VW Saveiro", driverName: "João Silva", origin: "Itu, SP", destination: "Sorocaba, SP", purpose: "Operação de campo", distanceKm: 68, durationMinutes: 84, status: "Concluída" },
  { id: -8, tripDate: "2026-06-30", vehiclePlate: "GXR-4H20", vehicleModel: "Fiat Toro", driverName: "Mariana Costa", origin: "Jundiaí, SP", destination: "Campinas, SP", purpose: "Visita técnica", distanceKm: 82, durationMinutes: 79, status: "Concluída" },
];

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(" de ", " ");
}
function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "Nunca";
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function initials(name?: string | null) {
  return (name || "U").split(" ").slice(0, 2).map(part => part[0]).join("").toUpperCase();
}
function monthKey(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(" de ", " ");
}
function statusClass(status: Trip["status"]) {
  if (status === "Concluída") return "bg-[#e8f3ec] text-[#317154]";
  if (status === "Em andamento") return "bg-[#fff4d8] text-[#97721b]";
  return "bg-[#fce8e4] text-[#b54e3c]";
}

function StatCard({ label, value, detail, icon: Icon, accent }: { label: string; value: string; detail: string; icon: React.ElementType; accent: string }) {
  return (
    <Card className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)] bg-white overflow-hidden">
      <CardContent className="p-5 relative">
        <div className={`absolute right-0 top-0 h-full w-1 ${accent}`} />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#75827f] font-semibold">{label}</p>
            <p className="font-display text-3xl font-bold text-[#14283f] mt-2">{value}</p>
            <p className="text-xs text-[#75827f] mt-2">{detail}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#f1f5f1] flex items-center justify-center text-[#4f8f77]"><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterBar({ trips, from, to, setFrom, setTo, vehicle, setVehicle, driver, setDriver, status, setStatus, destination, setDestination, onClear }: {
  trips: Trip[]; from: string; to: string; setFrom: (v: string) => void; setTo: (v: string) => void; vehicle: string; setVehicle: (v: string) => void; driver: string; setDriver: (v: string) => void; status: string; setStatus: (v: string) => void; destination: string; setDestination: (v: string) => void; onClear: () => void;
}) {
  const vehicles = Array.from(new Set(trips.map(t => t.vehiclePlate).filter(Boolean))).sort();
  const drivers = Array.from(new Set(trips.map(t => t.driverName).filter(Boolean))).sort();
  const destinations = Array.from(new Set(trips.map(t => t.destination).filter(Boolean))).sort() as string[];
  return (
    <div className="no-print flex flex-wrap items-end gap-3 rounded-2xl bg-white border border-[#e3e9e4] p-4 shadow-[0_5px_18px_rgba(20,40,63,0.04)]">
      <div className="flex items-center gap-2 text-[#4f8f77] self-center mr-1"><Filter className="h-4 w-4" /><span className="text-xs font-semibold uppercase tracking-[0.12em]">Filtros</span></div>
      <label className="grid gap-1 text-[11px] text-[#75827f] font-semibold uppercase tracking-[0.08em]">De<input type="date" min={DATE_MIN} max={DATE_MAX} value={from} onChange={e => setFrom(e.target.value)} className="h-9 rounded-lg border border-[#dce5de] bg-[#fbfcfa] px-2 text-sm font-normal normal-case tracking-normal text-[#14283f]" /></label>
      <label className="grid gap-1 text-[11px] text-[#75827f] font-semibold uppercase tracking-[0.08em]">Até<input type="date" min={DATE_MIN} max={DATE_MAX} value={to} onChange={e => setTo(e.target.value)} className="h-9 rounded-lg border border-[#dce5de] bg-[#fbfcfa] px-2 text-sm font-normal normal-case tracking-normal text-[#14283f]" /></label>
      <label className="grid gap-1 min-w-[145px] text-[11px] text-[#75827f] font-semibold uppercase tracking-[0.08em]">Veículo<Select value={vehicle} onValueChange={setVehicle}><SelectTrigger className="h-9 bg-[#fbfcfa] border-[#dce5de] text-sm font-normal normal-case tracking-normal"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{vehicles.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></label>
      <label className="grid gap-1 min-w-[165px] text-[11px] text-[#75827f] font-semibold uppercase tracking-[0.08em]">Motorista<Select value={driver} onValueChange={setDriver}><SelectTrigger className="h-9 bg-[#fbfcfa] border-[#dce5de] text-sm font-normal normal-case tracking-normal"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{drivers.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></label>
      <label className="grid gap-1 min-w-[145px] text-[11px] text-[#75827f] font-semibold uppercase tracking-[0.08em]">Status<Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 bg-[#fbfcfa] border-[#dce5de] text-sm font-normal normal-case tracking-normal"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="Concluída">Concluída</SelectItem><SelectItem value="Em andamento">Em andamento</SelectItem><SelectItem value="Cancelada">Cancelada</SelectItem></SelectContent></Select></label>
      <label className="grid gap-1 min-w-[165px] text-[11px] text-[#75827f] font-semibold uppercase tracking-[0.08em]">Destino<Select value={destination} onValueChange={setDestination}><SelectTrigger className="h-9 bg-[#fbfcfa] border-[#dce5de] text-sm font-normal normal-case tracking-normal"><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{destinations.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></label>
      <Button variant="ghost" size="sm" onClick={onClear} className="h-9 text-[#75827f] hover:text-[#e4684d]">Limpar</Button>
    </div>
  );
}

function PrintButton({ label = "Imprimir relatório" }: { label?: string }) {
  return <Button onClick={() => window.print()} variant="outline" className="no-print border-[#d6e0d8] bg-white text-[#244537] hover:bg-[#f1f6f2] gap-2"><Printer className="h-4 w-4" />{label}</Button>;
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const tripsQuery = trpc.trips.list.useQuery(undefined, { enabled: Boolean(user) });
  const vehiclesQuery = trpc.vehicles.list.useQuery(undefined, { enabled: Boolean(user) });
  const teamQuery = trpc.team.list.useQuery(undefined, { enabled: Boolean(user && user.role === "admin") });
  const importMutation = trpc.trips.importCsv.useMutation({ onSuccess: result => { toast.success(`${result.imported} viagens importadas com sucesso.`); tripsQuery.refetch(); vehiclesQuery.refetch(); }, onError: error => toast.error(error.message) });
  const addMemberMutation = trpc.team.addMember.useMutation({ onSuccess: () => { toast.success("Membro adicionado à equipe."); teamQuery.refetch(); setMemberDialog(false); setMemberName(""); setMemberEmail(""); setMemberRole("user"); }, onError: error => toast.error(error.message) });
  const [tab, setTab] = useState<Tab>("gráficos");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [from, setFrom] = useState(DATE_MIN);
  const [to, setTo] = useState(DATE_MAX);
  const [vehicle, setVehicle] = useState("todos");
  const [driver, setDriver] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [destination, setDestination] = useState("todos");
  const [tripSearch, setTripSearch] = useState("");
  const [tripView, setTripView] = useState<"table" | "cards">("table");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [memberDialog, setMemberDialog] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"user" | "admin">("user");
  const fileInput = useRef<HTMLInputElement>(null);

  const rawTrips = (tripsQuery.data ?? []) as Trip[];
  const usingDemo = rawTrips.length === 0;
  const allTrips = usingDemo ? DEMO_TRIPS : rawTrips;
  const filteredTrips = useMemo(() => allTrips.filter(trip => {
    const date = new Date(trip.tripDate).getTime();
    const fromDate = new Date(`${from}T00:00:00`).getTime();
    const toDate = new Date(`${to}T23:59:59`).getTime();
    const haystack = [trip.vehiclePlate, trip.vehicleModel, trip.driverName, trip.origin, trip.destination, trip.purpose].join(" ").toLowerCase();
    return date >= fromDate && date <= toDate && (vehicle === "todos" || trip.vehiclePlate === vehicle) && (driver === "todos" || trip.driverName === driver) && (status === "todos" || trip.status === status) && (destination === "todos" || trip.destination === destination) && haystack.includes(tripSearch.toLowerCase());
  }), [allTrips, from, to, vehicle, driver, status, destination, tripSearch]);
  const clearFilters = () => { setFrom(DATE_MIN); setTo(DATE_MAX); setVehicle("todos"); setDriver("todos"); setStatus("todos"); setDestination("todos"); };
  const totalKm = filteredTrips.reduce((sum, trip) => sum + (trip.distanceKm || 0), 0);
  const completedTrips = filteredTrips.filter(t => t.status === "Concluída").length;
  const uniqueVehicles = new Set(filteredTrips.map(t => t.vehiclePlate)).size;
  const uniqueDrivers = new Set(filteredTrips.map(t => t.driverName)).size;
  const monthData = Object.entries(filteredTrips.reduce<Record<string, number>>((acc, trip) => { const key = monthKey(trip.tripDate); acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month: monthLabel(month), viagens: total }));
  const destinationData = Object.entries(filteredTrips.reduce<Record<string, number>>((acc, trip) => { const key = trip.destination || "Não informado"; acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, total]) => ({ name: name.length > 20 ? `${name.slice(0, 20)}…` : name, total }));
  const statusData = ["Concluída", "Em andamento", "Cancelada"].map(name => ({ name, value: filteredTrips.filter(t => t.status === name).length })).filter(item => item.value > 0);
  const dbVehicles = (vehiclesQuery.data ?? []) as Vehicle[];
  const vehicleCards: Vehicle[] = dbVehicles.length ? dbVehicles : Array.from(new Map(allTrips.map(t => [t.vehiclePlate, { id: t.id, plate: t.vehiclePlate, model: t.vehicleModel, category: "Frota operacional", year: 2024 }])).values());
  const team = (teamQuery.data ?? []) as TeamMember[];
  const selectedVehicleTrips = selectedVehicle ? filteredTrips.filter(t => t.vehiclePlate === selectedVehicle.plate) : [];

  const tabs: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
    { id: "gráficos", label: "Gráficos", icon: BarChart3 }, { id: "viagens", label: "Viagens", icon: MapPin }, { id: "veículos", label: "Veículos", icon: Truck }, { id: "equipe", label: "Equipe", icon: Users },
  ];
  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importMutation.mutate({ csvText: text, filename: file.name });
    event.target.value = "";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#4f8f77]"><Gauge className="h-5 w-5 animate-pulse mr-2" />Carregando seu espaço…</div>;
  if (!user) return (
    <div className="min-h-screen bg-[#14283f] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-[#e4684d]/20 blur-3xl" /><div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[#4f8f77]/30 blur-3xl" />
      <Card className="w-full max-w-lg border-white/10 bg-white/10 text-white backdrop-blur-xl shadow-2xl relative"><CardContent className="p-10 md:p-14">
        <div className="h-12 w-12 rounded-2xl bg-[#e4684d] flex items-center justify-center mb-8"><ArrowDownUp className="h-6 w-6 rotate-45" /></div>
        <p className="text-[#e9b5a7] uppercase tracking-[0.2em] text-xs font-semibold">Painel operacional</p><h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mt-3">Controle de<br /><span className="text-[#ef876f]">Viagens.</span></h1>
        <p className="text-white/65 mt-6 max-w-sm leading-relaxed">Acompanhe 52 meses de deslocamentos, frota e equipe em um só lugar.</p>
        <Button onClick={() => startLogin()} size="lg" className="w-full mt-10 bg-white text-[#14283f] hover:bg-[#edf3ef] gap-2">Entrar com e-mail <ChevronDown className="h-4 w-4 -rotate-90" /></Button>
        <p className="text-center text-xs text-white/40 mt-5">Acesso seguro para usuários cadastrados</p>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f6f2] text-[#14283f]">
      <header className="no-print sticky top-0 z-30 border-b border-[#e1e8e2] bg-[#f5f6f2]/95 backdrop-blur-md">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 h-[74px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0"><div className="h-10 w-10 rounded-xl bg-[#14283f] text-white flex items-center justify-center shadow-sm"><ArrowDownUp className="h-5 w-5 rotate-45" /></div><div><div className="font-display font-bold text-lg leading-none">Controle <span className="text-[#e4684d]">de Viagens</span></div><div className="text-[10px] uppercase tracking-[0.16em] text-[#75827f] mt-1">Painel de operações</div></div></div>
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-white/70 p-1 border border-[#e1e8e2]">{tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${tab === item.id ? "bg-[#14283f] text-white shadow-sm" : "text-[#61716d] hover:text-[#14283f] hover:bg-[#eef3ef]"}`}><item.icon className="h-4 w-4" />{item.label}</button>)}</nav>
          <div className="flex items-center gap-2"><div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-[#dce5de]"><Avatar className="h-9 w-9 border border-[#cfe0d4]"><AvatarFallback className="bg-[#e8f3ec] text-[#317154] text-xs font-bold">{initials(user.name)}</AvatarFallback></Avatar><div className="leading-tight"><p className="text-sm font-semibold max-w-[130px] truncate">{user.name || "Usuário"}</p><p className="text-[11px] text-[#75827f]">{user.role === "admin" ? "Administrador" : "Usuário"}</p></div></div><Button variant="ghost" size="icon" onClick={logout} className="no-print text-[#75827f] hover:text-[#e4684d]" title="Sair"><LogOut className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden"><Menu className="h-5 w-5" /></Button></div>
        </div>
        {mobileMenu && <nav className="md:hidden border-t border-[#e1e8e2] bg-white p-2 grid grid-cols-2 gap-2">{tabs.map(item => <button key={item.id} onClick={() => { setTab(item.id); setMobileMenu(false); }} className={`flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold ${tab === item.id ? "bg-[#14283f] text-white" : "text-[#61716d] bg-[#f5f6f2]"}`}><item.icon className="h-4 w-4" />{item.label}</button>)}</nav>}
      </header>

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-7 md:py-9 print-area">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-7"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f8f77]">05.2022 — 08.2026</p><h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mt-1">{tab === "gráficos" ? "Visão geral" : tab.charAt(0).toUpperCase() + tab.slice(1)}</h2><p className="text-sm text-[#75827f] mt-2">{tab === "gráficos" ? "Leitura rápida da operação e dos principais indicadores." : tab === "viagens" ? "Histórico completo em ordem cronológica decrescente." : tab === "veículos" ? "Frota utilizada e histórico por veículo." : "Pessoas cadastradas com permissão de acesso."}</p></div><div className="flex gap-2"><input ref={fileInput} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />{user.role === "admin" && <Button onClick={() => fileInput.current?.click()} disabled={importMutation.isPending} variant="outline" className="no-print border-[#d6e0d8] bg-white text-[#244537] hover:bg-[#f1f6f2] gap-2"><FileUp className="h-4 w-4" />{importMutation.isPending ? "Importando…" : "Importar CSV"}</Button>}<PrintButton /></div></div>
        {usingDemo && <div className="no-print mb-5 flex items-center gap-3 rounded-xl bg-[#fff4d8] border border-[#f1ddb0] px-4 py-3 text-sm text-[#80631c]"><CircleAlert className="h-4 w-4 shrink-0" /><span><strong>Visualização de demonstração:</strong> importe um arquivo CSV para substituir estes exemplos pelos dados reais.</span></div>}
        <FilterBar trips={allTrips} from={from} to={to} setFrom={setFrom} setTo={setTo} vehicle={vehicle} setVehicle={setVehicle} driver={driver} setDriver={setDriver} status={status} setStatus={setStatus} destination={destination} setDestination={setDestination} onClear={clearFilters} />

        {tab === "gráficos" && <section className="mt-6 space-y-6"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5"><StatCard label="Viagens no período" value={filteredTrips.length.toLocaleString("pt-BR")} detail={`${completedTrips} concluídas`} icon={MapPin} accent="bg-[#e4684d]" /><StatCard label="Distância percorrida" value={`${totalKm.toLocaleString("pt-BR")} km`} detail="soma dos registros filtrados" icon={ArrowDownUp} accent="bg-[#4f8f77]" /><StatCard label="Veículos utilizados" value={uniqueVehicles.toLocaleString("pt-BR")} detail="placas distintas" icon={CarFront} accent="bg-[#e5b74f]" /><StatCard label="Motoristas ativos" value={uniqueDrivers.toLocaleString("pt-BR")} detail="no recorte atual" icon={Users} accent="bg-[#7194b0]" /></div><div className="grid lg:grid-cols-[1.6fr_1fr] gap-5"><Card className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)]"><CardHeader className="flex flex-row items-center justify-between pb-1"><div><CardTitle className="font-display text-lg">Ritmo de viagens</CardTitle><p className="text-xs text-[#75827f] mt-1">Volume mensal dentro dos filtros</p></div><Badge variant="outline" className="border-[#dce5de] text-[#4f8f77]">52 meses</Badge></CardHeader><CardContent className="h-[295px] pt-5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}><defs><linearGradient id="tripsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e4684d" stopOpacity={0.25} /><stop offset="100%" stopColor="#e4684d" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1ed" /><XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8b9793" }} tickLine={false} axisLine={false} interval="preserveStartEnd" /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8b9793" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ border: "1px solid #e1e8e2", borderRadius: 12, boxShadow: "0 8px 20px rgba(20,40,63,.08)", fontSize: 12 }} /><Area type="monotone" dataKey="viagens" stroke="#e4684d" strokeWidth={2.5} fill="url(#tripsFill)" /></AreaChart></ResponsiveContainer></CardContent></Card><Card className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)]"><CardHeader className="pb-1"><CardTitle className="font-display text-lg">Situação das viagens</CardTitle><p className="text-xs text-[#75827f] mt-1">Distribuição por status</p></CardHeader><CardContent className="h-[295px] flex items-center"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="47%" innerRadius={65} outerRadius={93} paddingAngle={4} stroke="none">{statusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ border: "1px solid #e1e8e2", borderRadius: 12, fontSize: 12 }} /><text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-[#14283f]" fontSize="26" fontWeight="700">{filteredTrips.length}</text><text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-[#75827f]" fontSize="10">viagens</text></PieChart></ResponsiveContainer></CardContent><div className="px-6 pb-5 flex justify-center flex-wrap gap-x-4 gap-y-2">{statusData.map((item, index) => <span key={item.name} className="flex items-center gap-1.5 text-[11px] text-[#75827f]"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />{item.name} <strong className="text-[#14283f]">{item.value}</strong></span>)}</div></Card></div><Card className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)]"><CardHeader className="pb-1"><CardTitle className="font-display text-lg">Destinos mais frequentes</CardTitle><p className="text-xs text-[#75827f] mt-1">Top 6 por quantidade de deslocamentos</p></CardHeader><CardContent className="h-[260px] pt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={destinationData} layout="vertical" margin={{ top: 0, right: 25, left: 15, bottom: 0 }}><CartesianGrid horizontal={false} stroke="#edf1ed" /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#8b9793" }} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="name" width={125} tick={{ fontSize: 11, fill: "#53635f" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ border: "1px solid #e1e8e2", borderRadius: 12, fontSize: 12 }} /><Bar dataKey="total" fill="#4f8f77" radius={[0, 6, 6, 0]} barSize={22} /></BarChart></ResponsiveContainer></CardContent></Card></section>}

        {tab === "viagens" && <section className="mt-6"><div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4"><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-[#9aa6a2]" /><Input value={tripSearch} onChange={e => setTripSearch(e.target.value)} placeholder="Buscar viagem, placa ou destino…" className="pl-9 bg-white border-[#dce5de]" /></div><div className="flex items-center gap-2"><span className="text-xs text-[#75827f]">{filteredTrips.length} registros</span><div className="flex rounded-lg border border-[#dce5de] bg-white p-1"><button onClick={() => setTripView("table")} className={`rounded-md p-1.5 ${tripView === "table" ? "bg-[#14283f] text-white" : "text-[#75827f]"}`}><LayoutDashboard className="h-4 w-4" /></button><button onClick={() => setTripView("cards")} className={`rounded-md p-1.5 ${tripView === "cards" ? "bg-[#14283f] text-white" : "text-[#75827f]"}`}><Menu className="h-4 w-4" /></button></div></div></div>{tripView === "table" ? <Card className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)] overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-[#f7f9f6] border-b border-[#e5ebe5]"><tr>{["Data", "Veículo", "Motorista", "Origem → destino", "Finalidade", "Distância", "Status"].map(head => <th key={head} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#75827f] font-bold whitespace-nowrap">{head}</th>)}</tr></thead><tbody className="divide-y divide-[#edf1ed]">{filteredTrips.map(trip => <tr key={trip.id} className="hover:bg-[#fbfcfa] transition-colors"><td className="px-4 py-4 text-sm font-semibold whitespace-nowrap">{formatDate(trip.tripDate)}</td><td className="px-4 py-4 whitespace-nowrap"><p className="text-sm font-semibold">{trip.vehiclePlate}</p><p className="text-[11px] text-[#75827f]">{trip.vehicleModel || "Modelo não informado"}</p></td><td className="px-4 py-4 text-sm whitespace-nowrap">{trip.driverName}</td><td className="px-4 py-4 min-w-[215px]"><p className="text-sm">{trip.origin || "—"}</p><p className="text-[11px] text-[#4f8f77] mt-0.5">→ {trip.destination || "—"}</p></td><td className="px-4 py-4 text-sm text-[#61716d] min-w-[145px]">{trip.purpose || "—"}</td><td className="px-4 py-4 text-sm font-semibold whitespace-nowrap">{trip.distanceKm || 0} km</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${statusClass(trip.status)}`}>{trip.status}</span></td></tr>)}{filteredTrips.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-sm text-[#75827f]">Nenhuma viagem encontrada com os filtros atuais.</td></tr>}</tbody></table></div></Card> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filteredTrips.map(trip => <Card key={trip.id} className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)]"><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#75827f]">{formatDate(trip.tripDate)}</span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusClass(trip.status)}`}>{trip.status}</span></div><div className="mt-5 flex items-start gap-3"><div className="h-10 w-10 rounded-xl bg-[#eef4f0] flex items-center justify-center text-[#4f8f77]"><CarFront className="h-5 w-5" /></div><div><p className="font-display font-bold">{trip.vehiclePlate}</p><p className="text-xs text-[#75827f]">{trip.vehicleModel || "Modelo não informado"} · {trip.driverName}</p></div></div><div className="mt-5 border-t border-[#edf1ed] pt-4"><p className="text-sm">{trip.origin || "—"} <span className="text-[#e4684d]">→</span> {trip.destination || "—"}</p><div className="flex justify-between mt-3 text-xs text-[#75827f]"><span>{trip.purpose || "Sem finalidade"}</span><strong className="text-[#14283f]">{trip.distanceKm || 0} km</strong></div></div></CardContent></Card>)}</div>}</section>}

        {tab === "veículos" && <section className="mt-6"><div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{vehicleCards.map(item => { const itemTrips = allTrips.filter(t => t.vehiclePlate === item.plate); const itemKm = itemTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0); return <button key={item.plate} onClick={() => setSelectedVehicle(item)} className="text-left group"><Card className="print-card h-full border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)] group-hover:-translate-y-1 group-hover:shadow-[0_14px_30px_rgba(20,40,63,0.11)] transition-all overflow-hidden"><div className="h-2 bg-[#4f8f77] group-hover:bg-[#e4684d] transition-colors" /><CardContent className="p-5"><div className="flex justify-between items-start"><div className="h-12 w-12 rounded-2xl bg-[#eef4f0] flex items-center justify-center text-[#4f8f77]"><CarFront className="h-6 w-6" /></div><Badge className="bg-[#e8f3ec] text-[#317154] hover:bg-[#e8f3ec]">Ativo</Badge></div><p className="font-display font-bold text-xl mt-5 tracking-wide">{item.plate}</p><p className="text-sm text-[#61716d] mt-1">{item.model || "Modelo não informado"}</p><div className="grid grid-cols-2 gap-3 border-t border-[#edf1ed] mt-5 pt-4"><div><p className="text-[10px] uppercase tracking-[0.1em] text-[#8a9692]">Viagens</p><p className="font-semibold mt-1">{itemTrips.length}</p></div><div><p className="text-[10px] uppercase tracking-[0.1em] text-[#8a9692]">Distância</p><p className="font-semibold mt-1">{itemKm.toLocaleString("pt-BR")} km</p></div></div><p className="text-xs text-[#4f8f77] mt-4 font-semibold">Ver histórico completo →</p></CardContent></Card></button>})}</div>{vehicleCards.length === 0 && <EmptyState icon={CarFront} title="Nenhum veículo cadastrado" detail="Importe um CSV para começar a acompanhar a frota." />}</section>}

        {tab === "equipe" && <section className="mt-6">{user.role !== "admin" ? <Card className="border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)]"><CardContent className="p-12 text-center"><ShieldCheck className="h-10 w-10 text-[#e5b74f] mx-auto" /><h3 className="font-display font-bold text-xl mt-4">Área restrita</h3><p className="text-sm text-[#75827f] mt-2">A visualização da equipe está disponível apenas para administradores.</p></CardContent></Card> : <><div className="flex items-center justify-between mb-4"><p className="text-sm text-[#75827f]"><strong className="text-[#14283f]">{team.length}</strong> usuários com permissão de acesso</p><div className="flex gap-2"><Button onClick={() => setMemberDialog(true)} className="no-print bg-[#e4684d] hover:bg-[#c9533b] text-white gap-2"><UserPlus className="h-4 w-4" />Adicionar Membro</Button><PrintButton label="Imprimir equipe" /></div></div><Card className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)] overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-[#f7f9f6] border-b border-[#e5ebe5]"><tr>{["Usuário", "E-mail", "Permissão", "Último acesso", "Cadastrado em"].map(head => <th key={head} className="px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-[#75827f] font-bold">{head}</th>)}</tr></thead><tbody className="divide-y divide-[#edf1ed]">{team.map(member => <tr key={member.id} className="hover:bg-[#fbfcfa]"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback className={member.role === "admin" ? "bg-[#fff0eb] text-[#b54e3c] text-xs font-bold" : "bg-[#e8f3ec] text-[#317154] text-xs font-bold"}>{initials(member.name)}</AvatarFallback></Avatar><span className="font-semibold text-sm">{member.name || "Sem nome"}</span></div></td><td className="px-5 py-4 text-sm text-[#61716d]">{member.email || "—"}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${member.role === "admin" ? "bg-[#fff0eb] text-[#b54e3c]" : "bg-[#e8f3ec] text-[#317154]"}`}>{member.role === "admin" && <ShieldCheck className="h-3 w-3" />}{member.role === "admin" ? "Administrador" : "Usuário"}</span></td><td className="px-5 py-4 text-sm text-[#61716d]">{formatDateTime(member.lastSignedIn)}</td><td className="px-5 py-4 text-sm text-[#61716d]">{formatDate(member.createdAt)}</td></tr>)}{team.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-sm text-[#75827f]">Nenhum usuário adicional encontrado ainda.</td></tr>}</tbody></table></div></Card></>}</section>}
      </main>

      <Dialog open={memberDialog} onOpenChange={setMemberDialog}><DialogContent className="sm:max-w-[500px] bg-white"><DialogHeader><DialogTitle className="font-display text-2xl">Adicionar Membro</DialogTitle><p className="text-sm text-[#75827f]">Cadastre uma pessoa autorizada a acessar o aplicativo.</p></DialogHeader><form className="grid gap-4 mt-2" onSubmit={event => { event.preventDefault(); addMemberMutation.mutate({ name: memberName, email: memberEmail, role: memberRole }); }}><label className="grid gap-1.5 text-sm font-semibold text-[#244537]">Nome completo<Input required minLength={2} value={memberName} onChange={event => setMemberName(event.target.value)} placeholder="Ex.: Ana Souza" className="font-normal" /></label><label className="grid gap-1.5 text-sm font-semibold text-[#244537]">E-mail<Input required type="email" value={memberEmail} onChange={event => setMemberEmail(event.target.value)} placeholder="ana@empresa.com" className="font-normal" /></label><label className="grid gap-1.5 text-sm font-semibold text-[#244537]">Permissão<Select value={memberRole} onValueChange={value => setMemberRole(value as "user" | "admin")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="user">Usuário</SelectItem><SelectItem value="admin">Administrador</SelectItem></SelectContent></Select></label><div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setMemberDialog(false)}>Cancelar</Button><Button type="submit" disabled={addMemberMutation.isPending} className="bg-[#e4684d] hover:bg-[#c9533b] text-white">{addMemberMutation.isPending ? "Salvando…" : "Salvar membro"}</Button></div></form></DialogContent></Dialog>
      <Dialog open={Boolean(selectedVehicle)} onOpenChange={open => !open && setSelectedVehicle(null)}><DialogContent className="w-screen h-screen max-w-none rounded-none border-0 bg-[#f5f6f2] p-0 overflow-y-auto"><div className="max-w-[1200px] mx-auto w-full p-5 md:p-10"><DialogHeader className="border-b border-[#dce5de] pb-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-[#4f8f77] font-semibold">Histórico do veículo</p><DialogTitle className="font-display text-3xl md:text-4xl font-bold mt-2">{selectedVehicle?.plate}</DialogTitle><p className="text-sm text-[#75827f] mt-1">{selectedVehicle?.model || "Modelo não informado"} · {selectedVehicle?.category || "Frota operacional"}</p></div><PrintButton label="Imprimir histórico" /></div></DialogHeader><div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6"><StatCard label="Viagens" value={selectedVehicleTrips.length.toString()} detail="no recorte atual" icon={MapPin} accent="bg-[#e4684d]" /><StatCard label="Distância" value={`${selectedVehicleTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0)} km`} detail="percorrida" icon={ArrowDownUp} accent="bg-[#4f8f77]" /><StatCard label="Motoristas" value={new Set(selectedVehicleTrips.map(t => t.driverName)).size.toString()} detail="que utilizaram" icon={Users} accent="bg-[#e5b74f]" /><StatCard label="Última viagem" value={formatDate(selectedVehicleTrips[0]?.tripDate)} detail="registro mais recente" icon={CalendarDays} accent="bg-[#7194b0]" /></div><Card className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)] overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-[#f7f9f6] border-b border-[#e5ebe5]"><tr>{["Data", "Motorista", "Origem → destino", "Finalidade", "Km", "Status"].map(head => <th key={head} className="px-4 py-3 text-[10px] uppercase tracking-[0.12em] text-[#75827f] font-bold">{head}</th>)}</tr></thead><tbody className="divide-y divide-[#edf1ed]">{selectedVehicleTrips.map(trip => <tr key={trip.id}><td className="px-4 py-4 text-sm font-semibold">{formatDate(trip.tripDate)}</td><td className="px-4 py-4 text-sm">{trip.driverName}</td><td className="px-4 py-4 text-sm">{trip.origin || "—"} <span className="text-[#e4684d]">→</span> {trip.destination || "—"}</td><td className="px-4 py-4 text-sm text-[#61716d]">{trip.purpose || "—"}</td><td className="px-4 py-4 text-sm font-semibold">{trip.distanceKm || 0}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(trip.status)}`}>{trip.status}</span></td></tr>)}</tbody></table></div></Card></div></DialogContent></Dialog>
      <footer className="no-print max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 text-xs text-[#9aa6a2] flex flex-wrap justify-between gap-2"><span>Controle de Viagens · dados em nuvem</span><span>Período de análise: maio/2022 a agosto/2026</span></footer>
    </div>
  );
}

function EmptyState({ icon: Icon, title, detail }: { icon: React.ElementType; title: string; detail: string }) {
  return <Card className="border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)]"><CardContent className="p-12 text-center"><Icon className="h-9 w-9 text-[#4f8f77] mx-auto" /><h3 className="font-display font-bold text-lg mt-4">{title}</h3><p className="text-sm text-[#75827f] mt-2">{detail}</p></CardContent></Card>;
}
