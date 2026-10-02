import { ImageResponse } from "next/og";
import { getLogoDataUri } from "@/lib/logoDataUri";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <img src={getLogoDataUri()} alt="" width={size.width} height={size.height} style={{ objectFit: "contain" }} />
      </div>
    ),
    size,
  );
}
