import { ImageResponse } from "next/og";
import { IconeApp } from "@/lib/iconeApp";

export function GET() {
  return new ImageResponse(<IconeApp tamanho={192} />, { width: 192, height: 192 });
}
