import { ImageResponse } from "next/og";
import { getLogoDataUri } from "@/lib/logoDataUri";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) só aceita <img>, não next/image */}
        <img src={getLogoDataUri()} alt="" width={512} height={512} style={{ objectFit: "cover" }} />
      </div>
    ),
    { width: 512, height: 512 },
  );
}
