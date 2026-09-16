import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e0362b",
          fontSize: 320,
        }}
      >
        🍣
      </div>
    ),
    { width: 512, height: 512 },
  );
}
