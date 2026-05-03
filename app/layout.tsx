import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/app/components/portal-ui";

export const metadata: Metadata = {
  metadataBase: new URL("https://interjudaica.com"),
  title: {
    default: "InterJudaica | Jewish Courses and Community",
    template: "%s | InterJudaica",
  },
  description:
    "InterJudaica offers English-language Jewish courses, community membership, papers, forums, and student certificates for learners in the United States.",
  openGraph: {
    title: "InterJudaica",
    description:
      "Live Jewish courses, private community study, and student resources in English.",
    images: ["/logo-interjudaica.png"],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
