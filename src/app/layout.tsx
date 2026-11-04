import type { Metadata } from "next";
import { Inter, Archivo_Black, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlayerProvider } from "@/components/player";
import { PlayerBar } from "@/components/player-bar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
});
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "TWEAK",
  description:
    "A home for the counterculture. Music first. Community second. When rage becomes the norm, TWEAK becomes the next thing.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${archivoBlack.variable} ${geistMono.variable} antialiased`}
      >
        <PlayerProvider>
          {children}
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
