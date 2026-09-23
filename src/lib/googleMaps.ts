export interface DistanciaReal {
  distanciaKm: number;
  duracaoMin: number;
}

/** Distância e tempo reais de carro (Google Distance Matrix) entre a loja
 * e o endereço do cliente. Só funciona com GOOGLE_MAPS_API_KEY configurada
 * — sem ela, retorna null e quem chamou cai pro tempo estimado manual da
 * zona de entrega (nenhuma tela quebra por causa disso). */
export async function calcularDistanciaReal(origem: string, destino: string): Promise<DistanciaReal | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || !origem.trim() || !destino.trim()) return null;

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    url.searchParams.set("origins", origem);
    url.searchParams.set("destinations", destino);
    url.searchParams.set("mode", "driving");
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    const dados = await res.json();
    const elemento = dados?.rows?.[0]?.elements?.[0];
    if (elemento?.status !== "OK") return null;

    return {
      distanciaKm: Math.round((elemento.distance.value / 1000) * 10) / 10,
      duracaoMin: Math.round(elemento.duration.value / 60),
    };
  } catch (e) {
    console.error("[googleMaps] falha ao calcular distância:", e);
    return null;
  }
}
