import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip"
import { SiteFooter, SiteHeader } from "@/app/components/portal-ui";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    images: ["/hero-image.png"],
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
      className={cn("h-full antialiased", "font-sans", geist.variable)}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </TooltipProvider>
      </body>
    </html>
  );
}
