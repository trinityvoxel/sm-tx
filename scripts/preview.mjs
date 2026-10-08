import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
const child = spawn(
  process.execPath,
  [
    new URL("../client/node_modules/wrangler/bin/wrangler.js", import.meta.url)
      .pathname,
    "pages",
    "dev",
    "dist",
    "--port",
    "8788",
    "--ip",
    "127.0.0.1",
  ],
  {
    cwd: new URL("../", import.meta.url),
    stdio: "inherit",
    env: {
      ...process.env,
      WRANGLER_LOG_PATH: join(tmpdir(), "smtx-wrangler.log"),
      CHOKIDAR_USEPOLLING: "true",
    },
  },
);
child.on("exit", (code) => process.exit(code || 0));
