import { test } from "node:test";
import assert from "node:assert/strict";

test("concurrent workers cannot admit more than 100 excerpts per UTC day", {
  skip: !process.env.TEST_DATABASE_URL,
}, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  // This test clears its meter; never allow a production datasource.
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/ci");
  process.env.APP_DATABASE_URL = url.href;
  process.env.ARTICLES_DAILY_LIMIT = "100";
  const { prisma } = await import("../src/lib/prisma");
  const { reserveArticleSlots } = await import("../src/lib/usage");
  const day = `articles:${new Date().toISOString().slice(0, 10)}`;
  try {
    await prisma.aiUsage.deleteMany({ where: { day } });
    const grants = await Promise.all(Array.from({ length: 15 }, () => reserveArticleSlots(8)));
    assert.equal(grants.reduce((a, b) => a + b, 0), 100);
    assert.equal((await prisma.aiUsage.findUniqueOrThrow({ where: { day } })).count, 100);
    assert.equal(await reserveArticleSlots(1), 0);
    assert.equal(await reserveArticleSlots(-1), 0);
  } finally {
    await prisma.$disconnect();
  }
});
