import test from "node:test";
import assert from "node:assert/strict";
import { readWorkspace, writeWorkspace, addToWorkspace, removeFromWorkspace, updateWorkspaceEntry } from "../src/lib/workspace-storage";

class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

test("readWorkspace returns empty state when storage is empty", () => {
  const storage = new MockStorage();
  const ws = readWorkspace(storage);
  assert.equal(ws.entries.length, 0);
});

test("addToWorkspace adds an entry", () => {
  const storage = new MockStorage();
  const ws = addToWorkspace(storage, "mit");
  assert.equal(ws.entries.length, 1);
  assert.equal(ws.entries[0].slug, "mit");
  assert.equal(ws.entries[0].status, "researching");
  assert.equal(ws.entries[0].notes, "");
});

test("addToWorkspace is idempotent", () => {
  const storage = new MockStorage();
  addToWorkspace(storage, "mit");
  const ws = addToWorkspace(storage, "mit");
  assert.equal(ws.entries.length, 1);
});

test("removeFromWorkspace removes an entry", () => {
  const storage = new MockStorage();
  addToWorkspace(storage, "mit");
  addToWorkspace(storage, "stanford");
  const ws = removeFromWorkspace(storage, "mit");
  assert.equal(ws.entries.length, 1);
  assert.equal(ws.entries[0].slug, "stanford");
});

test("updateWorkspaceEntry updates status and notes", () => {
  const storage = new MockStorage();
  addToWorkspace(storage, "mit");

  let ws = updateWorkspaceEntry(storage, "mit", { status: "applying" });
  assert.equal(ws.entries[0].status, "applying");

  ws = updateWorkspaceEntry(storage, "mit", { notes: "Great campus tour" });
  assert.equal(ws.entries[0].notes, "Great campus tour");
  assert.equal(ws.entries[0].status, "applying"); // status preserved
});

test("workspace migrates from old shortlist format", () => {
  const storage = new MockStorage();
  // Simulate old shortlist data
  storage.setItem("college-compass:shortlist:v1", JSON.stringify({
    slugs: ["mit", "stanford"],
    updatedAt: "2026-06-01T00:00:00.000Z"
  }));

  const ws = readWorkspace(storage);
  assert.equal(ws.entries.length, 2);
  assert.equal(ws.entries[0].slug, "mit");
  assert.equal(ws.entries[0].status, "researching");
  assert.equal(ws.entries[1].slug, "stanford");
});
