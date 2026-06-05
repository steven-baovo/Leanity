import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["vietnamese", "latin"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: {
    default: "Leanity - Quản Lý Năng Suất, Ghi Chép Tài Liệu & Đồng Hồ Pomodoro",
    template: "%s | Leanity"
  },
  description: "Hệ sinh thái hỗ trợ quản lý năng suất công việc toàn diện: Quản lý công việc (Tasks), soạn thảo và lưu trữ tài liệu lâu dài, tích hợp đồng hồ Pomodoro tập trung cao độ và ghi nhận báo cáo công việc tự động hàng ngày.",
  keywords: [
    "quản lý năng suất",
    "quản lý công việc",
    "quản lý tasks",
    "soạn thảo tài liệu",
    "lưu trữ tài liệu",
    "đồng hồ pomodoro",
    "báo cáo công việc",
    "leanity",
    "tập trung pomodoro",
    "hiệu suất làm việc"
  ],
  manifest: "/manifest.json",
  metadataBase: new URL("https://leanitylabs.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Leanity - Giải Pháp Quản Lý Hiệu Suất Toàn Diện",
    description: "Hệ sinh thái hỗ trợ quản lý năng suất công việc: Quản lý Tasks, soạn thảo tài liệu lâu dài, đồng hồ Pomodoro tập trung và báo cáo công việc hàng ngày.",
    url: "https://leanitylabs.com",
    siteName: "Leanity",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Leanity Workspace",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leanity - Giải Pháp Quản Lý Hiệu Suất Toàn Diện",
    description: "Hệ sinh thái hỗ trợ quản lý năng suất công việc: Quản lý Tasks, soạn thảo tài liệu lâu dài, đồng hồ Pomodoro tập trung và báo cáo công việc hàng ngày.",
    images: ["/logo.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema.org Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Leanity",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "VND"
    },
    "description": "Website quản lý năng suất tích hợp Tasks, soạn thảo tài liệu lâu dài, đồng hồ Pomodoro tập trung và báo cáo công việc chi tiết.",
    "featureList": [
      "Quản lý công việc và Tasks khoa học",
      "Soạn thảo và lưu trữ tài liệu lâu dài",
      "Đồng hồ Pomodoro hỗ trợ tập trung cao độ",
      "Ghi nhận và báo cáo công việc tự động"
    ]
  };

  return (
    <html
      lang="vi"
      className={`${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'system';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
