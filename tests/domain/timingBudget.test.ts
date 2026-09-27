import { describe, expect, it } from "vitest";

import { stateAtMinute } from "@/domain";
import { canonicalFrontPassageScenarios } from "@/scenarios";
import { createSessionMachine } from "@/game";
import { verifyForecast } from "@/game/verification";
import { toKernelScenario } from "@/scenarios/schema";

/**
 * Interaction timing budgets from docs/PERFORMANCE_AND_DEVICE_BUDGETS.md:
 * time-step computation and forecast verification should each stay under 16 ms median
 * and 50 ms p95 on the reference CI environment. The simulation must remain cheap
 * enough that animation, not science computation, dominates perceived transitions.
 */
const MEDIAN_BUDGET_MS = 16;
const P95_BUDGET_MS = 50;

function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index]!;
}

function median(values: readonly number[]): number {
  return percentile(values, 50);
}

describe("interaction timing budgets", () => {
  it("keeps canonical time-step computation inside the interaction budget", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const kernel = toKernelScenario(scenario);
      const samples: number[] = [];
      for (let iteration = 0; iteration < 40; iteration += 1) {
        const start = performance.now();
        for (let minute = 0; minute <= kernel.timeline.maxMinute; minute += kernel.timeline.stepMinutes) {
          stateAtMinute(kernel, minute);
        }
        samples.push(performance.now() - start);
      }
      const perStepMedian = median(samples) / (kernel.timeline.maxMinute / kernel.timeline.stepMinutes);
      const perStepP95 = percentile(samples, 95) / (kernel.timeline.maxMinute / kernel.timeline.stepMinutes);
      expect(perStepMedian, `${scenario.scenarioId} per-step median`).toBeLessThanOrEqual(MEDIAN_BUDGET_MS);
      expect(perStepP95, `${scenario.scenarioId} per-step p95`).toBeLessThanOrEqual(P95_BUDGET_MS);
    }
  });

  it("keeps forecast verification inside the interaction budget", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const machine = createSessionMachine(scenario);
      const kernel = machine.kernel;
      const accepted = scenario.acceptedRanges[0]!;
      const state = machine.reduce(machine.initialState, { type: "start" });
      const draft = {
        temperatureChangeC: accepted.temperatureChangeC,
        precipitationProbabilityPct: accepted.precipitationProbabilityPct,
        windDirectionDeg: accepted.windDirectionSectorsDeg[0]!,
        transitionWindow: accepted.transitionArrivalMinute,
        confidence: "medium" as const,
        recommendationId: null
      };
      const samples: number[] = [];
      for (let iteration = 0; iteration < 60; iteration += 1) {
        const start = performance.now();
        verifyForecast({
          scenario,
          kernel,
          window: machine.window,
          stationId: machine.targetStationId,
          forecast: draft,
          selectedEvidenceIds: [],
          committedAtMinute: state.minute,
          verificationMinute: machine.verificationMinute
        });
        samples.push(performance.now() - start);
      }
      expect(median(samples), `${scenario.scenarioId} verification median`).toBeLessThanOrEqual(MEDIAN_BUDGET_MS);
      expect(percentile(samples, 95), `${scenario.scenarioId} verification p95`).toBeLessThanOrEqual(P95_BUDGET_MS);
    }
  });
});
