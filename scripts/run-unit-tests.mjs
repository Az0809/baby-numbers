import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

rmSync(".test-dist", { recursive: true, force: true });

const executable = process.platform === "win32" ? "tsc.cmd" : "tsc";
const tscPath = join("node_modules", ".bin", executable);
const compile = spawnSync(tscPath, ["-p", "tsconfig.tests.json"], {
  stdio: "inherit",
  shell: false
});

if (compile.status !== 0) {
  process.exit(compile.status ?? 1);
}

const tests = spawnSync(
  process.execPath,
  ["--test", ".test-dist/tests/numbers.test.js", ".test-dist/tests/progress-storage.test.js"],
  { stdio: "inherit" }
);

process.exit(tests.status ?? 1);
