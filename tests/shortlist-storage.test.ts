import test from "node:test";
import assert from "node:assert/strict";
import { readShortlist, writeShortlist } from "../src/lib/shortlist-storage";

class MockStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

test("shortlist storage reads and writes unique slugs", () => {
  const storage = new MockStorage();
  writeShortlist(storage, ["mit", "mit", "harvard"]);

  const loaded = readShortlist(storage);
  assert.deepEqual(loaded.slugs, ["mit", "harvard"]);
  assert.ok(typeof loaded.updatedAt === "string");
});
