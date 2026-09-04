import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { appSettings, departureArrivalRecords, InsertTrip, InsertUser, trips, users, vehicles } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  if (user.email) {
    const invited = await db.select({ id: users.id, openId: users.openId }).from(users).where(eq(users.email, user.email)).limit(1);
    if (user.openId.startsWith("invite:") && invited[0]) {
      await db.update(users).set({ name: user.name ?? null, email: user.email, role: user.role ?? "user", loginMethod: user.loginMethod ?? "admin-invite" }).where(eq(users.id, invited[0].id));
      return;
    }
    if (!user.openId.startsWith("invite:") && invited[0]?.openId.startsWith("invite:")) {
      await db.update(users).set({
        openId: user.openId,
        name: user.name ?? null,
        email: user.email,
        loginMethod: user.loginMethod ?? null,
        lastSignedIn: user.lastSignedIn ?? new Date(),
      }).where(eq(users.id, invited[0].id));
      return;
    }
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getVisitorAccess() {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(appSettings).where(eq(appSettings.key, "visitor_access")).limit(1);
  return result[0]?.value === "active";
}

export async function getSystemAccess() {
  const db = await getDb();
  if (!db) return true;
  const result = await db.select().from(appSettings).where(eq(appSettings.key, "system_access")).limit(1);
  return result[0]?.value !== "inactive";
}

export async function setSystemAccess(enabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(appSettings).values({ key: "system_access", value: enabled ? "active" : "inactive" }).onDuplicateKeyUpdate({ set: { value: enabled ? "active" : "inactive" } });
  return enabled;
}

export async function setVisitorAccess(enabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(appSettings).values({ key: "visitor_access", value: enabled ? "active" : "inactive" }).onDuplicateKeyUpdate({ set: { value: enabled ? "active" : "inactive" } });
  return enabled;
}

export async function listTrips() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trips).orderBy(desc(trips.tripDate));
}

export async function listVehicles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vehicles).orderBy(vehicles.plate);
}

export async function listDepartureArrivalRecords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(departureArrivalRecords).orderBy(desc(departureArrivalRecords.recordedAt));
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, active: users.active, lastSignedIn: users.lastSignedIn, createdAt: users.createdAt }).from(users).orderBy(users.name);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0];
}

export async function setUserPassword(id: number, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function markUserSignedIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
}

export async function updateUserById(id: number, data: { name: string; email: string; role: "user" | "admin" }, openId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(users).set(openId ? { ...data, openId } : data).where(eq(users.id, id));
}

export async function deleteUserById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.delete(users).where(eq(users.id, id));
}

export async function setUserActive(id: number, active: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(users).set({ active: active ? 1 : 0 }).where(eq(users.id, id));
}

export async function importTrips(rows: InsertTrip[], vehicleRows: Array<{ plate: string; model?: string | null; category?: string | null; year?: number | null }>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  for (const vehicle of vehicleRows) {
    await db.insert(vehicles).values({ plate: vehicle.plate, model: vehicle.model ?? null, category: vehicle.category ?? null, year: vehicle.year ?? null }).onDuplicateKeyUpdate({ set: { model: vehicle.model ?? null, category: vehicle.category ?? null, year: vehicle.year ?? null } });
  }
  if (rows.length > 0) await db.insert(trips).values(rows);
  return { imported: rows.length, vehicles: vehicleRows.length };
}
