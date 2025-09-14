import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GiftFlow - Tax-Deductible Wish Platform",
  description: "Connect Patrons with Charities through tax-deductible wishes. Only verified, eligible wishes are published and fulfilled.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Social Intents Chatbot */}
        <script 
          src="https://www.socialintents.com/api/chat/socialintents.1.4.js#2c9faa359925d2fe019942f01da133c9" 
          async
        />
      </body>
    </html>
  );
}
