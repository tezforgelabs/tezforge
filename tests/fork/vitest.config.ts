import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/fork/*.fork.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    maxWorkers: 1,
  },
});
