import { ImageResponse } from "next/og";
import { getLogoDataUri } from "@/lib/logoDataUri";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          borderRadius: 7,
        }}
      >
        <img src={getLogoDataUri()} alt="" width={size.width} height={size.height} style={{ objectFit: "cover" }} />
      </div>
    ),
    size,
  );
}
