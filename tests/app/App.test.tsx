import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "@/app/App";

describe("mission collection", () => {
  it("lists every canonical mission and states the privacy and review position honestly", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Weather Command" })).toBeTruthy();
    expect(screen.getByText(/Simulation, not live weather\./)).toBeTruthy();
    expect(screen.getByText(/this build does not claim that review has happened/i)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Open briefing for/i }).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole("button", { name: /Open briefing for Gradual Change/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open briefing for Front Timing Challenge/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Open briefing for Uncertain Timing/i })).toBeTruthy();
  });
});

describe("guided mission loop", () => {
  it("moves from briefing into observation with text equivalents and time-gated evidence", () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole("button", { name: /Open briefing for Cold Front Shift/i })[0]!);
    expect(screen.getByRole("heading", { level: 2, name: "Cold Front Shift" })).toBeTruthy();
    expect(screen.getByText(/Commit before the change reaches Central Station/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Start observing Central Station/i }));
    expect(screen.getByRole("heading", { level: 3, name: "Simulated clock" })).toBeTruthy();

    const stationTable = screen.getByRole("table", { name: /All stations at/i });
    const westRow = within(stationTable).getByRole("rowheader", { name: /West Station/ });
    expect(westRow).toBeTruthy();

    expect(screen.getByRole("heading", { level: 3, name: /Station readings/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 3, name: "Precipitation band" })).toBeNull();
    expect(screen.getByText(/Not yet available/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Advance 30 min/i }));
    fireEvent.click(screen.getByRole("button", { name: /Advance 30 min/i }));
    expect(screen.getByRole("heading", { level: 3, name: "Precipitation band" })).toBeTruthy();

    const trendPanel = screen.getByRole("heading", { level: 2, name: "Trends" });
    expect(trendPanel).toBeTruthy();
  });
});
