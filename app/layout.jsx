import "./globals.css";
import { AuthProvider } from "./lib/AuthContext";

export const metadata = {
  title: "Sistem Data Pembayaran - Supabase Integrated",
  description: "Manajemen data pembayaran warga otomatis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
