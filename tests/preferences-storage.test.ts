import test from "node:test";
import assert from "node:assert/strict";
import { readPreferences, writePreferences, defaultPreferences, PREFERENCES_STORAGE_KEY } from "../src/lib/preferences-storage";

class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

test("readPreferences returns defaults when storage is empty", () => {
  const storage = new MockStorage();
  const prefs = readPreferences(storage);
  const defaults = defaultPreferences();

  assert.deepEqual(prefs.weights, defaults.weights);
  assert.deepEqual(prefs.interests, []);
  assert.equal(prefs.homeLatitude, null);
  assert.equal(prefs.homeLongitude, null);
  assert.equal(prefs.homeLabel, "");
});

test("writePreferences and readPreferences round-trip", () => {
  const storage = new MockStorage();
  const prefs = defaultPreferences();
  prefs.weights.academicRigor = 80;
  prefs.weights.financialValue = 90;
  prefs.interests = ["engineering", "computer"];
  prefs.homeLatitude = 32.78;
  prefs.homeLongitude = -96.8;
  prefs.homeLabel = "Dallas, TX";

  writePreferences(storage, prefs);
  const loaded = readPreferences(storage);

  assert.equal(loaded.weights.academicRigor, 80);
  assert.equal(loaded.weights.financialValue, 90);
  assert.deepEqual(loaded.interests, ["engineering", "computer"]);
  assert.equal(loaded.homeLatitude, 32.78);
  assert.equal(loaded.homeLongitude, -96.8);
  assert.equal(loaded.homeLabel, "Dallas, TX");
});

test("readPreferences handles corrupt data gracefully", () => {
  const storage = new MockStorage();
  storage.setItem(PREFERENCES_STORAGE_KEY, "not valid json{{{");
  const prefs = readPreferences(storage);
  // Should return defaults, not throw
  assert.deepEqual(prefs.weights, defaultPreferences().weights);
});

test("readPreferences clamps weights to valid range", () => {
  const storage = new MockStorage();
  storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({
    weights: { academicRigor: 150, careerOutcomes: -10 }
  }));
  const prefs = readPreferences(storage);
  // Out-of-range values should fall back to defaults
  assert.equal(prefs.weights.academicRigor, 50); // 150 > 100, revert to default
  assert.equal(prefs.weights.careerOutcomes, 50); // -10 < 0, revert to default
});
