import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, Rajdhani, Reenie_Beanie } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const reenieBeanie = Reenie_Beanie({
  variable: "--font-reenie-beanie",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cresent AI - Communication DNA Chatbot",
  description: "Personality-aware AI assistant that adapts to your communication DNA, tone context, and emotional mood.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${rajdhani.variable} ${reenieBeanie.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
