import { getDb } from "./index";
import { configuracoes, funcionarios, itensCardapio, itensPedido, pedidos, restaurantes } from "./schema";

/** Cardápio inicial da Dashi Sushi — só usado nesse seed. Depois disso, o
 * cardápio é gerenciado inteiramente pelo painel da dona (/dono/cardapio). */
const MENU: Record<string, { nome: string; preco: number }[]> = {
  Combos: [
    { nome: "Combo 60 peças", preco: 260.0 },
    { nome: "Combo 50 peças", preco: 215.0 },
    { nome: "Combo 40 peças", preco: 163.0 },
    { nome: "Combo 35 peças", preco: 150.0 },
    { nome: "Combo 30 peças", preco: 125.0 },
    { nome: "Combo 25 peças (California)", preco: 112.0 },
    { nome: "Combo 25 peças (Alho poró)", preco: 102.0 },
    { nome: "Combo 21 peças", preco: 102.0 },
    { nome: "Combo 20 peças", preco: 97.0 },
    { nome: "Combo 20 peças (Gambei)", preco: 82.0 },
    { nome: "Combo 15 peças (Sashimi)", preco: 77.0 },
    { nome: "Combo 15 peças (Doritos)", preco: 63.0 },
    { nome: "Combo 15 peças (Skin cheese)", preco: 63.0 },
    { nome: "Combo 5 peças", preco: 21.5 },
  ],
  Temaki: [
    { nome: "Temaki Salmão Filadélfia P (100g)", preco: 34.0 },
    { nome: "Temaki Salmão Filadélfia M (200g)", preco: 50.0 },
    { nome: "Temaki Salmão Hot P (100g)", preco: 36.0 },
    { nome: "Temaki Salmão Hot P Aberto (100g)", preco: 41.0 },
    { nome: "Temaki Salmão Hot M (200g)", preco: 52.0 },
    { nome: "Temaki Salmão Hot Aberto (200g)", preco: 57.0 },
  ],
  "Peças avulsas": [
    { nome: "Hot Filadélfia", preco: 4.0 },
    { nome: "Hot Creme de Avelã", preco: 4.5 },
    { nome: "Hot Crispy de Cebola", preco: 4.0 },
    { nome: "Hot Gambei", preco: 4.0 },
    { nome: "Hot Doritos", preco: 4.5 },
    { nome: "Filadélfia", preco: 4.0 },
    { nome: "Filadélfia com Geleia", preco: 4.5 },
    { nome: "Filadélfia Especial", preco: 4.5 },
    { nome: "Uramaki", preco: 4.0 },
    { nome: "Hossomaki Skin Cheese", preco: 4.5 },
    { nome: "Gunka Cream Cheese", preco: 4.5 },
    { nome: "Sashimi Salmão", preco: 7.0 },
    { nome: "Sushi Salmão", preco: 4.5 },
    { nome: "California", preco: 4.5 },
  ],
  Porções: [
    { nome: "Bolinha de Salmão (5un)", preco: 20.0 },
    { nome: "Batata Frita (400g)", preco: 25.0 },
    { nome: "Tilápia com Batata", preco: 75.0 },
    { nome: "Camarão Empanado", preco: 80.0 },
    { nome: "Peroá Especial Dashi", preco: 110.0 },
  ],
  Yakisoba: [
    { nome: "Yakisoba Misto", preco: 25.0 },
    { nome: "Yakisoba de Frango", preco: 25.0 },
    { nome: "Yakisoba de Boi", preco: 25.0 },
    { nome: "Yakisoba de Porco", preco: 25.0 },
    { nome: "Yakisoba de Camarão", preco: 30.0 },
    { nome: "Yakisoba de Salmão", preco: 30.0 },
  ],
  Bebidas: [
    { nome: "Heineken", preco: 10.0 },
    { nome: "Corona", preco: 12.0 },
    { nome: "Skol Beats", preco: 15.0 },
    { nome: "Saque Dose", preco: 8.0 },
    { nome: "Drink de Saque", preco: 25.0 },
    { nome: "Coca-Cola lata", preco: 7.0 },
    { nome: "Coca-Cola 600ml", preco: 10.0 },
    { nome: "Guaraná lata", preco: 7.0 },
    { nome: "Água sem gás", preco: 4.0 },
    { nome: "Água com gás", preco: 5.0 },
  ],
};

const DONO_EMAIL = "luizzfelippefagundes@gmail.com";
/** Convites de teste pros outros papéis, usando alias "+tag" do mesmo
 * e-mail (Gmail entrega tudo na mesma caixa) — só pra dar pra testar as 4
 * áreas antes de cadastrar a equipe de verdade. */
const CONVITES_TESTE = [
  { emailConvite: "luizzfelippefagundes+atendente@gmail.com", nome: "Atendente (teste)", papel: "atendente" as const },
  { emailConvite: "luizzfelippefagundes+cozinha@gmail.com", nome: "Cozinha (teste)", papel: "cozinha" as const },
  { emailConvite: "luizzfelippefagundes+motoboy@gmail.com", nome: "Motoboy (teste)", papel: "motoboy" as const },
];

