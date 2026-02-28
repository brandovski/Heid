import type { Metadata } from "next";
import { Kaisei_Tokumin, Poppins } from "next/font/google";
import "./globals.css";

const kaiseiTokumin = Kaisei_Tokumin({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-kaisei",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Heid",
  description: "Gestão financeira do casal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${kaiseiTokumin.variable} ${poppins.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
