import type { Metadata } from "next";
import { Space_Grotesk, DM_Serif_Display, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GymBuddy - Find Your Fitness Partner",
  description: "Building Confidence Through Community. Find compatible workout partners at University of Windsor.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23E63B2E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14.4 14.4 9.6 9.6'/><path d='M18.65 21.35a2 2 0 0 1-2.83 0l-5.66-5.66a2 2 0 0 1 0-2.83l.06-.06a2 2 0 0 1 2.83 0l5.66 5.66a2 2 0 0 1 0 2.83Z'/><path d='m21.5 21.5-1.4-1.4'/><path d='M3.9 3.9 2.5 2.5'/><path d='M6.4 1.43a4 4 0 0 0-5.66 5.66l8.49 8.49a4 4 0 0 0 5.66-5.66Z'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSerif.variable} ${spaceMono.variable}`}>
      <body className="noise-overlay">
        <Navbar />
        <main className="pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
