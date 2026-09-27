import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { stateAtMinute } from "@/domain";
import { canonicalFrontPassageScenarios } from "@/scenarios/frontPassageScenarios";
import { toKernelScenario } from "@/scenarios/schema";

interface MatrixObservation {
  readonly temperatureC: number;
  readonly pressureHpa: number;
  readonly pressureTendencyHpaPer3h: number;
  readonly relativeHumidityPct: number;
  readonly windDirectionDeg: number;
  readonly windSpeedMps: number;
  readonly precipitationRateMmh: number;
}

interface MatrixEntry {
  readonly contentVersion: string;
  readonly seed: number;
  readonly stepMinutes: number;
  readonly stations: Readonly<Record<string, Readonly<Record<string, MatrixObservation>>>>;
}

interface GoldenMatrix {
  readonly schemaVersion: "1";
  readonly scenarios: Readonly<Record<string, MatrixEntry>>;
}

const matrixPath = resolve(process.cwd(), "tests/fixtures/goldenObservationMatrix.json");

function loadMatrix(): GoldenMatrix {
  return JSON.parse(readFileSync(matrixPath, "utf8")) as GoldenMatrix;
}

function buildMatrix(): GoldenMatrix {
  const scenarios: Record<string, MatrixEntry> = {};
  for (const scenario of canonicalFrontPassageScenarios) {
    const kernel = toKernelScenario(scenario);
    const stations: Record<string, Record<string, MatrixObservation>> = {};
    for (const station of scenario.stations) {
      const points: Record<string, MatrixObservation> = {};
      for (
        let minute = kernel.timeline.startMinute;
        minute <= kernel.timeline.maxMinute;
        minute += kernel.timeline.stepMinutes
      ) {
        points[String(minute)] = stateAtMinute(kernel, minute).stations[station.id]!;
      }
      stations[station.id] = points;
    }
    scenarios[scenario.scenarioId] = {
      contentVersion: scenario.contentVersion,
      seed: scenario.seed,
      stepMinutes: kernel.timeline.stepMinutes,
      stations
    };
  }
  return { schemaVersion: "1", scenarios };
}

describe("WC-04 canonical golden observation matrix (F16)", () => {
  it("locks every station at every simulation step for all four canonical scenarios", () => {
    const matrix = loadMatrix();
    expect(matrix.schemaVersion).toBe("1");

    for (const scenario of canonicalFrontPassageScenarios) {
      const entry = matrix.scenarios[scenario.scenarioId];
      expect(entry, `matrix is missing ${scenario.scenarioId}`).toBeDefined();
      expect(entry!.contentVersion).toBe(scenario.contentVersion);
      expect(entry!.seed).toBe(scenario.seed);

      const kernel = toKernelScenario(scenario);
      for (const station of scenario.stations) {
        const column = entry!.stations[station.id];
        expect(column, `matrix is missing ${scenario.scenarioId}/${station.id}`).toBeDefined();
        for (
          let minute = kernel.timeline.startMinute;
          minute <= kernel.timeline.maxMinute;
          minute += kernel.timeline.stepMinutes
        ) {
          const expected = column![String(minute)];
          expect(
            stateAtMinute(kernel, minute).stations[station.id],
            `${scenario.scenarioId}/${station.id} at minute ${minute}`
          ).toEqual(expected);
        }
      }
    }
  });

  it("regenerates identically from the same scenario identities", () => {
    const first = buildMatrix();
    const second = buildMatrix();
    expect(second).toEqual(first);
  });

  it("keeps bounded observational variation inside the authored noise amplitude", () => {
    const matrix = loadMatrix();
    const scenario = canonicalFrontPassageScenarios.find(
      (candidate) => candidate.scenarioId === "uncertain-boundary-variant"
    )!;
    const kernel = toKernelScenario(scenario);
    const entry = matrix.scenarios[scenario.scenarioId]!;
    const amplitude = scenario.stationEffects.find((effect) => effect.noise)?.noise?.temperatureC?.amplitude;
    expect(amplitude).toBeDefined();

    for (const station of scenario.stations) {
      const settled = stateAtMinute(kernel, kernel.timeline.maxMinute).stations[station.id]!;
      const settledMatrix = entry.stations[station.id]![String(kernel.timeline.maxMinute)]!;
      expect(settled.temperatureC).toBe(settledMatrix.temperatureC);
      const baseline = scenario.stations.find((candidate) => candidate.id === station.id)!.initial.temperatureC;
      const change = scenario.stationEffects
        .filter((effect) => effect.stationId === station.id)
        .reduce((total, effect) => total + (effect.delta.temperatureC ?? 0), 0);
      expect(Math.abs(settled.temperatureC - (baseline + change))).toBeLessThanOrEqual(amplitude!);
    }
  });
});

if (process.env.REGENERATE_GOLDEN_MATRIX === "1") {
  writeFileSync(matrixPath, `${JSON.stringify(buildMatrix(), null, 2)}\n`, "utf8");
}
