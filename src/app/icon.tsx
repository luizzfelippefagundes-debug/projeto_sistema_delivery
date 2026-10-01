import { ImageResponse } from "next/og";
import { IconeApp } from "@/lib/iconeApp";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<IconeApp tamanho={size.width} />, size);
}
