import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * React Testing Library's automatic cleanup only registers when a global `afterEach` exists,
 * and this suite runs with `globals: false`. Without this, every render leaks into the next
 * test, so a query for a single element can match a previous test's DOM.
 */
afterEach(cleanup);
