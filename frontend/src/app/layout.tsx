import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import AiChatWidget from "@/components/ai-chat/AiChatWidget";

export const metadata: Metadata = {
  title: "Car Information System",
  description: "Database spesifikasi kendaraan terbesar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <Providers>
          {children}
          <AiChatWidget />
        </Providers>
      </body>
    </html>
  );
}
