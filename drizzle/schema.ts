import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  plate: varchar("plate", { length: 80 }).notNull().unique(),
  model: varchar("model", { length: 120 }),
  category: varchar("category", { length: 80 }),
  year: int("year"),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  tripDate: timestamp("tripDate").notNull(),
  vehicleId: int("vehicleId"),
  vehiclePlate: varchar("vehiclePlate", { length: 80 }).notNull(),
  vehicleModel: varchar("vehicleModel", { length: 120 }),
  driverName: varchar("driverName", { length: 160 }).notNull(),
  origin: varchar("origin", { length: 160 }),
  destination: varchar("destination", { length: 160 }),
  purpose: varchar("purpose", { length: 180 }),
  distanceKm: int("distanceKm").default(0).notNull(),
  durationMinutes: int("durationMinutes").default(0).notNull(),
  status: mysqlEnum("status", ["Concluída", "Em andamento", "Cancelada"]).default("Concluída").notNull(),
  notes: text("notes"),
  importedFile: varchar("importedFile", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;
