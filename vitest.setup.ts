import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  } catch {
    // localStorage might not be available in some test environments
  }
});
