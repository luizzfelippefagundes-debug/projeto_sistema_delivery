import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import { ThemeProvider } from "@/components/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Dashi Sushi",
  description: "Cardápio online, comanda digital, cozinha, delivery e painel de gestão da Dashi Sushi.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dashi Sushi",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f7" },
    { media: "(prefers-color-scheme: dark)", color: "#150c0d" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={body.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClerkProvider
            localization={ptBR}
            appearance={{
              variables: {
                colorPrimary: "#e0362b",
                colorForeground: "#1c1416",
                fontFamily: "var(--font-body)",
                borderRadius: "8px",
              },
            }}
          >
            <CartProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </CartProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
