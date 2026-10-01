import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { canonicalFrontPassageScenarios } from "@/scenarios";
import { stateAtMinute } from "@/domain";
import { createSessionMachine } from "@/game";
import { WeatherMap } from "@/viz/WeatherMap";

const guided = canonicalFrontPassageScenarios[0]!;
const independent = canonicalFrontPassageScenarios[1]!;
const warm = canonicalFrontPassageScenarios[2]!;
const uncertain = canonicalFrontPassageScenarios[3]!;

/** getAttribute on an SVG-namespaced element is case sensitive, so use the real name. */
const dashOf = (node: Element): string | null => node.getAttribute("stroke-dasharray");

const renderMap = (
  scenario = guided,
  minute = 0,
  overrides: { motionAllowed?: boolean; selectedStationId?: string } = {}
) => {
  const machine = createSessionMachine(scenario);
  const state = stateAtMinute(machine.kernel, minute);
  return render(
    <WeatherMap
      scenario={scenario}
      kernel={machine.kernel}
      state={state}
      selectedStationId={overrides.selectedStationId ?? machine.targetStationId}
      motionAllowed={overrides.motionAllowed ?? true}
    />
  );
};

const mapSvg = (): SVGSVGElement => {
  const svg = screen.getByRole("img").closest("figure")?.querySelector("svg");
  if (!svg) throw new Error("no map svg");
  return svg;
};

describe("weather map semantics", () => {
  it("is a single accessible image whose label points at the text equivalent", () => {
    renderMap();
    const label = mapSvg().getAttribute("aria-label") ?? "";
    expect(label).toMatch(/repeated as text directly below the map/i);
    expect(label).toMatch(/stations are selected from the station list/i);
  });

  it("carries no interactive descendants, because role=img hides them from assistive tech", () => {
    const { container } = renderMap();
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.querySelectorAll("[onclick], [onpointerup], [tabindex], [role]")).toHaveLength(0);
  });

  it("gives every front kind a line pattern distinct from every other kind", () => {
    // Pattern per kind, read back off the rendered drawing rather than a lookup table.
    const patternFor = (scenario: typeof guided): string | null => {
      const { container, unmount } = renderMap(scenario, 0);
      const dash = container.querySelector("polyline") ? dashOf(container.querySelector("polyline")!) : null;
      unmount();
      return dash;
    };

    const cold = patternFor(guided);
    const warmPattern = patternFor(warm);
    expect(cold).toBe("4 2");
    expect(warmPattern).toBe("1.2 1.6");
    // The distinction survives the loss of colour entirely.
    expect(cold).not.toBe(warmPattern);
  });

  it("labels each front kind in writing on the map and in the legend", () => {
    const { unmount } = renderMap(guided, 0);
    expect(screen.getByText("Cold front")).toBeTruthy();
    expect(screen.getByText(/Cold front \(dashed line\)/)).toBeTruthy();
    unmount();
    const { unmount: unmountWarm } = renderMap(warm, 0);
    expect(screen.getByText("Warm front")).toBeTruthy();
    expect(screen.getByText(/Warm front \(dotted line\)/)).toBeTruthy();
    unmountWarm();
  });

  it("labels a warm front differently from a cold front in both the drawing and the legend", () => {
    const { container } = renderMap(warm, 0);
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    expect(screen.getByText("Warm front")).toBeTruthy();
    expect(screen.getByText(/Warm front \(dotted line\)/)).toBeTruthy();
  });

  it("draws precipitation as a hatch pattern and states the intensity in text", () => {
    const { container } = renderMap(guided, 120);
    const pattern = container.querySelector("pattern");
    expect(pattern).toBeTruthy();
    expect(pattern!.getAttribute("patternTransform")).toBeTruthy();

    const cells = Array.from(container.querySelectorAll("circle")).filter((node) =>
      (node.getAttribute("fill") ?? "").startsWith("url(#")
    );
    expect(cells.length).toBeGreaterThan(0);
    // The intensity label is the carrier of magnitude; the hatch carries no number.
    expect(screen.getAllByText(/mm\/h/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Precipitation band \(hatched circle, intensity labelled\)/)).toBeTruthy();
  });

  it("names every station and marks the selected one in words, not only with a ring", () => {
    renderMap(guided, 0, { selectedStationId: "east" });
    expect(screen.getByText(/^East Station \(selected\)$/)).toBeTruthy();
    // The unselected stations are labelled plainly, with no ring and no colour dependency.
    expect(screen.getByText(/^West Station$/)).toBeTruthy();
    expect(screen.getByText(/^Central Station$/)).toBeTruthy();
  });
});

describe("weather map across representative transitions", () => {
  it("moves the front as the clock advances", () => {
    const pathAt = (minute: number): string => {
      const { container, unmount } = renderMap(guided, minute);
      const points = container.querySelector("polyline")!.getAttribute("points") ?? "";
      unmount();
      return points;
    };

    expect(pathAt(0)).not.toBe(pathAt(120));
    expect(pathAt(120)).not.toBe(pathAt(240));
  });

  it("renders every checkpoint of the guided mission without throwing", () => {
    for (const minute of [0, 30, 60, 90, 120, 150, 180, 210, 240]) {
      const { unmount } = renderMap(guided, minute);
      expect(mapSvg().getAttribute("viewBox")).toBe("0 0 100 64");
      unmount();
    }
  });

  it("renders every canonical mission at its own verification minute", () => {
    for (const scenario of [guided, independent, warm, uncertain]) {
      const machine = createSessionMachine(scenario);
      const { unmount } = renderMap(scenario, machine.verificationMinute);
      expect(within(screen.getByRole("img").closest("figure")!).getByText(/Regional map ·/)).toBeTruthy();
      unmount();
    }
  });

  it("keeps the same legend contract whatever the mission", () => {
    for (const scenario of [guided, independent, warm, uncertain]) {
      const { unmount } = renderMap(scenario, 0);
      expect(screen.getByText(/Station \(crossed dot, always labelled/)).toBeTruthy();
      expect(screen.getByText(/Grey arrow: modelled direction of travel/)).toBeTruthy();
      unmount();
    }
  });
});

describe("weather map motion preference", () => {
  it("states the reduced-motion behaviour instead of implying it", () => {
    renderMap(guided, 0, { motionAllowed: false });
    expect(screen.getByText(/Motion is reduced: the map shows each state directly/)).toBeTruthy();
    expect(screen.getByText(/Nothing is hidden/)).toBeTruthy();
  });

  it("presents the same information either way", () => {
    const { unmount } = renderMap(guided, 120, { motionAllowed: true });
    const withMotion = screen.getByRole("img").closest("figure")!.textContent ?? "";
    unmount();
    renderMap(guided, 120, { motionAllowed: false });
    const withoutMotion = screen.getByRole("img").closest("figure")!.textContent ?? "";

    for (const marker of ["Cold front", "Regional map", "mm/h"]) {
      expect(withMotion).toContain(marker);
      expect(withoutMotion).toContain(marker);
    }
  });
});
