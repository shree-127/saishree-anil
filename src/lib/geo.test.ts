import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDistanceMeters,
  formatCoordinates,
  generateIncidentId,
  isWithinBengaluruBounds,
} from "./geo";

test("calculateDistanceMeters calculates accurate distance between two Bengaluru landmarks", () => {
  // Majestic (12.9772, 77.5713) to Indiranagar (12.9719, 77.6412) is ~7.6 km (7600 meters)
  const dist = calculateDistanceMeters(12.9772, 77.5713, 12.9719, 77.6412);
  assert.ok(dist > 7000 && dist < 8200, `Expected ~7.6km, got ${dist}m`);
});

test("calculateDistanceMeters returns 0 for same point", () => {
  const dist = calculateDistanceMeters(12.9772, 77.5713, 12.9772, 77.5713);
  assert.equal(dist, 0);
});

test("isWithinBengaluruBounds detects valid and invalid Bengaluru points", () => {
  // Silk Board
  assert.equal(isWithinBengaluruBounds(12.9176, 77.6238), true);
  // Delhi
  assert.equal(isWithinBengaluruBounds(28.6139, 77.2090), false);
});

test("formatCoordinates produces clean formatted string", () => {
  const formatted = formatCoordinates(12.9716, 77.5946);
  assert.equal(formatted, "12.97160° N, 77.59460° E");
});

test("generateIncidentId matches NR-2026-XXXX pattern", () => {
  const id = generateIncidentId();
  assert.match(id, /^NR-2026-\d{4}$/);
});
