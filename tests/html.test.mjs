import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("index.html uses query params for cache busting assets", async () => {
  const html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
  const cssMatch = html.match(/styles\.css\?v=(\d{4}-\d{2}-\d{2})/);
  const jsMatch = html.match(/app\.js\?v=(\d{4}-\d{2}-\d{2})/);

  assert.ok(cssMatch, "Expected styles.css with version query param");
  assert.ok(jsMatch, "Expected app.js with version query param");
  assert.equal(cssMatch[1], jsMatch[1], "Asset versions should match");
});
