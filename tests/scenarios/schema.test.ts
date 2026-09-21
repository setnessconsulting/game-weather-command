import { describe, expect, it } from "vitest";

import { foundationScenario } from "@/scenarios/foundationScenario";
import { parseFoundationScenario } from "@/scenarios/schema";

describe("foundationScenarioSchema", () => {
  it("accepts the canonical foundation fixture", () => {
    expect(parseFoundationScenario(foundationScenario)).toEqual(foundationScenario);
  });

  it("rejects an insufficient station set", () => {
    expect(() => parseFoundationScenario({ ...foundationScenario, stations: [] })).toThrow();
  });

  it("rejects out-of-bounds normalized coordinates", () => {
    const invalid = {
      ...foundationScenario,
      stations: foundationScenario.stations.map((station, index) =>
        index === 0 ? { ...station, position: { x: 2, y: station.position.y } } : station,
      ),
    };
    expect(() => parseFoundationScenario(invalid)).toThrow();
  });
});
