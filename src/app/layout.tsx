import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExamCraft - Trợ Lý Soạn Đề AI Cho Giáo Viên",
  description: "Hệ thống soạn đề thi chuẩn GDPT 2018 bằng AI, hỗ trợ công thức Toán/Lý/Hóa KaTeX, trộn đề tự động và xuất file Word .docx",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body 
        className="h-full w-full overflow-hidden bg-[#f8f9fa] dark:bg-[#121212] text-[#202124] dark:text-[#e3e3e3] selection:bg-[#c2e7ff] selection:text-[#001d35] dark:selection:bg-[#004a77] dark:selection:text-[#c2e7ff] transition-colors duration-200"
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

