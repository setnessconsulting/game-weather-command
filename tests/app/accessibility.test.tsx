import { act } from "react";
import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "@/app/App";
import { useMotionPreference } from "@/app/useMissionSession";

const startGuided = (): void => {
  fireEvent.click(screen.getAllByRole("button", { name: /Open briefing for Cold Front Shift/i })[0]!);
  fireEvent.click(screen.getByRole("button", { name: /Start observing Central Station/i }));
};

const renderMission = (): void => {
  render(<App />);
  startGuided();
};

const ariaChecked = (name: string): string | null =>
  screen.getByRole("radio", { name }).getAttribute("aria-checked");

describe("assistance levels do what their labels say", () => {
  it("'Step by step' shows the step and its first hint immediately", () => {
    renderMission();
    expect(screen.getByRole("heading", { name: "Read a station report" })).toBeTruthy();
    // Guided reveals the first hint without being asked.
    expect(screen.getByText(/Anything you can open there is safe to use/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show another hint" })).toBeTruthy();
  });

  it("'Hints on request' shows the step but reveals nothing until asked", () => {
    renderMission();
    fireEvent.click(screen.getByRole("radio", { name: "Hints on request" }));

    expect(screen.getByRole("heading", { name: "Read a station report" })).toBeTruthy();
    expect(screen.queryByText(/Anything you can open there is safe to use/)).toBeNull();
    expect(screen.getByRole("button", { name: "Show a hint" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Show a hint" }));
    expect(screen.getByText(/Anything you can open there is safe to use/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show another hint" })).toBeTruthy();
  });

  it("'No coaching' is silent: no step, no hint, no nudge, and it can be turned back on", () => {
    renderMission();
    fireEvent.click(screen.getByRole("radio", { name: "No coaching" }));

    expect(screen.queryByRole("heading", { name: "Read a station report" })).toBeNull();
    expect(screen.queryByRole("button", { name: /hint/i })).toBeNull();
    // The contextual nudge is a coaching surface too, so it goes as well.
    expect(screen.queryByText(/You have not opened the/)).toBeNull();
    expect(screen.queryByText(/guided steps complete/)).toBeNull();
    // The evidence and the forecast editor are untouched.
    expect(screen.getByRole("table", { name: /All stations at/i })).toBeTruthy();
    expect(screen.getByText("Your forecast")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "Step by step" }));
    expect(screen.getByRole("heading", { name: "Read a station report" })).toBeTruthy();
  });

  it("moves between assistance levels with the arrow keys, as a radio group must", () => {
    renderMission();
    const group = screen.getByRole("radiogroup", { name: "Assistance" });

    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(ariaChecked("Hints on request")).toBe("true");
    expect(ariaChecked("Step by step")).toBe("false");

    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(ariaChecked("No coaching")).toBe("true");

    // Wraps rather than dead-ending at the end of the list.
    fireEvent.keyDown(group, { key: "ArrowRight" });
    expect(ariaChecked("Step by step")).toBe("true");

    fireEvent.keyDown(group, { key: "ArrowLeft" });
    expect(ariaChecked("No coaching")).toBe("true");
  });
});

describe("coaching progress", () => {
  it("reports how many guided steps are done and stops when the list is finished", () => {
    renderMission();
    expect(screen.getByText("0 of 10 guided steps complete.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Advance 30 min/i }));
    fireEvent.click(screen.getByRole("button", { name: /^West Station$/ }));
    expect(screen.getByText(/of 10 guided steps complete\./)).toBeTruthy();
  });
});

describe("motion preference", () => {
  const originalMatchMedia = window.matchMedia;

  const stubMatchMedia = (matches: boolean, listeners?: Set<(event: MediaQueryListEvent) => void>): void => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query.includes("prefers-reduced-motion") ? matches : false,
        media: query,
        onchange: null,
        addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners?.add(listener),
        removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners?.delete(listener),
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false
      })
    });
  };

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: originalMatchMedia
    });
  });

  it("starts from the operating-system preference rather than a hard-coded false", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useMotionPreference());
    expect(result.current.reducedMotion).toBe(true);
  });

  it("follows a change of the operating-system preference while mounted", () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    stubMatchMedia(false, listeners);

    const { result } = renderHook(() => useMotionPreference());
    expect(result.current.reducedMotion).toBe(false);

    act(() => {
      for (const listener of listeners) listener({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current.reducedMotion).toBe(true);
    // Asking the system to reduce motion must also stop automatic time advance.
    expect(result.current.playing).toBe(false);
  });

  it("is still changeable in-session for a player whose system does not request it", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useMotionPreference());
    expect(result.current.reducedMotion).toBe(false);
    act(() => result.current.toggleReducedMotion());
    expect(result.current.reducedMotion).toBe(true);
  });

  it("wires the preference into the rendered controls", () => {
    stubMatchMedia(true);
    render(<App />);
    startGuided();
    // Automatic time advance is unavailable without an explicit opt-in, and the reason is
    // stated in text rather than shown only by a disabled control.
    expect(screen.getByRole("button", { name: /Play automatic time advance/i }).hasAttribute("disabled")).toBe(true);
    expect(
      screen.getByText(/Motion is reduced: automatic time advance is unavailable and the map holds still/)
    ).toBeTruthy();
    expect(screen.getByText(/Motion is reduced: the map shows each state directly/)).toBeTruthy();
  });
});

describe("no timers survive the mission", () => {
  it("clears the autoplay interval when the mission is abandoned", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    render(<App />);
    startGuided();

    fireEvent.click(screen.getByRole("button", { name: /Play automatic time advance/i }));
    expect(screen.getByRole("button", { name: /Pause automatic time advance/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Mission list" }));
    expect(screen.getByRole("heading", { level: 1, name: "Weather Command" })).toBeTruthy();
    // React unmounts the screen; the interval teardown must have run.
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
