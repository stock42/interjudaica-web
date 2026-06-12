export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export type Course = {
  slug: string;
  title: string;
  category: string;
  level: CourseLevel;
  price: number;
  communityPrice: number;
  duration: string;
  startDate: string;
  endDate: string;
  imageLabel: string;
  thumbnailImageUrl?: string;
  coverImageUrl?: string;
  accent: string;
  description: string;
  summary: string;
  instructor: string;
  video: string;
  certificate: string;
  zoomLink: string;
  stripePaymentLink: string;
  includes: string[];
  outcomes: string[];
  editions: {
    name: string;
    schedule: string;
    seats: string;
  }[];
  sampleMaterials: {
    kind: string;
    title: string;
  }[];
  lessons: {
    title: string;
    duration: string;
    material: string;
  }[];
};

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/books", label: "Books" },
  { href: "/community", label: "Community" },
  { href: "/forum", label: "Forum" },
  { href: "/ernesto-yattah", label: "About Ernesto" },
  { href: "/contact", label: "Contact" },
];

export const contactInfo = {
  whatsapp: "+54 9 11 5836 7095",
  whatsappHref: "https://wa.me/5491158367095",
  email: "eyattah@hotmail.com",
  officeHours: [
    "Monday to Thursday: 9:00 AM - 10:00 PM",
    "Friday: 9:00 AM - 5:00 PM",
    "Sunday: 10:00 AM - 8:00 PM",
    "Office closed on Shabbat and Jewish Holidays.",
    "Emails and WhatsApp messages will be answered after Shabbat and Holidays.",
  ],
};

export const communityBenefits = [
  "Private forum for ongoing questions and chavruta matching",
  "Monthly papers and essays from Ernesto Yattah",
  "Member pricing on every course",
  "Early access to new cohorts and live sessions",
];

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
