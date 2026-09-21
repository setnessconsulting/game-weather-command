import type { FoundationScenario } from "@/scenarios/schema";

interface WeatherMapShellProps {
  scenario: FoundationScenario;
}

export function WeatherMapShell({ scenario }: WeatherMapShellProps) {
  return (
    <figure aria-labelledby="foundation-map-title">
      <figcaption id="foundation-map-title">Regional station overview</figcaption>
      <svg role="img" viewBox="0 0 100 64" aria-label="Three forecast stations in a fictional region">
        <rect x="1" y="1" width="98" height="62" rx="4" className="map-background" />
        {scenario.stations.map((station) => (
          <g key={station.id} transform={"translate(" + station.position.x * 100 + " " + station.position.y * 64 + ")"}>
            <circle r="3" className="station-marker" />
            <text x="5" y="1.5" className="station-label">{station.name}</text>
          </g>
        ))}
      </svg>
      <ul className="station-list">
        {scenario.stations.map((station) => <li key={station.id}>{station.name}</li>)}
      </ul>
    </figure>
  );
}
