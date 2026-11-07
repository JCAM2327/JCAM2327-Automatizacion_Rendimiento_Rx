import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Automatización de rendimiento en reacciones",
  description:
    "Calculá y visualizá el rendimiento de síntesis químicas a partir de archivos Excel o CSV. Los datos se procesan en el navegador.",
  applicationName: "Automatización de rendimiento en reacciones",
  keywords: [
    "química",
    "rendimiento",
    "síntesis",
    "reacciones",
    "Excel",
    "CSV",
  ],
  openGraph: {
    title: "Automatización de rendimiento en reacciones",
    description:
      "Calculá y visualizá el rendimiento de síntesis químicas a partir de archivos Excel o CSV.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
