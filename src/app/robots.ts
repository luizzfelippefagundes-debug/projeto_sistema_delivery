import type { MetadataRoute } from "next";

/** Bloqueia todas as áreas internas (painéis de gestão, telas de login,
 * mesa por QR code, impressão de comanda) — só o cardápio digital público
 * (`/loja/[slug]`) deve aparecer no Google. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dono",
          "/dono/*",
          "/atendente",
          "/atendente/*",
          "/cozinha",
          "/cozinha/*",
          "/motoboy",
          "/motoboy/*",
          "/entrar",
          "/entrar/*",
          "/cadastro",
          "/cadastro/*",
          "/sign-in",
          "/sign-up",
          "/comecar",
          "/meus-pedidos",
          "/pedido/*",
          "/imprimir/*",
          "/sem-acesso",
          "/loja/*/mesa/*",
        ],
      },
    ],
    sitemap: "https://daishisushi.com.br/sitemap.xml",
  };
}
