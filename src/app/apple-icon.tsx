import { ImageResponse } from "next/og";
import { IconeApp } from "@/lib/iconeApp";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<IconeApp tamanho={size.width} />, size);
}
