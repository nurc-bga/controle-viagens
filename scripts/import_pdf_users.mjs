import mysql from "mysql2/promise";
import { createHash } from "node:crypto";

const accounts = [
  ["Ademir Maciel", "advademirmaciel@gmail.com"],
  ["Ademir Maciel dos Santos", "ademir-maciel.santos@edu.mt.gov.br"],
  ["Administrador Geral", "bga.regimecolaboracao@edu.mt.gov.br"],
  ["Alissandra Silva Santos", "alissandra.santos@edu.mt.gov.br"],
  ["Antônio Barreto Lamounier", "antonio.lamounier@edu.mt.gov.br"],
  ["Cinthia Oliveira Neres", "cinthia.neres@edu.mt.gov.br"],
  ["COADM", "bga.coadm@edu.mt.gov.br"],
  ["COFOR", "bga.cofor@edu.mt.gov.br"],
  ["COGER", "bga.coger@edu.mt.gov.br"],
  ["COGPE", "bga.cogpe@edu.mt.gov.br"],
  ["COIPT", "bga.coipt@edu.mt.gov.br"],
  ["COPED", "bga.coped@edu.mt.gov.br"],
  ["Diretoria", "bga.dre@edu.mt.gov.br"],
  ["Eduardo de Lima Cunha", "eduardo.cunha@edu.mt.gov.br"],
  ["Emilio Alves de Figueiredo", "emilio.figueiredo@edu.mt.gov.br"],
  ["Flávia Lima Liberalesso", "flavia.liberalesso@edu.mt.gov.br"],
  ["Huendeberg de Jesus Gomes", "huendeberg.gomes@edu.mt.gov.br"],
  ["Igor Mendes Lima", "igor.mendes@edu.mt.gov.br"],
  ["Ipolita Lina de Paula", "ipolita.paula@edu.mt.gov.br"],
  ["Janete Aparecida Correa", "janete.correa@edu.mt.gov.br"],
  ["July Claro Souza", "july.souza@edu.mt.gov.br"],
  ["Leandro Gonzaga de Souza", "leandro.souza@edu.mt.gov.br"],
  ["Lethícia Carla Veronez", "lethicia.veronez@edu.mt.gov.br"],
  ["Lilian Ferreira Silva Ferraz", "lilian.ferraz@edu.mt.gov.br"],
  ["Maria Goreti Barichello Cerqueira", "maria.cerqueira@edu.mt.gov.br"],
  ["Maria Moreira da Rocha Figueiredo", "maria.mr.figueiredo@edu.mt.gov.br"],
  ["Maxsuel Pereira Barbosa", "maxsuel.barbosa@edu.mt.gov.br"],
  ["Mônica Alencar Miranda", "monica.miranda@edu.mt.gov.br"],
  ["Nubson de Souza Freitas", "nubson.freitas@edu.mt.gov.br"],
  ["Pâmella Lôbo Rêgo", "pamella.rego@edu.mt.gov.br"],
  ["Silmira Alves Santana Silva", "silmira.silva@edu.mt.gov.br"],
  ["Silvia Figueiredo de Sousa", "silvia.sousa@edu.mt.gov.br"],
  ["Sueli Maria Ávila", "sueli.avila@edu.mt.gov.br"],
];
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  let inserted = 0; let updated = 0;
  for (const [name, rawEmail] of accounts) {
    const email = rawEmail.toLowerCase();
    const inviteOpenId = `invite:${createHash("sha256").update(email).digest("hex").slice(0, 56)}`;
    const [rows] = await db.query("SELECT id, openId FROM users WHERE email = ? LIMIT 1", [email]);
    if (rows.length === 0) {
      await db.query("INSERT INTO users (openId, name, email, passwordHash, loginMethod, role, active) VALUES (?, ?, ?, NULL, 'google-invite', 'user', 1)", [inviteOpenId, name, email]);
      inserted += 1;
    } else {
      await db.query("UPDATE users SET name = ?, email = ?, passwordHash = NULL, loginMethod = 'google-invite', active = 1 WHERE id = ?", [name, email, rows[0].id]);
      updated += 1;
    }
  }
  console.log(JSON.stringify({ total: accounts.length, inserted, updated }));
} finally { await db.end(); }
