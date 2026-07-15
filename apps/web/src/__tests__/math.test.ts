import { test, expect } from 'vitest';
import { add } from "../lib/math";

test("add function adds two numbers", () => {
  expect(add(2, 3)).toBe(5);
});

