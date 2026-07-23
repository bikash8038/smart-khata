import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Smart Khata loading skeleton", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  
  // Verify metadata and title
  assert.match(html, /<title>Smart Khata \| सुरक्षित हिसाब व्यवस्थापन<\/title>/i);
  assert.match(html, /व्यवसायिक हिसाब व्यवस्थापनका लागि सुरक्षित Smart Khata।/);
  
  // Verify AppSkeleton renders correctly on initial load
  assert.match(html, /class="app-skeleton"/);
  assert.match(html, /aria-label="Loading Smart Khata"/);
});
