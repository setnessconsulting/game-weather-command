import { describe, expect, it } from "vitest";

import { canonicalFrontPassageScenarios } from "@/scenarios";
import {
  EMPTY_FORECAST_DRAFT,
  RECOMMENDATION_OPTIONS,
  createSessionMachine,
  draftDirection,
  recommendationOption,
  validateForecastDraft,
  type ForecastDraft
} from "@/game";

const guided = canonicalFrontPassageScenarios[0]!;
const machine = createSessionMachine(guided);

const completeDraft: ForecastDraft = {
  temperatureChangeC: { min: -8, max: -5 },
  precipitationProbabilityPct: { min: 60, max: 90 },
  windDirectionDeg: { min: 240, max: 300 },
  transitionWindow: { min: 90, max: 120 },
  confidence: "medium",
  recommendationId: "cool-sharp"
};

describe("forecast draft validation", () => {
  it("blocks an empty draft and names each missing field", () => {
    const result = validateForecastDraft(EMPTY_FORECAST_DRAFT, guided, machine.window);
    expect(result.ok).toBe(false);
    expect(result.issues.every((issue) => issue.severity === "blocking")).toBe(true);
    expect(result.issues.map((issue) => issue.field).sort()).toEqual([
      "confidence",
      "precipitation",
      "recommendation",
      "temperature",
      "timing",
      "wind"
    ]);
  });

  it("accepts a complete, internally consistent draft", () => {
    const result = validateForecastDraft(completeDraft, guided, machine.window);
    expect(result.ok).toBe(true);
    expect(result.issues.filter((issue) => issue.severity === "blocking")).toHaveLength(0);
  });

  it("rejects inverted ranges", () => {
    const result = validateForecastDraft(
      { ...completeDraft, temperatureChangeC: { min: 5, max: -5 } },
      guided,
      machine.window
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("inverted"))).toBe(true);
  });

  it("rejects values outside the modelled bounds without comparing them with the answer", () => {
    const result = validateForecastDraft(
      {
        ...completeDraft,
        precipitationProbabilityPct: { min: -5, max: 120 },
        windDirectionDeg: { min: 0, max: 400 }
      },
      guided,
      machine.window
    );
    expect(result.ok).toBe(false);
    const messages = result.issues.map((issue) => issue.message).join(" ");
    expect(messages).toContain("%");
    expect(messages).toContain("degrees");
  });

  it("flags a very broad timing window as advisory rather than wrong", () => {
    const result = validateForecastDraft(
      { ...completeDraft, transitionWindow: { min: 0, max: 240 } },
      guided,
      machine.window
    );
    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.field === "timing" && issue.severity === "advisory")).toBe(true);
  });

  it("notes a timing window that starts outside the published forecast window", () => {
    const result = validateForecastDraft(
      { ...completeDraft, transitionWindow: { min: 180, max: 210 } },
      guided,
      machine.window
    );
    expect(result.ok).toBe(true);
    expect(result.issues.some((issue) => issue.message.includes("published forecast window"))).toBe(true);
  });

  it("notes an almost meaningless probability range", () => {
    const result = validateForecastDraft(
      { ...completeDraft, precipitationProbabilityPct: { min: 0, max: 100 } },
      guided,
      machine.window
    );
    expect(result.issues.some((issue) => issue.message.includes("saying nothing"))).toBe(true);
  });

  it("treats non-finite numbers as blocking", () => {
    const result = validateForecastDraft(
      { ...completeDraft, temperatureChangeC: { min: Number.NaN, max: Number.NaN } },
      guided,
      machine.window
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("must be a number"))).toBe(true);
  });
});

describe("forecast direction", () => {
  it("reads direction from the midpoint of the stated range", () => {
    expect(draftDirection(completeDraft)).toBe("cooler");
    expect(draftDirection({ ...completeDraft, temperatureChangeC: { min: 3, max: 7 } })).toBe("warmer");
    expect(draftDirection({ ...completeDraft, temperatureChangeC: { min: -0.5, max: 0.5 } })).toBe("unsure");
    expect(draftDirection(EMPTY_FORECAST_DRAFT)).toBe("unsure");
  });
});

describe("recommendation options", () => {
  it("offers a bounded, direction-tagged set for every mission type", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const options = RECOMMENDATION_OPTIONS[scenario.missionType];
      expect(options.length, scenario.missionType).toBeGreaterThanOrEqual(3);
      expect(new Set(options.map((option) => option.id)).size).toBe(options.length);
      for (const option of options) {
        expect(option.label.length).toBeGreaterThan(10);
        expect(["cooler", "warmer", "unsure"]).toContain(option.direction);
      }
    }
  });

  it("resolves a chosen option and ignores unknown or missing identifiers", () => {
    expect(recommendationOption(guided, "cool-sharp")?.direction).toBe("cooler");
    expect(recommendationOption(guided, "not-a-real-option")).toBeUndefined();
    expect(recommendationOption(guided, null)).toBeUndefined();
  });
});
