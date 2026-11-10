"use server";

export interface EnderecoLocalizacao {
  rua: string;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  cep: string | null;
}

/** Converte coordenadas de GPS (latitude, longitude) no endereço brasileiro
 * correspondente (rua, número aproximado, bairro e cidade) usando a base do
 * OpenStreetMap Nominatim. */
export async function buscarEnderecoPorCoordenadas(
  latitude: number,
  longitude: number,
): Promise<EnderecoLocalizacao | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "NoroesteFoodDeliveryApp/1.0 (contato@noroestesistemas.com.br)",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address;
    if (!addr) return null;

    const rua = addr.road || addr.pedestrian || addr.street || addr.footway || "";
    const numero = addr.house_number || null;
    const bairro =
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.residential ||
      addr.subdistrict ||
      null;
    const cidade = addr.city || addr.town || addr.village || addr.municipality || null;
    const cep = addr.postcode || null;

    if (!rua && !bairro) return null;

    return { rua, numero, bairro, cidade, cep };
  } catch (e) {
    console.error("[buscarEnderecoPorCoordenadas] Erro:", e);
    return null;
  }
}
