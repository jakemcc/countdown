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

test("heart confetti pieces are larger for readability", async () => {
  const css = await fs.readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.ok(/\.confetti-piece--heart\s*{[^}]*width:\s*20px;/.test(css));
  assert.ok(/\.confetti-piece--heart\s*{[^}]*height:\s*20px;/.test(css));
  assert.ok(
    /\.confetti-piece--heart:nth-child\(odd\)\s*{[^}]*width:\s*19px;/.test(css)
  );
  assert.ok(
    /\.confetti-piece--heart:nth-child\(odd\)\s*{[^}]*height:\s*19px;/.test(css)
  );
});

test("projected legend marker is dashed", async () => {
  const css = await fs.readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.ok(
    /\.legend__item--projected::before\s*{[^}]*border:\s*2px dashed var\(--graph-actual\);/.test(
      css
    )
  );
  assert.ok(
    /\.legend__item--projected::before\s*{[^}]*background:\s*transparent;/.test(
      css
    )
  );
});
