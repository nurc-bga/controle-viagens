import { TRPCError } from "@trpc/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getVisitorAccess, importTrips, listDepartureArrivalRecords, listTrips, listUsers, listVehicles, setVisitorAccess, upsertUser } from "./db";
import type { InsertTrip } from "../drizzle/schema";

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') { current += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ";" && !quoted) { values.push(current.trim()); current = ""; continue; }
    if (char === "," && !quoted && !line.includes(";")) { values.push(current.trim()); current = ""; continue; }
    current += char;
  }
  values.push(current.trim());
  return values;
}

function normalizeKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pick(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const found = Object.keys(row).find(existing => normalizeKey(existing) === normalizeKey(key));
    if (found && row[found]) return row[found].trim();
  }
  return "";
}

function parseDate(value: string) {
  if (!value) return new Date();
  const br = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (br) return new Date(Date.UTC(Number(br[3]), Number(br[2]) - 1, Number(br[1])));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseNumber(value: string) {
  const cleaned = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function parseStatus(value: string): "Concluída" | "Em andamento" | "Cancelada" {
  const normalized = normalizeKey(value);
  if (normalized.includes("cancel")) return "Cancelada";
  if (normalized.includes("andamento") || normalized.includes("aberta")) return "Em andamento";
  return "Concluída";
}

const visitorProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (ctx.user || await getVisitorAccess()) return next();
  throw new TRPCError({ code: "UNAUTHORIZED", message: "Acesso restrito a usuários cadastrados." });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    visitorAccess: publicProcedure.query(() => getVisitorAccess()),
    setVisitorAccess: adminProcedure.input(z.object({ enabled: z.boolean() })).mutation(({ input }) => setVisitorAccess(input.enabled)),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  trips: router({
    list: visitorProcedure.query(() => listTrips()),
    importCsv: adminProcedure.input(z.object({ csvText: z.string().min(1), filename: z.string().optional() })).mutation(async ({ input }) => {
      const lines = input.csvText.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "O CSV precisa ter cabeçalho e pelo menos uma linha." });
      const headers = parseCsvLine(lines[0]);
      const rows = lines.slice(1).map(line => {
        const values = parseCsvLine(line);
        return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
      });
      const filename = input.filename ?? "importacao.csv";
      const parsedTrips: InsertTrip[] = rows.map(row => {
        const plate = (pick(row, "placa", "veiculo", "vehiclePlate") || "NÃO INFORMADA").toUpperCase();
        return {
          tripDate: parseDate(pick(row, "data", "dataViagem", "tripDate")),
          vehiclePlate: plate,
          vehicleModel: pick(row, "modelo", "vehicleModel") || null,
          driverName: pick(row, "motorista", "condutor", "driverName") || "Não informado",
          origin: pick(row, "origem", "origin") || null,
          destination: pick(row, "destino", "destination") || null,
          purpose: pick(row, "finalidade", "motivo", "purpose") || null,
          distanceKm: parseNumber(pick(row, "distancia", "distanciaKm", "km")),
          durationMinutes: parseNumber(pick(row, "duracao", "duracaoMinutos", "durationMinutes")),
          status: parseStatus(pick(row, "status", "situacao")),
          notes: pick(row, "observacoes", "observacoes", "notes") || null,
          importedFile: filename,
        };
      });
      const vehicleMap = new Map<string, { plate: string; model?: string | null }>();
      parsedTrips.forEach(trip => vehicleMap.set(trip.vehiclePlate, { plate: trip.vehiclePlate, model: trip.vehicleModel }));
      return importTrips(parsedTrips, Array.from(vehicleMap.values()));
    }),
  }),
  vehicles: router({ list: visitorProcedure.query(() => listVehicles()) }),
  departureArrival: router({ list: visitorProcedure.query(() => listDepartureArrivalRecords()) }),
  team: router({
    list: protectedProcedure.query(({ ctx }) => ctx.user.role === "admin" ? listUsers() : []),
    addMember: adminProcedure.input(z.object({ name: z.string().min(2), email: z.string().email(), role: z.enum(["user", "admin"]) })).mutation(async ({ input }) => {
      const email = input.email.toLowerCase();
      const inviteOpenId = `invite:${createHash("sha256").update(email).digest("hex").slice(0, 56)}`;
      await upsertUser({ openId: inviteOpenId, name: input.name, email, loginMethod: "admin-invite", role: input.role });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
