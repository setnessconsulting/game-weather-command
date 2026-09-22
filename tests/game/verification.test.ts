import { describe, expect, it } from "vitest";

import { canonicalFrontPassageScenarios, type WeatherScenarioV1 } from "@/scenarios";
import {
  createSessionMachine,
  observedTransition,
  verifyForecast,
  type ForecastDraft,
  type VerificationInput,
  type VerificationReport
} from "@/game";

const guided = canonicalFrontPassageScenarios[0]!;
const machine = createSessionMachine(guided);

function acceptedFor(scenario: WeatherScenarioV1, stationId: string) {
  return scenario.acceptedRanges.find(
    (range) => range.forecastWindowId === scenario.forecastWindows[0]!.id && range.targetStationId === stationId
  )!;
}

const reasonableDraft: ForecastDraft = {
  temperatureChangeC: acceptedFor(guided, "central").temperatureChangeC,
  precipitationProbabilityPct: acceptedFor(guided, "central").precipitationProbabilityPct,
  windDirectionDeg: acceptedFor(guided, "central").windDirectionSectorsDeg[0]!,
  transitionWindow: acceptedFor(guided, "central").transitionArrivalMinute,
  confidence: "medium",
  recommendationId: "cool-sharp"
};

function input(overrides: Partial<VerificationInput> = {}): VerificationInput {
  return {
    scenario: guided,
    kernel: machine.kernel,
    window: machine.window,
    stationId: "central",
    forecast: reasonableDraft,
    selectedEvidenceIds: guided.debrief.flatMap((relationship) => relationship.evidenceIds),
    committedAtMinute: 60,
    verificationMinute: machine.verificationMinute,
    ...overrides
  };
}

const allLevels = (report: VerificationReport) =>
  report.ranges.map((range) => range.level).concat(report.timing.level, report.evidenceQuality.level, report.causalReasoning.level);

describe("verification of a supported forecast", () => {
  it("supports timing, temperature, wind, precipitation, evidence and reasoning", () => {
    const report = verifyForecast(input());
    expect(report.mode).toBe("forecast");
    expect(report.timing.level).toBe("supported");
    expect(report.ranges.map((range) => `${range.dimension}:${range.level}`)).toEqual([
      "temperature:supported",
      "wind:supported",
      "precipitation:supported"
    ]);
    expect(report.evidenceQuality.level).toBe("supported");
    expect(report.causalReasoning.level).toBe("supported");
    expect(report.calibration.level).toBe("well-calibrated");
    expect(report.headline).toContain("Every assessed dimension was supported");
  });

  it("keeps the four feedback dimensions separate with no opaque correctness flag", () => {
    const report = verifyForecast(input()) as VerificationReport & Record<string, unknown>;
    expect(typeof report.timing).toBe("object");
    expect(typeof report.evidenceQuality).toBe("object");
    expect(typeof report.causalReasoning).toBe("object");
    expect(typeof report.calibration).toBe("object");
    expect(report.correct).toBeUndefined();
    expect(report.passed).toBeUndefined();
    expect(report.score).toBeUndefined();
  });

  it("states the precipitation basis honestly instead of claiming confirmation", () => {
    const report = verifyForecast(input());
    expect(report.ranges.find((range) => range.dimension === "precipitation")!.detail).toContain(
      "cannot be confirmed or refuted by a single simulated day"
    );
    expect(report.precipitationOutcome.verificationBasis).toContain("cannot confirm a probability");
  });
});

describe("verification of an unsupported forecast", () => {
  it("marks every dimension unsupported without a single pass/fail verdict", () => {
    const report = verifyForecast(
      input({
        forecast: {
          temperatureChangeC: { min: 2, max: 4 },
          precipitationProbabilityPct: { min: 0, max: 10 },
          windDirectionDeg: { min: 30, max: 80 },
          transitionWindow: { min: 0, max: 30 },
          confidence: "high",
          recommendationId: "warm-slow"
        },
        selectedEvidenceIds: []
      })
    );
    expect(allLevels(report).every((level) => level !== "supported")).toBe(true);
    expect(report.timing.level).toBe("unsupported");
    expect(report.ranges.every((range) => range.level === "unsupported")).toBe(true);
    expect(report.causalReasoning.directionMatches).toBe(false);
    expect(report.causalReasoning.notes.length).toBeGreaterThan(0);
    expect(report.headline).toContain("Nothing here is final");
  });
});

