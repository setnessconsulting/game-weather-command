/**
 * Presentation-level number and time formatting for Weather Command.
 *
 * Everything here is a pure function of scenario/snapshot numbers. Formatting never
 * rounds the underlying science: it only affects what a learner reads, and every
 * formatter is also used to build the semantic (screen-reader/table) equivalents so
 * visual and text output cannot drift apart.
 */

/** Fictional local start time for the simulated observing day (06:00). */
export const SIMULATED_CLOCK_START_MINUTE = 6 * 60;

export const roundTo = (value: number, places: number): number => {
  const scale = 10 ** places;
  return Math.round(value * scale) / scale;
};

export const formatTemperature = (celsius: number): string =>
  `${roundTo(celsius, 1).toFixed(1)} °C`;

export const formatSignedTemperature = (delta: number): string => {
  const rounded = roundTo(delta, 1);
  if (rounded === 0) return "0.0 °C";
  return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded).toFixed(1)} °C`;
};

export const formatPressure = (hectopascals: number): string =>
  `${Math.round(hectopascals)} hPa`;

export const formatPressureTendency = (hectopascalsPer3h: number): string => {
  const rounded = roundTo(hectopascalsPer3h, 1);
  if (rounded === 0) return "steady";
  return `${rounded > 0 ? "rising" : "falling"} ${Math.abs(rounded).toFixed(1)} hPa/3 h`;
};

export const formatSignedPressure = (delta: number): string => {
  const rounded = roundTo(delta, 1);
  if (rounded === 0) return "0.0 hPa";
  return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded).toFixed(1)} hPa`;
};

export const formatHumidity = (percent: number): string => `${Math.round(percent)} %`;

export const formatSignedHumidity = (delta: number): string => {
  const rounded = Math.round(delta);
  if (rounded === 0) return "0 %";
  return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded)} %`;
};

export const formatWindSpeed = (metresPerSecond: number): string =>
  `${roundTo(metresPerSecond, 1).toFixed(1)} m/s`;

export const formatSignedWindSpeed = (delta: number): string => {
  const rounded = roundTo(delta, 1);
  if (rounded === 0) return "0.0 m/s";
  return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded).toFixed(1)} m/s`;
};

export const formatPrecipitationRate = (millimetresPerHour: number): string => {
  if (millimetresPerHour <= 0) return "no precipitation";
  return `${roundTo(millimetresPerHour, 1).toFixed(1)} mm/h`;
};

const compassPoints = [
  "north",
  "north-north-east",
  "north-east",
  "east-north-east",
  "east",
  "east-south-east",
  "south-east",
  "south-south-east",
  "south",
  "south-south-west",
  "south-west",
  "west-south-west",
  "west",
  "west-north-west",
  "north-west",
  "north-north-west"
] as const;

const compassAbbreviations = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW"
] as const;

const compassIndex = (degrees: number): number => {
  const normalized = ((degrees % 360) + 360) % 360;
  return Math.round(normalized / 22.5) % 16;
};

/** Full word for a compass bearing, used where a letter code would be too terse. */
export const describeWindDirection = (degrees: number): string => compassPoints[compassIndex(degrees)]!;

export const abbreviateWindDirection = (degrees: number): string => compassAbbreviations[compassIndex(degrees)]!;

export const formatWind = (degrees: number, speedMps: number): string =>
  `${Math.round(((degrees % 360) + 360) % 360)}° ${abbreviateWindDirection(degrees)} at ${formatWindSpeed(speedMps)}`;

/** Compass word describing where a system is heading, from a normalized motion vector. */
export function describeHorizontalMotion(movement: { x: number; y: number }): string {
  // Normalized y increases southwards in this region model, so +y reads as "south".
  const parts: string[] = [];
  if (movement.y < 0) parts.push("north");
  else if (movement.y > 0) parts.push("south");
  if (movement.x > 0) parts.push("east");
  else if (movement.x < 0) parts.push("west");
  if (parts.length === 0) return "stationary";
  if (parts.length === 1) return `${parts[0]}ward`;
  return `${parts[0]}-${parts[1]}ward`;
}

export function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded === 0) return "0 min";
  const hours = Math.floor(Math.abs(rounded) / 60);
  const rest = Math.abs(rounded) % 60;
  const sign = rounded < 0 ? "-" : "";
  if (hours === 0) return `${sign}${rest} min`;
  if (rest === 0) return `${sign}${hours} h`;
  return `${sign}${hours} h ${rest} min`;
}

/** Simulated wall clock (fictional local time) for a scenario minute. */
export function formatSimulatedClock(minute: number): string {
  const total = SIMULATED_CLOCK_START_MINUTE + Math.round(minute);
  const hours = Math.floor(total / 60) % 24;
  const mins = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function formatScenarioOffset(minute: number): string {
  const rounded = Math.round(minute);
  return rounded === 0 ? "start" : `T+${formatDuration(rounded)}`;
}

export function formatSimulatedTimestamp(minute: number): string {
  return `${formatSimulatedClock(minute)} (${formatScenarioOffset(minute)})`;
}

export function formatMinuteRange(start: number, end: number): string {
  return `${String(Math.round(start)).padStart(3, "0")}–${String(Math.round(end)).padStart(3, "0")} min`;
}

export function formatSignedDegrees(delta: number): string {
  const rounded = Math.round(delta);
  if (rounded === 0) return "no shift";
  return `${rounded > 0 ? "+" : "-"}${Math.abs(rounded)}°`;
}
