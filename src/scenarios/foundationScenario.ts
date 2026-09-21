import type { FoundationScenario } from "./schema";

export const foundationScenario = {
  schemaVersion: "1",
  contentVersion: "foundation-0.1.0",
  scenarioId: "foundation-front-passage",
  title: "Front Passage Foundation",
  seed: 20260921,
  stations: [
    { id: "west", name: "West Station", position: { x: 0.22, y: 0.46 } },
    { id: "central", name: "Central Station", position: { x: 0.5, y: 0.54 } },
    { id: "east", name: "East Station", position: { x: 0.78, y: 0.43 } },
  ],
} satisfies FoundationScenario;