function horasAtras(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

async function main() {
  const db = getDb();

  const [restaurante] = await db
    .insert(restaurantes)
    .values({ nome: "Dashi Sushi", slug: "dashi-sushi" })
    .onConflictDoNothing({ target: restaurantes.slug })
    .returning();

  const dashiSushi =
    restaurante ??
    (await db.query.restaurantes.findFirst({ where: (r, { eq }) => eq(r.slug, "dashi-sushi") }));

  if (!dashiSushi) throw new Error("Não foi possível criar/encontrar o restaurante Dashi Sushi");

  await db
    .insert(funcionarios)
    .values({
      restauranteId: dashiSushi.id,
      emailConvite: DONO_EMAIL,
      nome: "Darlane",
      papel: "dono",
    })
    .onConflictDoNothing({ target: funcionarios.emailConvite });

  await db
    .insert(funcionarios)
    .values(CONVITES_TESTE.map((c) => ({ restauranteId: dashiSushi.id, ...c })))
    .onConflictDoNothing({ target: funcionarios.emailConvite });

  await db.insert(configuracoes).values({ restauranteId: dashiSushi.id }).onConflictDoNothing();

  const itensExistentes = await db.query.itensCardapio.findMany({
    where: (i, { eq }) => eq(i.restauranteId, dashiSushi.id),
  });

  let cardapio = itensExistentes;
  if (itensExistentes.length === 0) {
    const valores = Object.entries(MENU).flatMap(([categoria, itens]) =>
      itens.map((it) => ({ restauranteId: dashiSushi.id, categoria, nome: it.nome, preco: it.preco })),
    );
    cardapio = await db.insert(itensCardapio).values(valores).returning();
  }

  const porNome = new Map(cardapio.map((i) => [i.nome, i]));
  const pegar = (nome: string) => {
    const item = porNome.get(nome);
    if (!item) throw new Error(`Item de cardápio não encontrado no seed: ${nome}`);
    return item;
  };

  const pedidosExistentes = await db.query.pedidos.findMany({
    where: (p, { eq }) => eq(p.restauranteId, dashiSushi.id),
  });

  if (pedidosExistentes.length === 0) {
    const combo20 = pegar("Combo 20 peças (Gambei)");
    const coca = pegar("Coca-Cola lata");
    const temaki = pegar("Temaki Salmão Hot P (100g)");
    const hotFiladelfia = pegar("Hot Filadélfia");
    const combo30 = pegar("Combo 30 peças");
    const combo25 = pegar("Combo 25 peças (California)");
    const agua = pegar("Água sem gás");
    const skinCheese = pegar("Hossomaki Skin Cheese");

    const seedPedidos: {
      origem: "salao" | "delivery";
      mesa?: number;
      clienteNome?: string;
      endereco?: string;
      status: "novo" | "preparo" | "pronto" | "rota" | "entregue" | "finalizado";
      formaPagamento?: "dinheiro" | "cartao" | "pix";
      criadoEm: Date;
      itens: { item: typeof combo20; qtd: number }[];
    }[] = [
      {
        origem: "salao",
        mesa: 3,
        status: "preparo",
        criadoEm: horasAtras(0.2),
        itens: [
          { item: combo20, qtd: 1 },
          { item: coca, qtd: 2 },
        ],
      },
      {
        origem: "salao",
        mesa: 5,
        status: "novo",
        criadoEm: horasAtras(0.05),
        itens: [{ item: temaki, qtd: 2 }],
      },
      {
        origem: "salao",
        mesa: 1,
        status: "pronto",
        criadoEm: horasAtras(0.3),
        itens: [
          { item: hotFiladelfia, qtd: 5 },
          { item: coca, qtd: 1 },
        ],
      },
      {
        origem: "delivery",
        clienteNome: "Marcos Vinícius",
        endereco: "Rua das Palmeiras, 120",
        status: "pronto",
        formaPagamento: "pix",
        criadoEm: horasAtras(0.4),
        itens: [{ item: combo30, qtd: 1 }],
      },
      {
        origem: "delivery",
        clienteNome: "Juliana Prado",
        endereco: "Av. Brasil, 480 - Ap 22",
        status: "rota",
        formaPagamento: "cartao",
        criadoEm: horasAtras(0.6),
        itens: [
          { item: combo25, qtd: 1 },
          { item: agua, qtd: 2 },
        ],
      },
      {
        origem: "salao",
        mesa: 7,
        status: "finalizado",
        formaPagamento: "dinheiro",
        criadoEm: horasAtras(2),
        itens: [
          { item: combo20, qtd: 2 },
          { item: coca, qtd: 2 },
        ],
      },
      {
        origem: "delivery",
        clienteNome: "Ana Paula",
        endereco: "Rua Ipê, 88",
        status: "finalizado",
        formaPagamento: "pix",
        criadoEm: horasAtras(2.2),
        itens: [{ item: skinCheese, qtd: 5 }],
      },
    ];

    for (const p of seedPedidos) {
      const total = p.itens.reduce((s, i) => s + i.item.preco * i.qtd, 0);
      const [pedido] = await db
        .insert(pedidos)
        .values({
          restauranteId: dashiSushi.id,
          origem: p.origem,
          mesa: p.mesa,
          clienteNome: p.clienteNome,
          endereco: p.endereco,
          status: p.status,
          formaPagamento: p.formaPagamento,
          total,
          criadoEm: p.criadoEm,
        })
        .returning();

      await db.insert(itensPedido).values(
        p.itens.map((i) => ({
          pedidoId: pedido.id,
          itemCardapioId: i.item.id,
          nome: i.item.nome,
          preco: i.item.preco,
          quantidade: i.qtd,
        })),
      );
    }
  }

  console.log("Seed concluído para", dashiSushi.nome);
  console.log("Dono provisório (convite pendente):", DONO_EMAIL);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
