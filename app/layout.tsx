import "./globals.css";
import TopProgress from "@/components/TopProgress";

export const metadata = {
  title: "Warehouse Spreadsheet Hub",
  description: "Portal cepat untuk akses spreadsheet Warehouse (Umum, Finishgood, Material)."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <TopProgress />
        {children}
      </body>
    </html>
  );
}
