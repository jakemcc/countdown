import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("mobile stats stack labels above values", async () => {
  const css = await fs.readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.ok(
    /@media\s*\(max-width:\s*700px\)[\s\S]*?\.stat\s*{[^}]*flex-direction:\s*column;/.test(
      css
    )
  );
  assert.ok(
    /@media\s*\(max-width:\s*700px\)[\s\S]*?\.stat\s*{[^}]*align-items:\s*center;/.test(
      css
    )
  );
});

test("stats are centered within the card", async () => {
  const css = await fs.readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.ok(/\.hero__stats\s*{[^}]*justify-items:\s*center;/.test(css));
  assert.ok(/\.stat\s*{[^}]*align-items:\s*center;/.test(css));
  assert.ok(/\.stat\s*{[^}]*text-align:\s*center;/.test(css));
});
