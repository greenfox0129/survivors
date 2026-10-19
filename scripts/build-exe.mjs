#!/usr/bin/env node
// ============================================================
//  scripts/build-exe.mjs — 원클릭 실행 exe 빌드 (Windows 전용)
//
//    npm run build:exe            # 웹 빌드(vite) + exe 컴파일
//    npm run build:exe -- --skip-web   # dist/ 가 이미 있으면 컴파일만
//
//  결과: release/SurvivorsProto.exe  (dist/ 전체가 exe 안에 포함됨)
//  컴파일러: Windows 기본 포함 .NET Framework 4.x csc.exe — 별도 설치 불필요
// ============================================================

import { execFileSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
const skipWeb = process.argv.includes("--skip-web");

const EXE_NAME = "SurvivorsProto.exe";

function fail(msg) {
  console.error(`\n[build-exe] ${msg}`);
  process.exit(1);
}

if (process.platform !== "win32") fail("Windows 에서만 빌드할 수 있습니다 (csc.exe 필요).");

// 1) 웹 빌드
if (!skipWeb) {
  console.log("[build-exe] vite build ...");
  execSync("npm run build", { cwd: root, stdio: "inherit" });
}
const dist = path.join(root, "dist");
if (!fs.existsSync(path.join(dist, "index.html"))) fail("dist/index.html 이 없습니다. 먼저 npm run build 를 실행하세요.");

// 2) csc.exe 찾기
const windir = process.env.WINDIR ?? "C:\\Windows";
const csc = [
  path.join(windir, "Microsoft.NET", "Framework64", "v4.0.30319", "csc.exe"),
  path.join(windir, "Microsoft.NET", "Framework", "v4.0.30319", "csc.exe"),
].find((p) => fs.existsSync(p));
if (!csc) fail(".NET Framework 4.x csc.exe 를 찾지 못했습니다.");

// 3) dist/ 파일 목록 → 리소스 인자
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const files = walk(dist);
const resourceArgs = files.map((abs) => {
  const rel = path.relative(dist, abs).split(path.sep).join("/");
  if (rel.includes(",")) fail(`리소스 파일 이름에 쉼표를 쓸 수 없습니다: ${rel}`);
  return `/resource:${path.relative(root, abs)},game/${rel}`;
});

// 4) 버전 정보 (package.json version → 파일 속성)
const objDir = path.join(root, "launcher", "obj");
fs.mkdirSync(objDir, { recursive: true });
const ver = String(pkg.version).replace(/[^0-9.]/g, "");
const ver4 = [...ver.split("."), "0", "0", "0"].slice(0, 4).join(".");
fs.writeFileSync(
  path.join(objDir, "AssemblyInfo.cs"),
  [
    "using System.Reflection;",
    '[assembly: AssemblyTitle("Survivors Prototype")]',
    '[assembly: AssemblyProduct("Survivors Prototype")]',
    `[assembly: AssemblyDescription("One-click launcher for Survivors Prototype v${pkg.version}")]`,
    `[assembly: AssemblyVersion("${ver4}")]`,
    `[assembly: AssemblyFileVersion("${ver4}")]`,
    `[assembly: AssemblyInformationalVersion("${pkg.version}")]`,
    "",
  ].join("\r\n"),
);

// 5) 컴파일
const releaseDir = path.join(root, "release");
fs.mkdirSync(releaseDir, { recursive: true });
const out = path.join(releaseDir, EXE_NAME);
const icon = path.join(root, "launcher", "app.ico");
const args = [
  "/nologo",
  "/target:winexe",
  "/optimize+",
  "/codepage:65001",
  "/platform:anycpu",
  `/out:${path.relative(root, out)}`,
  "/r:System.Windows.Forms.dll",
  "/r:System.Drawing.dll",
  ...(fs.existsSync(icon) ? [`/win32icon:${path.relative(root, icon)}`] : []),
  ...resourceArgs,
  path.join("launcher", "Launcher.cs"),
  path.join("launcher", "obj", "AssemblyInfo.cs"),
];
console.log(`[build-exe] csc (${files.length} embedded files) ...`);
try {
  execFileSync(csc, args, { cwd: root, stdio: "inherit" });
} catch {
  fail("컴파일 실패 — 위 csc 오류를 확인하세요. (Launcher.cs 는 C# 5 문법만 지원)");
}

const buf = fs.readFileSync(out);
const sha = createHash("sha256").update(buf).digest("hex");
console.log(`\n[build-exe] OK  v${pkg.version}`);
console.log(`  ${out}`);
console.log(`  ${(buf.length / 1024).toFixed(0)} KB  sha256 ${sha}`);
