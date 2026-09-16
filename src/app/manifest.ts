import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dashi Sushi",
    short_name: "Dashi Sushi",
    description: "Cardápio online, comanda digital, cozinha, delivery e painel de gestão da Dashi Sushi.",
    start_url: "/",
    display: "standalone",
    background_color: "#150c0d",
    theme_color: "#e0362b",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
