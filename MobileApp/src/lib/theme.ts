export const colors = {
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  violet: "#7C3AED",
  gradient: ["#4F46E5", "#7C3AED"] as const,
  bg: "#F5F6FB",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  faint: "#9CA3AF",
  border: "#E5E7EB",
  success: "#10B981",
  successBg: "#D1FAE5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  danger: "#EF4444",
  dangerBg: "#FEE2E2",
  infoBg: "#EEF2FF",
  gold: "#F59E0B",
  silver: "#94A3B8",
  bronze: "#B45309",
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const shadow = {
  shadowColor: "#1F2937",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

export const type = {
  h1: { fontSize: 28, fontWeight: "800" as const, color: colors.text },
  h2: { fontSize: 20, fontWeight: "700" as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
};
