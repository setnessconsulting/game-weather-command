import type { WeatherScenarioV1 } from "./schema";

type ScienceSource = WeatherScenarioV1["sources"][number];

export const scienceSources = {
  ngssMsEss25: {
    id: "ngss-ms-ess2-5",
    url: "https://www.nextgenscience.org/pe/ms-ess2-5-earths-systems",
    relationship:
      "Air masses flow from relatively high to low pressure; weather variables change over time; colliding air masses can cause sudden change; forecasts are probabilistic.",
    usage:
      "Defines the learning scope, required weather variables, probabilistic forecast framing, and the boundary against symbol/cloud-name memorization.",
    reviewed: true,
  },
  nwsFronts: {
    id: "nws-fronts",
    url: "https://www.weather.gov/jkl/education",
    relationship:
      "Cold-front passage commonly brings colder/drier air, a wind shift, pressure-tendency change, and sometimes a precipitation band; warm fronts produce more gradual ascent and often broader precipitation.",
    usage:
      "Grounds cold-front and warm-front causal direction, wind/pressure changes, and relative abruptness of canonical scenarios.",
    reviewed: true,
  },
  noaaWeatherMap: {
    id: "noaa-weather-map",
    url: "https://www.nesdis.noaa.gov/about/k-12-education/weather-forecasting/how-read-weather-map",
    relationship:
      "Weather maps combine pressure systems, fronts, observations, and precipitation information used by meteorologists to reason about changing weather.",
    usage:
      "Grounds age-appropriate weather-map evidence and reinforces high-to-low pressure reasoning without requiring symbol recall for success.",
    reviewed: true,
  },
} as const satisfies Record<string, ScienceSource>;

export const canonicalScienceSources: ScienceSource[] = [
  scienceSources.ngssMsEss25,
  scienceSources.nwsFronts,
  scienceSources.noaaWeatherMap,
];
