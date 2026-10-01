import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TrendChart, type TrendLine } from "@/viz/TrendChart";

const lines: readonly TrendLine[] = [
  {
    id: "west",
    label: "West Station",
    marker: { shape: "circle", dash: "0" },
    points: [
      { minute: 0, value: 1000 },
      { minute: 60, value: 1002.4 },
      { minute: 120, value: 1006.1 }
    ]
  },
  {
    id: "central",
    label: "Central Station",
    marker: { shape: "square", dash: "4 2" },
    points: [
      { minute: 0, value: 1004 },
      { minute: 60, value: 1003.2 },
      { minute: 120, value: 1005 }
    ]
  },
  {
    id: "east",
    label: "East Station",
    marker: { shape: "triangle", dash: "1.2 1.6" },
    // Deliberately incomplete, so the table has to render a gap rather than a value.
    points: [
      { minute: 0, value: 1006 },
      { minute: 120, value: 1004.5 }
    ]
  }
];

const renderChart = (chartLines = lines) =>
  render(
    <TrendChart
      title="Pressure"
      unit="hPa"
      lines={chartLines}
      formatValue={(value) => value.toFixed(1)}
      caption="Modelled pressure at each station by simulated minute"
    />
  );

describe("trend chart semantics", () => {
  it("hides the drawing from assistive technology because the table beside it is the truth", () => {
    const { container } = renderChart();
    const svg = container.querySelector("svg");
    expect(svg!.getAttribute("aria-hidden")).toBe("true");
    expect(svg!.getAttribute("focusable")).toBe("false");
  });

  it("gives every series a distinct marker shape and dash, not only a colour", () => {
    const { container } = renderChart();
    const shapes = new Set(
      Array.from(container.querySelectorAll("[data-marker]")).map((node) => node.getAttribute("data-marker"))
    );
    expect(shapes).toEqual(new Set(["circle", "square", "triangle"]));

    // getAttribute on an SVG-namespaced element is case sensitive.
    const dashes = new Set(
      Array.from(container.querySelectorAll("polyline")).map((node) => node.getAttribute("stroke-dasharray"))
    );
    expect(dashes).toEqual(new Set(["0", "4 2", "1.2 1.6"]));
  });

  it("names the shape and the line style in the legend in words", () => {
    renderChart();
    expect(screen.getByText(/West Station — circle marker, solid line/)).toBeTruthy();
    expect(screen.getByText(/Central Station — square marker, dashed line/)).toBeTruthy();
    expect(screen.getByText(/East Station — triangle marker, dashed line/)).toBeTruthy();
  });
});

describe("trend chart table equivalent", () => {
  it("carries every plotted value in a real table with headers", () => {
    renderChart();
    const table = screen.getByRole("table", { name: /Modelled pressure at each station/ });
    const rows = within(table).getAllByRole("row");
    // Header plus one row per series.
    expect(rows).toHaveLength(4);

    const west = within(table).getByRole("rowheader", { name: "West Station" }).closest("tr")!;
    const cells = within(west).getAllByRole("cell").map((cell) => cell.textContent);
    expect(cells).toEqual(["1000.0", "1002.4", "1006.1"]);
  });

  it("marks a missing observation as a gap rather than inventing a value", () => {
    renderChart();
    const table = screen.getByRole("table", { name: /Modelled pressure at each station/ });
    const east = within(table).getByRole("rowheader", { name: "East Station" }).closest("tr")!;
    expect(within(east).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "1006.0",
      "–",
      "1004.5"
    ]);
  });

  it("labels the time axis in words as well as in numbers", () => {
    const { container } = renderChart();
    expect(container.textContent).toContain("simulated minutes");
    // One labelled column per modelled minute, in the table header.
    expect(screen.getAllByText(/^T\+0$/)).toHaveLength(1);
  });
});

describe("trend chart scale guards", () => {
  it("renders a single series without collapsing the axis", () => {
    const flat: readonly TrendLine[] = [
      {
        id: "only",
        label: "Only Station",
        marker: { shape: "cross", dash: "0" },
        points: [
          { minute: 0, value: 5 },
          { minute: 60, value: 5 }
        ]
      }
    ];
    const { container } = renderChart(flat);
    // A zero-span series must not produce NaN geometry.
    expect(container.innerHTML).not.toMatch(/NaN/);
    expect(screen.getByRole("table", { name: /Modelled pressure/ })).toBeTruthy();
  });

  it("renders an empty series list without throwing", () => {
    expect(() => renderChart([])).not.toThrow();
  });
});
