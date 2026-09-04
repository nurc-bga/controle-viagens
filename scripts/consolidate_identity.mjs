import mysql from "mysql2/promise";
const aliases = new Map([
  ["ADJAILTO ALBES AGOSTINHO", "Adjailto Alves Agostinho"], ["ADJAILTO AKVES AGOSTINHO", "Adjailto Alves Agostinho"], ["Adjailto", "Adjailto Alves Agostinho"], ["Adjailton", "Adjailto Alves Agostinho"], ["Ajailton", "Adjailto Alves Agostinho"], ["Adjaiton", "Adjailto Alves Agostinho"], ["Adijailtom", "Adjailto Alves Agostinho"],
  ["José Ramos Machado", "José Ramos Machado Neto"], ["Eduardo de Lima Cunha 140785", "Eduardo de Lima Cunha"],
  ["rhael fernandes", "Rhael Fernandes"], ["RHAEL FRRNANDES", "Rhael Fernandes"], ["RRHAEL FERNANDES", "Rhael Fernandes"], ["RHAEL FRNANDES", "Rhael Fernandes"], ["RHEL FERNNDES", "Rhael Fernandes"], ["RHAEL", "Rhael Fernandes"], ["259125", "Rhael Fernandes"],
  ["Maxsuel Barbosa", "Maxsuel Pereira Barbosa"], ["Maxsuel Pereira", "Maxsuel Pereira Barbosa"],
  ["Marizete Ten Caten", "Marizete Alves Neves Ten Caten"], ["Marizete Alves Neves", "Marizete Alves Neves Ten Caten"],
  ["Thiago", "Thiago Marcelo Silva Barbosa"], ["Thiago Barbosa", "Thiago Marcelo Silva Barbosa"],
  ["Uanderson Coelho", "Uanderson de Jesus Coelho"], ["Anderson Coelho", "Uanderson de Jesus Coelho"], ["Uanderson", "Uanderson de Jesus Coelho"], ["Uanderson Coelho Coelho", "Uanderson de Jesus Coelho"], ["Uanderosn de Jesus Coelho", "Uanderson de Jesus Coelho"],
  ["Jack Márcio Maria", "Jack Márcio Maria Zimmermann"],
  ["Wilkison", "Wilkison Paulo Lourenço Silva"], ["Wilkon Paulo LOURENÇO Silva", "Wilkison Paulo Lourenço Silva"], ["Wilkison Paulo Lourenço", "Wilkison Paulo Lourenço Silva"],
  ["Nubson Souza de Souza", "Nubson de Souza Freitas"],
  ["Raimundo Nonato", "Raimundo Nonato da Silva de Oliveira"], ["Raimundo Nonato silva de Oliveira", "Raimundo Nonato da Silva de Oliveira"], ["Raimundo Nonato Sklva de Oliveira", "Raimundo Nonato da Silva de Oliveira"], ["Raimundo Nonato Silva de", "Raimundo Nonato da Silva de Oliveira"], ["Raimundo Nonato de Oliveira", "Raimundo Nonato da Silva de Oliveira"],
  ["Meire de. Melo Lourenço Garcia", "Meire de Melo Lourenço Garcia"], ["Meire de Melo Lourenço", "Meire de Melo Lourenço Garcia"],
  ["Gerson Carlos reze", "Gerson Carlos Rezende"], ["Gerson", "Gerson Carlos Rezende"],
  ["LEANDRO GONZAGA DE SOIZA", "Leandro Gonzaga de Souza"],
  ["Eulália de Souza Gonçalves", "Eulália Gonçalves Souza Oliveira"],
  ["Lilian de Oliveira Silva", "Lília de Oliveira Silva"], ["Lilia Oliveira Silvia", "Lília de Oliveira Silva"], ["Lilia de Oliveira Silvia", "Lília de Oliveira Silva"], ["Lília Silva de Oliveira", "Lília de Oliveira Silva"],
  ["Emilio.figueiredo@edu.mt.gov.br", "Emilio Alves de Figueiredo"],
  ["Silvia Figueiredo de Souza", "Sílvia Figueiredo de Sousa"], ["Silva Figueredo de Sousa", "Sílvia Figueiredo de Sousa"], ["Silvia Figueredo de Sousa", "Sílvia Figueiredo de Sousa"], ["Sílvia", "Sílvia Figueiredo de Sousa"], ["Silvia e", "Sílvia Figueiredo de Sousa"],
  ["Renato se Souza", "Renato de Souza"], ["Renato souza", "Renato de Souza"],
  ["Edna Carvalho", "Edna Maria Carvalho de Sousa"], ["Edna Maria Carvalho Sousa", "Edna Maria Carvalho de Sousa"],
  ["Márcia Adriana Barros Fraga", "Márcia Adriana de Barros Fraga"], ["Márcia Adriana de Barros", "Márcia Adriana de Barros Fraga"],
  ["Aline de Medeiros", "Aline de Medeiros Félix Santana"], ["Aline de Medieiros Félix Santana", "Aline de Medeiros Félix Santana"], ["Aline Medeiros Félix Santana", "Aline de Medeiros Félix Santana"], ["Aline Santana Félix Medeiros", "Aline de Medeiros Félix Santana"], ["Aline Félix Medeiros Santana", "Aline de Medeiros Félix Santana"], ["Aline de Medeiros Félix", "Aline de Medeiros Félix Santana"],
  ["EMANUEL LUIS MAGNI", "Emmanuel Luis Magni"], ["Silmira Alves Santana", "Silmira Alves Santana Silva"], ["Arlene Matias Santana", "Arlene Matias Santana da Silva"],
  ["João Otávio Menezes", "João Otávio Menezes Pereira"], ["Joao Otavio", "João Otávio Menezes Pereira"], ["Mary Carneiro", "Mary Carneiro Rezende"], ["Abel Vinicius", "Abel Vinicius Machado Caetano da Silva"], ["Wagner", "Wagner Freitas da Silva"], ["Simone Freitas", "Simone Silva Santos Freitas"], ["Maria Goreti Bachello Cerqueira", "Maria Goreti Barichello Cerqueira"], ["Matina Escorisa", "Marina Escorisa"], ["Rosirene Bento", "Rosirene Bento da Rocha"],
]);
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  let changed = 0;
  for (const [alias, canonical] of aliases) {
    for (const [table, column] of [["trips", "driverName"], ["departureArrivalRecords", "respondentName"]]) {
      const [result] = await db.query(`UPDATE ${table} SET ${column} = ? WHERE ${column} = ?`, [canonical, alias]);
      changed += result.affectedRows ?? 0;
    }
  }
  console.log(JSON.stringify({ aliases: aliases.size, changed }));
} finally { await db.end(); }
