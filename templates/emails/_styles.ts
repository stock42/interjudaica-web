export const palette = {
  bg: "#050608",
  panel: "#0b0f12",
  gold: "#f4bd33",
  text: "#f8f2e8",
  muted: "rgba(248,242,232,0.72)",
  line: "rgba(244,189,51,0.22)",
};

export const base = {
  fontFamily: "Arial, sans-serif",
  backgroundColor: palette.bg,
  color: palette.text,
  padding: "28px 18px",
};

export const card = {
  maxWidth: 640,
  margin: "0 auto",
  backgroundColor: palette.panel,
  border: `1px solid ${palette.line}`,
  borderRadius: 16,
  padding: 24,
};

export const h1 = {
  margin: 0,
  fontSize: 22,
  lineHeight: "28px",
  color: palette.text,
};

export const small = {
  fontSize: 12,
  lineHeight: "18px",
  color: palette.muted,
};
