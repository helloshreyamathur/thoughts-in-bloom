import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thoughts in Bloom",
  description: "A digital garden for capturing daily thoughts, observations, and moments of insight.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="font-sans text-[#1C1C1E] min-h-screen relative">
        {/* Fixed gradient background */}
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: `
              radial-gradient(ellipse at 70% 15%, rgba(201,160,160,0.13) 0%, transparent 50%),
              radial-gradient(ellipse at 20% 80%, rgba(143,175,154,0.08) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 50%, rgba(160,154,201,0.06) 0%, transparent 60%),
              #FAFAF8
            `,
          }}
        />
        {/* Decorative blob — top right */}
        <div
          className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] -z-10 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(201,160,160,0.1) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Decorative blob — bottom left */}
        <div
          className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] -z-10 pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(160,154,201,0.08) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <Navigation />
        {children}
      </body>
    </html>
  );
}
