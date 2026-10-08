import { execFileSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../client/package.json", import.meta.url),
);
const root = new URL("../", import.meta.url);
const sharp = require("sharp");
execFileSync(
  process.execPath,
  [
    new URL("../client/node_modules/vite/bin/vite.js", import.meta.url)
      .pathname,
    "build",
  ],
  { cwd: new URL("client/", root), stdio: "inherit" },
);
execFileSync(
  process.execPath,
  [
    new URL("../client/node_modules/vite/bin/vite.js", import.meta.url)
      .pathname,
    "build",
    "--config",
    "vite.server.config.js",
  ],
  { cwd: new URL("client/", root), stdio: "inherit" },
);
const manifest = JSON.parse(
  await readFile(new URL("dist/.vite/manifest.json", root), "utf8"),
);
const entry = manifest["index.html"];
const assets = { js: entry.file, css: entry.css || [] };
await writeFile(new URL(".server/assets.json", root), JSON.stringify(assets));
await sharp(new URL("client/public/rio-vista-hero.jpg", root).pathname)
  .resize(1000, 667, { fit: "cover" })
  .webp({ quality: 80 })
  .toFile(new URL("dist/river-hero.webp", root).pathname);
await sharp(new URL("client/public/rio-vista-hero.jpg", root).pathname)
  .resize(1200, 630, { fit: "cover" })
  .jpeg({ quality: 80 })
  .toFile(new URL("dist/social-card.jpg", root).pathname);
const { documentHtml, loadModel } = await import("../.server/entry-server.js");
const { staticPaths } = await import("../client/src/data/guides.js");
for (const path of staticPaths) {
  const model = await loadModel(new URL("https://sm-tx.com" + path), {});
  await mkdir(new URL("dist" + path + "/", root), { recursive: true });
  await writeFile(
    new URL("dist" + path + "/index.html", root),
    documentHtml(model, assets),
  );
}
await writeFile(
  new URL("dist/404.html", root),
  documentHtml(
    {
      path: "/404",
      kind: "error",
      status: 404,
      noindex: true,
      heading: "That page isn’t here.",
      description: "Explore current San Marcos event listings.",
      canonical: "https://sm-tx.com/404",
    },
    assets,
  ),
);
await writeFile(
  new URL("dist/_routes.json", root),
  JSON.stringify({
    version: 1,
    include: ["/*"],
    exclude: ["/assets/*", "/*.webp", "/*.jpg", "/favicon.svg", "/robots.txt"],
  }),
);
console.log(
  "Built browser assets, Cloudflare HTML renderer, static guides, and true 404 page.",
);
