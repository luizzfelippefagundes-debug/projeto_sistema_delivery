import { readFileSync } from "fs";
import path from "path";

let cached: string | null = null;

/** Logo em base64 pra usar dentro de ImageResponse (favicon/ícones do PWA)
 * — esses geradores rodam isolados e não servem arquivos de `public`
 * diretamente por URL relativa, então o jeito confiável é embutir os bytes. */
export function getLogoDataUri(): string {
  if (!cached) {
    const buffer = readFileSync(path.join(process.cwd(), "public", "logo-icon.png"));
    cached = `data:image/png;base64,${buffer.toString("base64")}`;
  }
  return cached;
}
