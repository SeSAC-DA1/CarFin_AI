import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MiniDatabaseStatus } from "@/components/demo/SimpleDatabaseStatus";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarFin AI - 당신만을 위한 AI 차량 추천",
  description: "AI 멀티에이전트가 제공하는 개인화 차량 추천 및 금융 상담 서비스",
  keywords: "차량추천, AI, 멀티에이전트, 금융상담, 중고차, 신차",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {/* 실시간 DB 연결 상태 - 모든 페이지 상단 고정 */}
        <div className="fixed top-4 right-4 z-50">
          <MiniDatabaseStatus />
        </div>
        {children}
      </body>
    </html>
  );
}