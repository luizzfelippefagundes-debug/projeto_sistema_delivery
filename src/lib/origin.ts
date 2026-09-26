import { headers } from "next/headers";

/** Origem (protocolo + host) de onde a página foi carregada — usada pra
 * montar links absolutos (ex: QR code de mesa) sem depender de env var
 * fixa. Assim, quando o domínio próprio for apontado, os QR codes gerados
 * a partir dele já saem com o link certo, sem precisar mexer em nada. */
export async function getOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}
