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
  { href: "/cursos", label: "Courses" },
  { href: "/#about-rabbi", label: "About Rabbi" },
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
  "Monthly papers and essays from Rabbi Yattah",
  "Member pricing on every course",
  "Early access to new cohorts and live sessions",
];

export const testimonials = [
  {
    quote:
      "The classes feel rigorous without being intimidating. I finally have a structure for what to study next.",
    name: "Miriam S.",
    detail: "Community member, New York",
  },
  {
    quote:
      "The forum kept the course alive between sessions. Rabbi Yattah answers with real care and precision.",
    name: "David L.",
    detail: "Talmud student, Florida",
  },
  {
    quote:
      "Beautifully organized, serious, and easy to follow on my phone during commutes.",
    name: "Rachel B.",
    detail: "Hebrew Text Lab, California",
  },
];

export const papers = [
  {
    title: "The Ethics of Attention in Prayer",
    category: "Prayer",
    date: "April 2026",
    summary:
      "A short essay on kavvanah, repetition, and the discipline of returning to a word.",
  },
  {
    title: "Responsibility Before Certainty",
    category: "Jewish Thought",
    date: "March 2026",
    summary:
      "How rabbinic sources frame decision-making when knowledge is incomplete.",
  },
  {
    title: "Community as a Form of Learning",
    category: "Education",
    date: "February 2026",
    summary:
      "Why questions, disagreement, and repetition are central to durable study.",
  },
];


export const forumThreads = [
  {
    title: "How should we understand covenant as daily practice?",
    area: "Foundations of Jewish Thought",
    replies: 18,
    unread: 4,
  },
  {
    title: "Tosafot reading group for week two",
    area: "Talmudic Method",
    replies: 11,
    unread: 2,
  },
  {
    title: "Community paper discussion: attention in prayer",
    area: "Community Forum",
    replies: 27,
    unread: 9,
  },
];

export const adminStats = [
  { label: "Total users", value: "1,248", note: "+84 this month" },
  { label: "Community members", value: "396", note: "31.7% of users" },
  { label: "Courses sold", value: "142", note: "April 2026" },
  { label: "Stripe revenue", value: "$28.4k", note: "Monthly gross" },
];

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

