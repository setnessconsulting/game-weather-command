import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "@/app/App";
import { canonicalFrontPassageScenarios } from "@/scenarios";

/**
 * WC-04 finding F7, forwarded to WC-06 as a verification obligation:
 *
 *   "acceptedRanges are part of the scenario payload and therefore reach the browser. They
 *    are envelopes, not a hidden scalar answer key ... They must, however, never be surfaced
 *    in the UI before forecast commitment."
 *
 * Nothing structural enforced that, so it is asserted here against the rendered DOM, both
 * before and after commitment. The second half matters as much as the first: a panel that
 * never showed the reference would satisfy the rule while breaking the debrief.
 */
const guided = canonicalFrontPassageScenarios[0]!;
const accepted = guided.acceptedRanges[0]!;

const REFERENCE_SUMMARY = "Scenario reference ranges used for this comparison";

/** Every literal the interface would print if it leaked the authored envelope. */
const authoredLeakStrings = (): string[] => {
  const arrival = accepted.transitionArrivalMinute;
  const temperature = accepted.temperatureChangeC;
  const precipitation = accepted.precipitationProbabilityPct;
  const confidence = accepted.defensibleConfidence.join(" or ");
  return [
    REFERENCE_SUMMARY,
    // The distinctive pairings the panel prints, e.g. "90 to 120 min".
    `Arrival window: ${arrival.min} to ${arrival.max} min`,
    `Temperature change: ${temperature.min} to ${temperature.max}`,
    `Precipitation probability: ${precipitation.min} to ${precipitation.max}`,
    `Defensible confidence: ${confidence}`,
    accepted.windDirectionSectorsDeg.map((sector) => `${sector.min}°–${sector.max}°`).join(", ")
  ];
};

const openGuidedMissionAndStart = (): void => {
  render(<App />);
  fireEvent.click(screen.getAllByRole("button", { name: /Open briefing for Cold Front Shift/i })[0]!);
  fireEvent.click(screen.getByRole("button", { name: /Start observing Central Station/i }));
};

const fillForecast = (): void => {
  const type = (id: string, value: string): void => {
    const input = document.getElementById(id) as HTMLInputElement;
    fireEvent.change(input, { target: { value } });
  };
  type("forecast-temperature-low", "-6");
  type("forecast-temperature-high", "-6");
  type("forecast-precipitation-low", "70");
  type("forecast-precipitation-high", "70");
  type("forecast-wind-low", "265");
  type("forecast-wind-high", "265");
  type("forecast-timing-low", "105");
  type("forecast-timing-high", "105");

  fireEvent.click(screen.getByRole("radio", { name: "Medium confidence" }));
  fireEvent.click(screen.getByRole("radio", { name: /sudden cooler, windier, wetter change/i }));
};

const domText = (): string => document.body.textContent ?? "";

describe("authored accepted ranges are never surfaced before commitment", () => {
  it("shows no part of the authored envelope during the observation phase", () => {
    openGuidedMissionAndStart();
    // Look at every layer the player can reach before committing: the station record, the
    // trends, the front position, and the precipitation band.
    fireEvent.click(screen.getByRole("button", { name: /Advance 30 min/i }));
    fireEvent.click(screen.getByRole("button", { name: /Advance 30 min/i }));
    expect(screen.getByRole("heading", { name: "Precipitation band" })).toBeTruthy();
    for (const station of [/^West Station$/, /^East Station$/]) {
      fireEvent.click(screen.getByRole("button", { name: station }));
    }
    expect(screen.getByRole("table", { name: /All stations at/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Trends" })).toBeTruthy();

    const text = domText();
    for (const leak of authoredLeakStrings()) {
      expect(text, leak).not.toContain(leak);
    }
    expect(screen.queryByText(REFERENCE_SUMMARY)).toBeNull();
  });

  it("shows no part of the authored envelope with a complete draft ready to commit", () => {
    openGuidedMissionAndStart();
    fillForecast();
    // The commit button is now available, which is the last moment before the answer.
    expect(screen.getByRole("button", { name: "Commit forecast" })).toBeTruthy();

    const text = domText();
    for (const leak of authoredLeakStrings()) {
      expect(text, leak).not.toContain(leak);
    }
  });

  it("shows no part of the authored envelope after committing but before the window closes", () => {
    openGuidedMissionAndStart();
    fillForecast();
    fireEvent.click(screen.getByRole("button", { name: "Commit forecast" }));

    expect(screen.getAllByText(/Committed, waiting for the comparison/).length).toBeGreaterThan(0);
    const text = domText();
    for (const leak of authoredLeakStrings()) {
      expect(text, leak).not.toContain(leak);
    }
  });

  it("shows the authored envelope once the forecast has been compared with the record", () => {
    openGuidedMissionAndStart();
    fillForecast();
    fireEvent.click(screen.getByRole("button", { name: "Commit forecast" }));

    fireEvent.click(screen.getByRole("button", { name: /Advance to window close/i }));
    fireEvent.click(screen.getByRole("button", { name: "Compare forecast with the record" }));

    const summary = screen.getByText(REFERENCE_SUMMARY);
    expect(summary).toBeTruthy();
    const text = domText();
    for (const leak of authoredLeakStrings()) {
      expect(text, leak).toContain(leak);
    }
    // And the debrief carries it forward, still after the comparison.
    fireEvent.click(screen.getByRole("button", { name: "Open the debrief" }));
    expect(screen.getByRole("heading", { name: /Debrief/i })).toBeTruthy();
  });
});

describe("the learner is never graded against a single canonical number", () => {
  it("accepts a forecast well outside the authored envelope and grades it dimension by dimension", () => {
    openGuidedMissionAndStart();

    const type = (id: string, value: string): void => {
      fireEvent.change(document.getElementById(id) as HTMLInputElement, { target: { value } });
    };
    // Deliberately the opposite direction from the truth.
    type("forecast-temperature-low", "4");
    type("forecast-temperature-high", "5");
    type("forecast-precipitation-low", "5");
    type("forecast-precipitation-high", "10");
    type("forecast-wind-low", "10");
    type("forecast-wind-high", "20");
    type("forecast-timing-low", "0");
    type("forecast-timing-high", "30");
    fireEvent.click(screen.getByRole("radio", { name: "Low confidence" }));
    fireEvent.click(screen.getByRole("radio", { name: /no meaningful change during the window/i }));
    fireEvent.click(screen.getByRole("button", { name: "Commit forecast" }));

    fireEvent.click(screen.getByRole("button", { name: /Advance to window close/i }));
    fireEvent.click(screen.getByRole("button", { name: "Compare forecast with the record" }));

    // Separate verdicts, and an explicit invitation to revise, rather than one score.
    expect(screen.getByRole("heading", { name: "Timing" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Forecast values" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Evidence quality" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Causal reasoning consistency" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Confidence calibration" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Revise forecast and compare again" })).toBeTruthy();
  });
});