describe("borderline assessments", () => {
  it("treats a temperature range just outside the measured change as partially supported", () => {
    const observed = observedTransition(machine.kernel, "central")!;
    const report = verifyForecast(
      input({
        forecast: {
          ...reasonableDraft,
          temperatureChangeC: { min: observed.temperatureChangeC + 0.5, max: observed.temperatureChangeC + 2 }
        }
      })
    );
    expect(report.ranges.find((range) => range.dimension === "temperature")!.level).toBe("partially-supported");
  });

  it("treats a near-miss wind sector as partially supported and a distant one as unsupported", () => {
    const observed = observedTransition(machine.kernel, "central")!;
    const near = verifyForecast(
      input({
        forecast: {
          ...reasonableDraft,
          windDirectionDeg: { min: Math.round(observed.finalWindDirectionDeg) + 5, max: Math.round(observed.finalWindDirectionDeg) + 10 }
        }
      })
    );
    const far = verifyForecast(
      input({ forecast: { ...reasonableDraft, windDirectionDeg: { min: 10, max: 40 } } })
    );
    expect(near.ranges.find((range) => range.dimension === "wind")!.level).toBe("partially-supported");
    expect(far.ranges.find((range) => range.dimension === "wind")!.level).toBe("unsupported");
  });

  it("scores evidence coverage against the evidence the debrief relies on", () => {
    const relevant = guided.debrief.flatMap((relationship) => relationship.evidenceIds);
    const none = verifyForecast(input({ selectedEvidenceIds: [] }));
    const some = verifyForecast(input({ selectedEvidenceIds: [relevant[0]!] }));
    const all = verifyForecast(input({ selectedEvidenceIds: relevant }));

    expect(none.evidenceQuality.level).toBe("unsupported");
    expect(some.evidenceQuality.level).toBe("partially-supported");
    expect(all.evidenceQuality.level).toBe("supported");
    expect(all.evidenceQuality.coverageRatio).toBe(1);
    expect(none.evidenceQuality.detail).toContain("None of the evidence");
  });
});

describe("commit mode", () => {
  it("labels a commit inside the observed change a nowcast", () => {
    const observed = observedTransition(machine.kernel, "central")!;
    const report = verifyForecast(
      input({ committedAtMinute: observed.startMinute, verificationMinute: observed.endMinute })
    );
    expect(report.mode).toBe("nowcast");
    expect(report.modeDetail).toContain("nowcast");
    expect(report.headline.startsWith("You committed")).toBe(true);
  });

  it("labels a commit after the published window a hindcast", () => {
    const report = verifyForecast(
      input({ committedAtMinute: machine.window.endMinute, verificationMinute: machine.window.endMinute })
    );
    expect(report.mode).toBe("hindcast");
    expect(report.modeDetail).toContain("hindcast");
  });

  it("labels a commit before the change began a genuine prediction", () => {
    const report = verifyForecast(input({ committedAtMinute: 0 }));
    expect(report.mode).toBe("forecast");
    expect(report.modeDetail).toContain("genuine prediction");
  });
});

describe("confidence calibration", () => {
  it("calls out overconfidence when the scenario supports less certainty", () => {
    const uncertain = canonicalFrontPassageScenarios[3]!;
    const uncertainMachine = createSessionMachine(uncertain);
    const accepted = acceptedFor(uncertain, "central");
    const report = verifyForecast({
      scenario: uncertain,
      kernel: uncertainMachine.kernel,
      window: uncertainMachine.window,
      stationId: "central",
      forecast: {
        temperatureChangeC: accepted.temperatureChangeC,
        precipitationProbabilityPct: accepted.precipitationProbabilityPct,
        windDirectionDeg: accepted.windDirectionSectorsDeg[0]!,
        transitionWindow: accepted.transitionArrivalMinute,
        confidence: "high",
        recommendationId: "hedged"
      },
      selectedEvidenceIds: uncertain.debrief.flatMap((relationship) => relationship.evidenceIds),
      committedAtMinute: 60,
      verificationMinute: uncertainMachine.verificationMinute
    });
    expect(report.calibration.level).toBe("overconfident");
    expect(report.calibration.detail).toContain("most common calibration error");
  });

  it("calls out underconfidence without penalising it", () => {
    const report = verifyForecast(input({ forecast: { ...reasonableDraft, confidence: "low" } }));
    expect(report.calibration.level).toBe("underconfident");
    expect(report.calibration.detail).toContain("never penalised");
  });
});

describe("verification inputs", () => {
  it("refuses to verify when the target station never changes", () => {
    const kernel = {
      ...machine.kernel,
      stationEffects: machine.kernel.stationEffects.map((effect) =>
        effect.stationId === "central" && effect.delta.temperatureC !== undefined
          ? { ...effect, delta: { ...effect.delta, temperatureC: 0 } }
          : effect
      )
    };
    expect(() => verifyForecast(input({ kernel }))).toThrow(/no detectable transition/);
  });

  it("refuses to verify when the scenario has no authored range for the window", () => {
    const scenario = { ...guided, acceptedRanges: [] } as WeatherScenarioV1;
    expect(() => verifyForecast(input({ scenario }))).toThrow(/No authored accepted range/);
  });

  it("exposes the canonical reading used for verification", () => {
    const report = verifyForecast(input({ verificationMinute: 150 }));
    expect(report.observedFacts.some((fact) => fact.label === "Reading used for verification")).toBe(true);
    expect(report.observedFacts.some((fact) => fact.value.includes("T+2 h 30 min"))).toBe(true);
  });

  it("lists only learner-facing model boundaries and cited sources", () => {
    const report = verifyForecast(input());
    expect(report.modelBoundaries.length).toBeGreaterThan(0);
    expect(report.modelBoundaries.every((boundary) => boundary.description.length > 0)).toBe(true);
    expect(report.sourceRefs.length).toBeGreaterThan(0);
    expect(report.sourceRefs.every((source) => source.url.startsWith("http"))).toBe(true);
  });

  it("is deterministic for identical inputs", () => {
    expect(verifyForecast(input())).toEqual(verifyForecast(input()));
  });

  it("does not mutate the scenario it is given", () => {
    const before = JSON.stringify(guided);
    verifyForecast(input());
    expect(JSON.stringify(guided)).toBe(before);
  });
});
