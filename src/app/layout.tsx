import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default:
      "CSMG — Plataforma de Capacitação · Coworking Social de Mudanças Globais",
    template: "%s · CSMG",
  },
  description:
    "Plataforma de capacitação online do Coworking Social de Mudanças Globais (CSMG), uma iniciativa da Prefeitura e SEIM/Integra Rio · Oroborus voltada a empreendedores, MEIs e autônomos da Região Metropolitana do Rio de Janeiro. Faça sua inscrição e tenha acesso gratuito aos cursos.",
  // favicon.ico, icon.svg, apple-icon.png e opengraph-image.tsx são detectados
  // por convenção de arquivo em src/app/ (Next 16) — sem `icons` manual.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
