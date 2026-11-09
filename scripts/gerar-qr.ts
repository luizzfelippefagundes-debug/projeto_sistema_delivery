import { getDb } from "../src/db/index";
import { restaurantes } from "../src/db/schema";

async function main() {
  const lista = await getDb().select({ nome: restaurantes.nome, instancia: restaurantes.instanciaWhatsapp }).from(restaurantes);
  console.log("Instâncias:", JSON.stringify(lista, null, 2));

  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!baseUrl || !apiKey) {
    console.error("EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados");
    process.exit(1);
  }

  for (const r of lista) {
    if (!r.instancia) continue;
    const res = await fetch(`${baseUrl}/instance/connect/${r.instancia}`, {
      headers: { apikey: apiKey },
    });
    const json = await res.json();
    console.log(`\n=== ${r.nome} (${r.instancia}) ===`);
    console.log(JSON.stringify(json, null, 2));
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
