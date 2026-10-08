/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const darkPalette = {
  text: '#FFFDF9',
  tint: '#8F50FF',
  background: '#09090B',
  foreground: '#FFFDF9',
  card: '#141317',
  cardForeground: '#FFFDF9',
  primary: '#8F50FF',
  primaryForeground: '#FFFFFF',
  secondary: '#201E24',
  secondaryForeground: '#FFFDF9',
  muted: '#201E24',
  mutedForeground: '#A7A1AB',
  accent: '#28193C',
  accentForeground: '#CDAAFF',
  magenta: '#F044BE',
  destructive: '#E25B6A',
  destructiveForeground: '#FFFFFF',
  border: '#302C35',
  input: '#201E24',
  party: '#A978FF',
  concerti: '#F044BE',
  mostre: '#C6A9FA',
  aperitivi: '#F3AF83',
  mapBase: '#131018',
  mapRoad: '#3D344B',
  success: '#7BC7A0',
};

const colors = {
  light: darkPalette,
  dark: darkPalette,
  radius: 18,
};

export default colors;
