import { describe, expect, it } from "vitest";

import { stateAtMinute } from "@/domain";
import { canonicalFrontPassageScenarios, type WeatherScenarioV1 } from "@/scenarios";
import { buildEvidenceCatalog, createSessionMachine } from "@/game";

const guided = canonicalFrontPassageScenarios[0]!;

describe("evidence catalog gating", () => {
  it("exposes only evidence whose availability time has been reached", () => {
    const machine = createSessionMachine(guided);
    const atStart = buildEvidenceCatalog(guided, machine.kernel, stateAtMinute(machine.kernel, 0));

    expect(atStart.unlocked.map((item) => item.id)).toEqual(["guided-stations-initial"]);
    expect(atStart.locked.map((item) => item.availableAtMinute)).toEqual([30, 30, 60]);
    expect(atStart.nextUnlockMinute).toBe(30);
    expect(atStart.timestamp).toBe("06:00 (start)");

    const atSixty = buildEvidenceCatalog(guided, machine.kernel, stateAtMinute(machine.kernel, 60));
    expect(atSixty.unlocked.map((item) => item.id)).toEqual([
      "guided-stations-initial",
      "guided-pressure-trend",
      "guided-front-position",
      "guided-precipitation-band"
    ]);
    expect(atSixty.locked).toHaveLength(0);
    expect(atSixty.nextUnlockMinute).toBeUndefined();
  });

  it("gives every evidence set a semantic summary and inspectable facts", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const machine = createSessionMachine(scenario);
      const catalog = buildEvidenceCatalog(
        scenario,
        machine.kernel,
        stateAtMinute(machine.kernel, scenario.timeline.maxMinute)
      );
      expect(catalog.unlocked).toHaveLength(scenario.evidence.length);
      for (const item of catalog.unlocked) {
        expect(item.summary.length, `${scenario.scenarioId}/${item.id} summary`).toBeGreaterThan(20);
        expect(item.facts.length, `${scenario.scenarioId}/${item.id} facts`).toBeGreaterThan(0);
        for (const fact of item.facts) {
          expect(fact.label.length).toBeGreaterThan(0);
          expect(fact.value.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("reports all six instruments for each station in a station evidence set", () => {
    const machine = createSessionMachine(guided);
    const catalog = buildEvidenceCatalog(guided, machine.kernel, stateAtMinute(machine.kernel, 0));
    const stationEvidence = catalog.unlocked[0]!;
    const labelled = stationEvidence.facts.map((fact) => fact.label);
    for (const station of guided.stations) {
      expect(labelled).toContain(`${station.name} · Temperature`);
      expect(labelled).toContain(`${station.name} · Pressure`);
      expect(labelled).toContain(`${station.name} · Pressure tendency`);
      expect(labelled).toContain(`${station.name} · Humidity`);
      expect(labelled).toContain(`${station.name} · Wind`);
      expect(labelled).toContain(`${station.name} · Precipitation now`);
    }
  });

  it("cannot read grading data, because it only reads public evidence and state", () => {
    const machine = createSessionMachine(guided);
    const state = stateAtMinute(machine.kernel, 120);
    const baseline = buildEvidenceCatalog(guided, machine.kernel, state);

    const stripped = structuredClone(guided) as WeatherScenarioV1 & {
      acceptedRanges: unknown[];
      debrief: unknown[];
    };
    stripped.acceptedRanges = [];
    stripped.debrief = [];

    expect(buildEvidenceCatalog(stripped as WeatherScenarioV1, machine.kernel, state)).toEqual(baseline);
  });

  it("changes as simulated time advances", () => {
    const machine = createSessionMachine(guided);
    const early = buildEvidenceCatalog(guided, machine.kernel, stateAtMinute(machine.kernel, 60));
    const later = buildEvidenceCatalog(guided, machine.kernel, stateAtMinute(machine.kernel, 180));
    expect(later.timestamp).not.toBe(early.timestamp);
    const earlyTrend = early.unlocked.find((item) => item.kind === "trend")!;
    const laterTrend = later.unlocked.find((item) => item.kind === "trend")!;
    expect(laterTrend.facts.length).toBeGreaterThanOrEqual(earlyTrend.facts.length);
    expect(laterTrend.summary).not.toBe(earlyTrend.summary);
  });

  it("describes front motion and extrapolated arrival for boundary evidence", () => {
    const machine = createSessionMachine(guided);
    const catalog = buildEvidenceCatalog(guided, machine.kernel, stateAtMinute(machine.kernel, 30));
    const boundary = catalog.unlocked.find((item) => item.kind === "boundary")!;
    const labels = boundary.facts.map((fact) => fact.label);
    expect(labels.some((label) => label.includes("position"))).toBe(true);
    expect(labels.some((label) => label.includes("motion"))).toBe(true);
    expect(boundary.facts.some((fact) => fact.value.includes("extrapolated arrival"))).toBe(true);
  });
});
