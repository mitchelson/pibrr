import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  console.log("Creating mensagem tables...");

  // 1. Create mensagem_categorias table
  await sql`
    CREATE TABLE IF NOT EXISTS mensagem_categorias (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      dia TEXT NOT NULL,
      descricao TEXT,
      ativa BOOLEAN NOT NULL DEFAULT true,
      ordem INT NOT NULL DEFAULT 0,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("Created mensagem_categorias");

  // 2. Create mensagem_modelos table
  await sql`
    CREATE TABLE IF NOT EXISTS mensagem_modelos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      categoria_id UUID NOT NULL REFERENCES mensagem_categorias(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      ordem INT NOT NULL DEFAULT 0,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("Created mensagem_modelos");

  // 3. Create visitante_mensagens_enviadas table
  await sql`
    CREATE TABLE IF NOT EXISTS visitante_mensagens_enviadas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      visitante_id UUID NOT NULL REFERENCES visitantes(id) ON DELETE CASCADE,
      categoria_id UUID NOT NULL REFERENCES mensagem_categorias(id) ON DELETE CASCADE,
      enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(visitante_id, categoria_id)
    )
  `;
  console.log("Created visitante_mensagens_enviadas");

  // 4. Seed category 1: Agradecimento (Segunda-feira)
  const cat1 = await sql`
    INSERT INTO mensagem_categorias (nome, dia, descricao, ativa, ordem)
    VALUES (
      'Mensagem de Agradecimento',
      'Segunda-feira',
      'Enviada no mesmo dia ou no dia seguinte da visita',
      true,
      1
    )
    RETURNING id
  `;
  const cat1Id = cat1[0].id;
  console.log("Seeded category 1:", cat1Id);

  await sql`INSERT INTO mensagem_modelos (categoria_id, titulo, conteudo, ordem) VALUES
    (${cat1Id}, 'Modelo 1', ${"Ola, [Nome]! Aqui e [Seu Nome] da [Nome da Igreja]. 😊\n\nQuero te agradecer por ter estado conosco hoje! Foi uma alegria receber voce em nosso culto. Esperamos que tenha se sentido bem e acolhido.\n\nSe precisar de algo, estamos por aqui! Que Deus abencoe sua semana. 🙏✨"}, 1),
    (${cat1Id}, 'Modelo 2', ${"Oi, [Nome]! Tudo bem? Aqui e [Seu Nome], da [Nome da Igreja].\n\nSo queria passar por aqui para dizer que *foi um prazer receber voce hoje*! Esperamos que tenha aproveitado o culto e que Deus tenha falado ao seu coracao.\n\nSe precisar de oracao ou quiser saber mais sobre a igreja, conte com a gente!"}, 2),
    (${cat1Id}, 'Modelo 3', ${"Oi, [Nome]! Espero que tenha tido uma experiencia incrivel hoje na [Nome da Igreja]! Nossa equipe orou por voce e por sua vinda, e queremos que saiba que voce sempre sera bem-vindo aqui.\n\nQue sua semana seja cheia da paz de Deus! Se precisar de algo, conte com a gente! 🙌"}, 3),
    (${cat1Id}, 'Modelo 4', ${"Ola, [Nome]! Foi muito bom ter voce com a gente hoje na [Nome da Igreja]! 😊\n\nSabemos que dar o primeiro passo e conhecer um novo lugar pode ser um desafio, mas queremos que voce saiba que *aqui ha um espaco para voce*!\n\nSe quiser saber mais sobre nossas atividades, estou por aqui para te ajudar!"}, 4),
    (${cat1Id}, 'Modelo 5', ${"[Nome], que alegria foi te ver hoje na igreja! 🌟\n\nDeus tem um proposito lindo para sua vida e cremos que Ele te trouxe aqui por um motivo! Se precisar de oracao, conversar ou saber mais sobre como se envolver, estamos a disposicao!"}, 5)
  `;
  console.log("Seeded models for category 1");

  // 5. Seed category 2: Relacional (Terca ou Quarta-feira)
  const cat2 = await sql`
    INSERT INTO mensagem_categorias (nome, dia, descricao, ativa, ordem)
    VALUES (
      'Mensagem Relacional',
      'Terca ou Quarta-feira',
      'Enviada dois dias apos a visita para manter o relacionamento',
      true,
      2
    )
    RETURNING id
  `;
  const cat2Id = cat2[0].id;
  console.log("Seeded category 2:", cat2Id);

  await sql`INSERT INTO mensagem_modelos (categoria_id, titulo, conteudo, ordem) VALUES
    (${cat2Id}, 'Modelo 1', ${"Oi, [Nome]! Passando por aqui para te lembrar que *Deus cuida de voce em todo tempo*! 💙\n\nQuero compartilhar com voce um versiculo que pode fortalecer seu coracao nesta semana:\n\n\"Entregue o seu caminho ao Senhor; confie nele, e ele agira.\" (Salmos 37:5)\n\nSe precisar de algo, estamos aqui! Que sua semana seja cheia da paz de Deus. 🙏✨"}, 1),
    (${cat2Id}, 'Modelo 2', ${"Ola, [Nome]! Aqui e [Seu Nome], da [Nome da Igreja]. Como esta sua semana? 😊\n\nQuero compartilhar um pensamento com voce: *Deus tem um proposito para sua vida, e Ele cuida de cada detalhe.*\n\n\"Porque sou eu que conheco os planos que tenho para voces, diz o Senhor, planos de faze-los prosperar e nao de lhes causar dano, planos de dar a voces esperanca e um futuro.\" (Jeremias 29:11)\n\nSe precisar de algo, estamos a disposicao!"}, 2),
    (${cat2Id}, 'Modelo 3', ${"Oi, [Nome]! Passando para lembrar que *voce nao esta sozinho!*\n\nDeus te ama e esta sempre presente, mesmo nos momentos mais dificeis. 💛\n\n\"O Senhor esta perto dos que tem o coracao quebrantado e salva os de espirito abatido.\" (Salmos 34:18)\n\nQue sua semana seja cheia da presenca de Deus!"}, 3),
    (${cat2Id}, 'Modelo 4', ${"[Nome], espero que sua semana esteja sendo incrivel!\n\nQuero te lembrar que *voce tem um lugar especial aqui na igreja e no coracao de Deus!*\n\nSe precisar conversar, orar ou compartilhar algo, estamos aqui por voce!"}, 4),
    (${cat2Id}, 'Modelo 5', ${"Oi, [Nome]! Deus esta sempre nos convidando para um relacionamento mais profundo com Ele. 🙏\n\nNao deixe que as preocupacoes do dia a dia te afastem da paz que so Ele pode dar.\n\n\"Lancem sobre Ele toda a sua ansiedade, porque Ele tem cuidado de voces.\" (1 Pedro 5:7)\n\nSe precisar de apoio, estamos juntos nessa jornada!"}, 5)
  `;
  console.log("Seeded models for category 2");

  // 6. Seed category 3: Convite (Sexta-feira)
  const cat3 = await sql`
    INSERT INTO mensagem_categorias (nome, dia, descricao, ativa, ordem)
    VALUES (
      'Convite para o Culto',
      'Sexta-feira',
      'Enviada na sexta-feira convidando para o proximo culto de domingo',
      true,
      3
    )
    RETURNING id
  `;
  const cat3Id = cat3[0].id;
  console.log("Seeded category 3:", cat3Id);

  await sql`INSERT INTO mensagem_modelos (categoria_id, titulo, conteudo, ordem) VALUES
    (${cat3Id}, 'Modelo 1', ${"Ola, [Nome]! Passando para te lembrar que *domingo tem culto na [Nome da Igreja]!* 🎉\n\nSera um tempo especial na presenca de Deus, e *seria uma alegria ter voce com a gente novamente!*\n\nO culto comeca as [horario], e estamos te esperando! Se precisar de algo, e so chamar. 😊🙏"}, 1),
    (${cat3Id}, 'Modelo 2', ${"Oi, [Nome]! Espero que sua semana tenha sido abencoada. 🙌\n\nQueria te fazer um convite especial: *domingo teremos mais um culto incrivel, e sera uma alegria te receber novamente!*\n\nVamos juntos buscar a presenca de Deus! *Nos vemos as [horario] na [Nome da Igreja]!* 😊"}, 2),
    (${cat3Id}, 'Modelo 3', ${"Oi, [Nome]! Domingo esta chegando e queremos te lembrar que *voce e muito bem-vindo aqui na [Nome da Igreja]!*\n\nNao importa se foi sua primeira vez ou se ja voltou outras vezes, *ha um lugar especial para voce*.\n\nEsperamos voce no culto as [horario]! Vem com a gente! 🙌🔥"}, 3),
    (${cat3Id}, 'Modelo 4', ${"[Nome], queremos te convidar para mais um culto incrivel neste domingo!\n\nDeus tem algo novo para voce e *seria maravilhoso termos voce conosco novamente*!\n\nEsperamos voce as [horario] na [Nome da Igreja]!"}, 4),
    (${cat3Id}, 'Modelo 5', ${"Ei, [Nome]! 😊 O culto de domingo ja esta chegando e *seria uma alegria te ver por la!*\n\nJa estamos orando para que Deus fale com cada um que estara presente.\n\nSe puder, venha! Estamos te esperando as [horario]. Qualquer duvida, me chama!"}, 5)
  `;
  console.log("Seeded models for category 3");

  // 7. Drop old columns from visitantes (msg_segunda, msg_sabado)
  try {
    await sql`ALTER TABLE visitantes DROP COLUMN IF EXISTS msg_segunda`;
    await sql`ALTER TABLE visitantes DROP COLUMN IF EXISTS msg_sabado`;
    console.log("Dropped old msg_segunda/msg_sabado columns");
  } catch (e) {
    console.log("Columns may already be dropped:", e.message);
  }

  console.log("Migration complete!");
}

main().catch(console.error);
