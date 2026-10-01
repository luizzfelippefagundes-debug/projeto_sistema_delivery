import { ImageResponse } from "next/og";
import { IconeApp } from "@/lib/iconeApp";

export function GET() {
  return new ImageResponse(<IconeApp tamanho={512} />, { width: 512, height: 512 });
}
