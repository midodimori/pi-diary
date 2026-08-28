#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cases = JSON.parse(readFileSync(join(root, "evals/cases.json"), "utf8"));
const args = process.argv.slice(2);

function validateCases() {
  if (cases.length !== 20) throw new Error(`Expected 20 cases, found ${cases.length}`);
  const ids = new Set();
  for (const test of cases) {
    if (!test.id || ids.has(test.id)) throw new Error(`Missing or duplicate case id: ${test.id}`);
    ids.add(test.id);
    if ((!test.prompt && !test.prompts?.length) || !test.expect) throw new Error(`Incomplete case: ${test.id}`);
    if (!["yes", "no", "either"].includes(test.expect.search)) throw new Error(`Invalid search expectation: ${test.id}`);
    if (!["yes", "no", "either"].includes(test.expect.mutation)) throw new Error(`Invalid mutation expectation: ${test.id}`);
  }
}

function snapshot(dir) {
  return Object.fromEntries(
    readdirSync(dir)
      .filter((name) => name.endsWith(".md"))
      .sort()
      .map((name) => [name, readFileSync(join(dir, name), "utf8")]),
  );
}

function flatten(snapshot) {
  return Object.values(snapshot).join("\n").toLowerCase();
}

function finalResponse(events) {
  const messages = events
    .filter((event) => event.type === "message_end" && event.message?.role === "assistant")
    .map((event) => event.message);
  const message = messages.at(-1);
  return (message?.content ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .toLowerCase();
}

function validateDiary(files) {
  for (const [name, text] of Object.entries(files)) {
    const records = text.match(/^## /gm)?.length ?? 0;
    const tags = text.match(/^Tags: /gm)?.length ?? 0;
    if (!text.startsWith(`# ${name.slice(0, -3)}\n`)) throw new Error(`${name}: invalid Daily file heading`);
    if (records === 0) throw new Error(`${name}: empty Daily file`);
    if (tags !== records) throw new Error(`${name}: ${records} Records but ${tags} tag lines`);
  }
}

function run(test) {
  const diary = mkdtempSync(join(tmpdir(), `pi-diary-eval-${test.id}-`));
  for (const [name, content] of Object.entries(test.diary ?? {})) writeFileSync(join(diary, name), content);
  const before = snapshot(diary);
  const env = { ...process.env, PI_DIARY_DIR: diary };
  delete env.PI_SESSION_FILE;
  delete env.PI_SESSION_ID;

  const prompts = test.prompts ?? [test.prompt];
  const sessionDir = prompts.length > 1 ? mkdtempSync(join(tmpdir(), `pi-diary-session-${test.id}-`)) : undefined;
  const sessionId = sessionDir ? randomUUID() : undefined;
  const outputs = [];
  const errors = [];
  const statuses = [];
  for (const prompt of prompts) {
    const piArgs = [
      "--mode", "json",
      "--print",
      ...(sessionDir ? ["--session-id", sessionId, "--session-dir", sessionDir] : ["--no-session"]),
      "--no-extensions",
      "--no-skills",
      "--no-prompt-templates",
      "--no-context-files",
      "--skill", join(root, "skills"),
      "--approve",
    ];
    if (process.env.PI_EVAL_PROVIDER) piArgs.push("--provider", process.env.PI_EVAL_PROVIDER);
    if (process.env.PI_EVAL_MODEL) piArgs.push("--model", process.env.PI_EVAL_MODEL);
    piArgs.push(prompt);
    const result = spawnSync("pi", piArgs, {
      cwd: root,
      env,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: Number(process.env.PI_EVAL_TIMEOUT_MS ?? 300_000),
    });
    outputs.push(result.stdout ?? "");
    errors.push(result.stderr ?? "");
    statuses.push(result.status);
    if (result.status !== 0) break;
  }
  if (sessionDir) rmSync(sessionDir, { recursive: true, force: true });

  const failures = [];
  const events = outputs.join("\n")
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      try { return [JSON.parse(line)]; } catch { return []; }
    });
  const search = events.some((event) => {
    if (event.type !== "tool_execution_start") return false;
    if (event.toolName === "read") return String(event.args?.path ?? "").includes("diary-search/SKILL.md");
    return event.toolName === "bash" && /(?:^|[;&|()\s])(?:rg|fd)(?:\s|$)/.test(String(event.args?.command ?? ""));
  });
  const after = snapshot(diary);
  const mutation = JSON.stringify(before) !== JSON.stringify(after);
  const diaryText = flatten(after);
  const response = finalResponse(events);

  const failedRun = statuses.findIndex((status) => status !== 0);
  if (failedRun !== -1) failures.push(`pi prompt ${failedRun + 1} exited ${statuses[failedRun] ?? "without a status"}: ${errors[failedRun].trim()}`);
  if (test.expect.search !== "either" && search !== (test.expect.search === "yes")) failures.push(`search=${search}, expected ${test.expect.search}`);
  if (test.expect.mutation !== "either" && mutation !== (test.expect.mutation === "yes")) failures.push(`mutation=${mutation}, expected ${test.expect.mutation}`);
  for (const text of test.expect.diaryIncludes ?? []) if (!diaryText.includes(text.toLowerCase())) failures.push(`Diary missing: ${text}`);
  for (const text of test.expect.diaryExcludes ?? []) if (diaryText.includes(text.toLowerCase())) failures.push(`Diary still contains: ${text}`);
  for (const text of test.expect.responseIncludes ?? []) if (!response.includes(text.toLowerCase())) failures.push(`response missing: ${text}`);
  try { validateDiary(after); } catch (error) { failures.push(error.message); }

  const keep = process.env.PI_EVAL_KEEP === "1" || failures.length > 0;
  if (!keep) rmSync(diary, { recursive: true });
  return { failures, diary: keep ? diary : undefined, search, mutation };
}

validateCases();

if (args.includes("--list")) {
  for (const test of cases) console.log(`${test.id}\t${test.category}`);
  process.exit(0);
}

const requested = args.length ? new Set(args) : undefined;
const selected = requested ? cases.filter((test) => requested.has(test.id)) : cases;
if (requested && selected.length !== requested.size) {
  const found = new Set(selected.map((test) => test.id));
  throw new Error(`Unknown cases: ${[...requested].filter((id) => !found.has(id)).join(", ")}`);
}

let failed = 0;
for (const test of selected) {
  const result = run(test);
  if (result.failures.length === 0) {
    console.log(`PASS ${test.id} (search=${result.search}, mutation=${result.mutation})`);
  } else {
    failed++;
    console.error(`FAIL ${test.id}`);
    for (const failure of result.failures) console.error(`  - ${failure}`);
    console.error(`  - artifacts: ${result.diary}`);
  }
}

console.log(`\n${selected.length - failed}/${selected.length} passed`);
process.exitCode = failed ? 1 : 0;
