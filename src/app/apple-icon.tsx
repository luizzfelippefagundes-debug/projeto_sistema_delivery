import { ImageResponse } from "next/og";
import { getLogoDataUri } from "@/lib/logoDataUri";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <img src={getLogoDataUri()} alt="" width={size.width} height={size.height} style={{ objectFit: "cover" }} />
      </div>
    ),
    size,
  );
}
