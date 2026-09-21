import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "@/app/App";

describe("App foundation shell", () => {
  it("renders the product role and simulation disclosure", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Weather Command" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Simulation, not live weather" })).toBeTruthy();
    expect(screen.getByRole("img", { name: /three forecast stations/i })).toBeTruthy();
  });
});
