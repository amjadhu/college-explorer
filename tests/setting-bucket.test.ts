import test from "node:test";
import assert from "node:assert/strict";
import { localeBucket } from "../src/lib/format";

test("localeBucket maps locale codes and strings", () => {
  assert.equal(localeBucket(11), "city");
  assert.equal(localeBucket(22), "suburb");
  assert.equal(localeBucket(33), "town");
  assert.equal(localeBucket(42), "rural");
  assert.equal(localeBucket("City: Large"), "city");
  assert.equal(localeBucket("Suburb: Mid-size"), "suburb");
  assert.equal(localeBucket(null), "unknown");
});
