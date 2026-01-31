import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Weather Wallpaper — Fond d'écran météo pour pêcheurs",
  description:
    "Générez un fond d'écran météo personnalisé pour votre iPhone. Conditions actuelles, prévisions horaires et données solunaires pour la pêche.",
  keywords: ["météo", "wallpaper", "pêche", "solunar", "iPhone", "fond d'écran"],
  authors: [{ name: "Weather Wallpaper" }],
  openGraph: {
    title: "Weather Wallpaper",
    description: "Fond d'écran météo dynamique pour pêcheurs",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${jetbrainsMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
