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
  { href: "/comunidad", label: "Community" },
  { href: "/#about-rabbi", label: "About Rabbi" },
  { href: "/#contact", label: "Contact" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
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

export const courses: Course[] = [
  {
    slug: "foundations-jewish-thought",
    title: "Foundations of Jewish Thought",
    category: "Jewish Philosophy",
    level: "Beginner",
    price: 180,
    communityPrice: 145,
    duration: "8 weeks",
    startDate: "May 12, 2026",
    endDate: "June 30, 2026",
    imageLabel: "Core",
    accent: "#126c63",
    description:
      "A guided entry into belief, covenant, mitzvot, prayer, ethics, and the intellectual architecture of Jewish tradition.",
    summary:
      "Build a vocabulary for serious Jewish learning and a clear map of the ideas that shape daily practice.",
    instructor: "Rabbi Yattah",
    video: "HD class recordings",
    certificate: "Digital certificate included",
    zoomLink: "Live Zoom access",
    stripePaymentLink: "#",
    includes: [
      "Weekly live class with replay access",
      "Source sheets in English and Hebrew",
      "Private course forum moderated by InterJudaica",
      "Final reflection project for certificate",
    ],
    outcomes: [
      "Explain core Jewish concepts with confidence",
      "Read primary sources with historical context",
      "Connect Jewish ideas to contemporary questions",
    ],
    editions: [
      {
        name: "Spring live cohort",
        schedule: "Tuesdays, 8:00 PM Eastern",
        seats: "18 seats left",
      },
      {
        name: "Self-paced edition",
        schedule: "Open enrollment",
        seats: "Immediate access",
      },
    ],
    sampleMaterials: [
      { kind: "PDF", title: "Belief and action source packet" },
      { kind: "Video", title: "Trailer: covenant as a living idea" },
    ],
    lessons: [
      {
        title: "Covenant, peoplehood, and purpose",
        duration: "62 min",
        material: "PDF source sheet",
      },
      {
        title: "Mitzvot as structure and practice",
        duration: "58 min",
        material: "Audio summary",
      },
      {
        title: "Prayer, language, and attention",
        duration: "71 min",
        material: "Guided reading",
      },
    ],
  },
  {
    slug: "talmudic-method-modern-questions",
    title: "Talmudic Method and Modern Questions",
    category: "Talmud",
    level: "Advanced",
    price: 240,
    communityPrice: 195,
    duration: "10 weeks",
    startDate: "July 8, 2026",
    endDate: "September 9, 2026",
    imageLabel: "Gemara",
    accent: "#1b4f9c",
    description:
      "A rigorous course on sugyot, argument structure, legal reasoning, and how classical analysis speaks to modern dilemmas.",
    summary:
      "Move from translation to method: identify claims, counterclaims, assumptions, and halakhic movement inside a sugya.",
    instructor: "Rabbi Yattah",
    video: "Chaptered video sessions",
    certificate: "Advanced certificate included",
    zoomLink: "Live Zoom access",
    stripePaymentLink: "#",
    includes: [
      "Ten live shiurim with guided chavruta prompts",
      "Annotated sugyot and vocabulary sheets",
      "Course forum for argument mapping",
      "Optional oral review with instructor notes",
    ],
    outcomes: [
      "Trace a Talmudic argument from premise to conclusion",
      "Compare Rashi, Tosafot, and later readings",
      "Apply method without flattening the source",
    ],
    editions: [
      {
        name: "Summer night seder",
        schedule: "Wednesdays, 8:30 PM Eastern",
        seats: "12 seats left",
      },
      {
        name: "Recorded cohort",
        schedule: "Access from August 1, 2026",
        seats: "Unlimited",
      },
    ],
    sampleMaterials: [
      { kind: "PDF", title: "Sample sugya map" },
      { kind: "Video", title: "Trailer: how a question becomes law" },
    ],
    lessons: [
      {
        title: "Anatomy of a sugya",
        duration: "76 min",
        material: "PDF map",
      },
      {
        title: "Rashi and the first reading",
        duration: "69 min",
        material: "Source packet",
      },
      {
        title: "Modern cases, classical constraints",
        duration: "83 min",
        material: "Case notes",
      },
    ],
  },
  {
    slug: "hebrew-text-lab",
    title: "Hebrew Text Lab: Siddur and Parsha",
    category: "Hebrew Text",
    level: "Intermediate",
    price: 210,
    communityPrice: 170,
    duration: "9 weeks",
    startDate: "September 15, 2026",
    endDate: "November 10, 2026",
    imageLabel: "Text Lab",
    accent: "#9b342c",
    description:
      "A practical reading lab for students who want better fluency with Biblical and liturgical Hebrew.",
    summary:
      "Strengthen grammar, roots, and textual intuition while reading selections from the siddur and weekly parsha.",
    instructor: "Rabbi Yattah",
    video: "Practice recordings",
    certificate: "Digital certificate included",
    zoomLink: "Live Zoom access",
    stripePaymentLink: "#",
    includes: [
      "Weekly text lab with pronunciation practice",
      "Downloadable vocabulary decks",
      "Audio drills for every unit",
      "Forum thread for translation questions",
    ],
    outcomes: [
      "Identify common roots and verb patterns",
      "Translate selected prayers with nuance",
      "Prepare a parsha reading independently",
    ],
    editions: [
      {
        name: "Fall cohort",
        schedule: "Tuesdays, 7:30 PM Eastern",
        seats: "24 seats left",
      },
      {
        name: "Sunday review group",
        schedule: "Sundays, 11:00 AM Eastern",
        seats: "Waitlist open",
      },
    ],
    sampleMaterials: [
      { kind: "PDF", title: "Root families reference" },
      { kind: "Audio", title: "Siddur pronunciation sample" },
    ],
    lessons: [
      {
        title: "Roots, prefixes, and prayer language",
        duration: "54 min",
        material: "Vocabulary deck",
      },
      {
        title: "Reading the Amidah closely",
        duration: "64 min",
        material: "Annotated PDF",
      },
      {
        title: "Parsha rhythm and grammar",
        duration: "59 min",
        material: "Audio drills",
      },
    ],
  },
];

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

export const dashboardCourses = courses.slice(0, 2);

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

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}
