import mysql from "mysql2/promise";
import { createHash, randomBytes, scryptSync } from "node:crypto";

const accounts = [
  { email: "ademirmaciel01@gmail.com", name: "Ademir Maciel", password: process.env.TEST_PASSWORD_1 },
  { email: "ademir-maciel.santos@edu.mt.gov.br", name: "Ademir Maciel Santos", password: process.env.TEST_PASSWORD_2 },
];

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

if (accounts.some(account => !account.password || account.password.length < 8)) throw new Error("TEST_PASSWORD_1 e TEST_PASSWORD_2 devem ter pelo menos 8 caracteres");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  for (const account of accounts) {
    const [rows] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [account.email]);
    if (rows.length === 0) {
      const openId = `invite:${createHash("sha256").update(account.email).digest("hex").slice(0, 56)}`;
      await db.query("INSERT INTO users (openId, name, email, passwordHash, loginMethod, role) VALUES (?, ?, ?, ?, 'password', 'user')", [openId, account.name, account.email, hashPassword(account.password)]);
    } else {
      await db.query("UPDATE users SET passwordHash = ?, loginMethod = 'password' WHERE id = ?", [hashPassword(account.password), rows[0].id]);
    }
    console.log(`${account.email}=configured`);
  }
} finally {
  await db.end();
}
