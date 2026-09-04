import mysql from "mysql2/promise";
const groups = {
  "Aline de Medeiros Félix Santana": ["Aline", "Aline (COGER)"],
  "Antônio Barreto Lamounier": ["Antônio", "Antonio", "Antonio Barreto", "Antonio /COGPE", "Antônio /COGPE"],
  "Eduardo de Lima Cunha": ["Eduardo", "Edurdo"],
  "João Vitor Leite Barros": ["Joao Victor", "João Victor", "João Vitor"],
  "José Ramos Machado Neto": ["José Neto", "José Ramos", "Neto"],
  "Leandro Gonzaga de Souza": ["Leandro"],
  "Luciana Akeme Sawasaki Manzano Deluci": ["Luciana", "LUCIANA - COFOR"],
  "Maxsuel Pereira Barbosa": ["Maxuel", "Maxsuel"],
  "Nubson de Souza Freitas": ["Nubson", "NUBSON", "X NUBSON DE S FREITAS", "Nubson de Souza Freitas"],
  "Raimundo Nonato da Silva de Oliveira": ["Raimundo", "Raimundo Nonato da Silva de Oliveira"],
  "Senakeribe": ["Sena", "Senakeribe"],
  "Sílvia Figueiredo de Sousa": ["Sílvia", "Sílvia Figueiredo", "Sílvia Figueiredo de Sousa"],
  "Uanderson de Jesus Coelho": ["Uanderson de Jesus", "Uanderson de Jesus Coelho"],
  "Wilkison Paulo Lourenço Silva": ["Wilkison Paulo Lourenço Silva", "Wilkisson", "Wilkson"],
};
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  let changed = 0;
  for (const [canonical, aliases] of Object.entries(groups)) {
    for (const [table, column] of [["trips", "driverName"], ["departureArrivalRecords", "respondentName"]]) {
      const placeholders = aliases.map(() => "?").join(",");
      const [result] = await db.query(`UPDATE ${table} SET ${column} = ? WHERE ${column} IN (${placeholders})`, [canonical, ...aliases]);
      changed += result.affectedRows ?? 0;
    }
  }
  console.log(JSON.stringify({ groups: Object.keys(groups).length, changed }));
} finally { await db.end(); }
