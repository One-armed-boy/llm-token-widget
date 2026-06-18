import { readFileSync } from "node:fs";

export function readFixture(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}
