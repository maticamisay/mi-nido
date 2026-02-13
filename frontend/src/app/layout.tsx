import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi Nido - Gestión para Jardines Maternales",
  description: "Software de gestión integral para jardines maternales en Argentina. Todo tu jardín en un solo lugar.",
  keywords: "jardín maternal, gestión escolar, cuaderno digital, asistencia, pagos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
