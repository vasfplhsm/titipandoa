// The six palettes below are the sole source of semantic theme colors.
// Accent/secondary colors are decorative; primary/muted text pairs meet WCAG AA.
export const PALETTE_KEY = "titipandoa.palette";
export const APPEARANCE_KEY = "titipandoa.theme"; // Retained legacy light/dark preference.
export const DEFAULT_PALETTE = "rosewood";
export const DEFAULT_APPEARANCE = "light";
export const APPEARANCES = ["light", "dark", "system"];
export const THEMES = [
  {
    id: "rosewood",
    name: "Rosewood & Champagne",
    description: "Hangat, peribadi dan penuh kelembutan.",
    light: {
      primary: "#713F4B",
      primaryDark: "#482C35",
      secondary: "#C8A5A8",
      background: "#F9F3EC",
      accent: "#D7B46A",
      ink: "#482C35",
      muted: "#705A5D",
      surface: "#FFFFFF",
      line: "#E4D5D6",
      soft: "#F0E6E4",
      onPrimary: "#FFFFFF",
    },
    dark: {
      primary: "#D9B0B7",
      primaryDark: "#E9CFD3",
      secondary: "#C8A5A8",
      background: "#21191C",
      accent: "#D7B46A",
      ink: "#F7EFEC",
      muted: "#CEBDC1",
      surface: "#302328",
      line: "#60464E",
      soft: "#3B2B31",
      onPrimary: "#2B1C22",
    },
  },
  {
    id: "sage",
    name: "Sage & Sand",
    description: "Tenang, semula jadi dan bersahaja.",
    light: {
      primary: "#496356",
      primaryDark: "#28382F",
      secondary: "#B6C7B2",
      background: "#FAF7F0",
      accent: "#C4A574",
      ink: "#28382F",
      muted: "#58665D",
      surface: "#FFFFFF",
      line: "#DCE2D9",
      soft: "#EFF2EC",
      onPrimary: "#FFFFFF",
    },
    dark: {
      primary: "#B6C7B2",
      primaryDark: "#D7E3D3",
      secondary: "#B6C7B2",
      background: "#18231D",
      accent: "#D6B985",
      ink: "#F0F3E9",
      muted: "#BDC9BD",
      surface: "#223027",
      line: "#435648",
      soft: "#2C3D31",
      onPrimary: "#18231D",
    },
  },
  {
    id: "coastal",
    name: "Coastal Serenity",
    description: "Segar, lapang dan mendamaikan.",
    light: {
      primary: "#28575C",
      primaryDark: "#203C40",
      secondary: "#AED0CE",
      background: "#F5F9F7",
      accent: "#D8B88D",
      ink: "#203C40",
      muted: "#526D6F",
      surface: "#FFFFFF",
      line: "#D5E3E0",
      soft: "#E9F1EE",
      onPrimary: "#FFFFFF",
    },
    dark: {
      primary: "#AED0CE",
      primaryDark: "#CEE2DF",
      secondary: "#AED0CE",
      background: "#17262A",
      accent: "#D8B88D",
      ink: "#EFF6F3",
      muted: "#B8CCCB",
      surface: "#213438",
      line: "#415D60",
      soft: "#2B4145",
      onPrimary: "#17262A",
    },
  },
];
export const THEMES_BY_ID = Object.fromEntries(
  THEMES.map((theme) => [theme.id, theme]),
);
export const validPalette = (value) =>
  typeof value === "string" && Object.hasOwn(THEMES_BY_ID, value);
export const validAppearance = (value) => APPEARANCES.includes(value);
export function selectPreferences(
  publicTheme,
  publicAppearance,
  paletteOverride,
  appearanceOverride,
) {
  return {
    palette: validPalette(paletteOverride)
      ? paletteOverride
      : validPalette(publicTheme)
        ? publicTheme
        : DEFAULT_PALETTE,
    appearance: validAppearance(appearanceOverride)
      ? appearanceOverride
      : validAppearance(publicAppearance)
        ? publicAppearance
        : DEFAULT_APPEARANCE,
  };
}
export function resolveAppearance(appearance, deviceDark = false) {
  return appearance === "system"
    ? deviceDark
      ? "dark"
      : "light"
    : appearance === "dark"
      ? "dark"
      : "light";
}
export function themeVariables(palette, appearance) {
  const theme = THEMES_BY_ID[palette] || THEMES_BY_ID[DEFAULT_PALETTE];
  return Object.fromEntries(
    Object.entries(theme[appearance === "dark" ? "dark" : "light"]).map(
      ([key, value]) => [
        "--theme-" +
          key.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase()),
        value,
      ],
    ),
  );
}
