import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_ROOTS = ["apps", "packages"];
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs"]);
const IMPORT_PATTERN = /(?:import\s+(?:[^"']+?\s+from\s+)?|export\s+[^"']+?\s+from\s+|import\s*\()\s*["']([^"']+)["']/g;
const violations = [];
const LEGACY_LINE_DATABASE_ALLOWLIST = new Set([
  "apps/api/src/modules/line/lineChannelSettings.js",
  "apps/api/src/modules/line/lineNativeCitizen.v10.js",
  "apps/api/src/modules/line/lineNotifications.js",
  "apps/api/src/modules/line/lineRichMenuWizard.js",
  "apps/api/src/modules/line/wasteLine.js",
]);

function collectFiles(directory, files = []) {
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", "coverage"].includes(entry.name)) continue;
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(entryPath, files);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(entryPath);
  }
  return files;
}

function normalizedRelative(file) {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function importsOf(source) {
  return [...source.matchAll(IMPORT_PATTERN)].map((match) => match[1]);
}

function addViolation(file, dependency, rule) {
  violations.push(`${normalizedRelative(file)} -> ${dependency}: ${rule}`);
}

function checkDomain(file, dependencies) {
  const forbiddenPackages = /^(react|react-dom|express|mysql2|cors|helmet|leaflet)(\/|$)/;
  const forbiddenLayers = /(^|\/)(application|infrastructure|presentation|composition-root|modules|core)(\/|$)/;
  for (const dependency of dependencies) {
    if (forbiddenPackages.test(dependency) || forbiddenLayers.test(dependency.replaceAll("\\", "/"))) {
      addViolation(file, dependency, "Domain must not depend on frameworks or outer layers");
    }
  }
}

function checkApplication(file, dependencies) {
  const forbiddenPackages = /^(react|react-dom|express|mysql2|cors|helmet|leaflet)(\/|$)/;
  const forbiddenLayers = /(^|\/)(infrastructure|presentation|composition-root|modules|core)(\/|$)/;
  const concreteWebDependencies = /^@smart-thapho\/web-core\/(api|session|navigation|runtime-config)$/;
  for (const dependency of dependencies) {
    const normalized = dependency.replaceAll("\\", "/");
    if (forbiddenPackages.test(dependency) || forbiddenLayers.test(normalized) || concreteWebDependencies.test(dependency)) {
      addViolation(file, dependency, "Application must depend on domain/application abstractions, not concrete adapters");
    }
  }
}

function checkPresentation(file, dependencies, source) {
  const directInfrastructure = /^@smart-thapho\/web-core\/(api|session|navigation|runtime-config)$/;
  const serverInfrastructure = /^(mysql2)(\/|$)|(^|\/)(infrastructure|core\/db)(\/|$)/;
  for (const dependency of dependencies) {
    if (directInfrastructure.test(dependency)) {
      addViolation(file, dependency, "Presentation must call an application service through the composition root");
    }
    if (serverInfrastructure.test(dependency.replaceAll("\\", "/"))) {
      addViolation(file, dependency, "Presentation must not import database or infrastructure adapters");
    }
  }

  if (/\b(?:pool|database|db)\.(?:execute|query|beginTransaction|commit|rollback)\s*\(/.test(source)) {
    addViolation(
      file,
      "direct database call",
      "Presentation must delegate persistence to an application use case and repository",
    );
  }
}

function checkLineModule(file, dependencies, source) {
  const relative = normalizedRelative(file);
  const importsDatabase = dependencies.some((dependency) =>
    /(^|\/)core\/db(?:\.js)?$/.test(dependency.replaceAll("\\", "/")),
  );
  const callsDatabase = /\b(?:pool|database|db)\.(?:execute|query|transaction)\s*\(/.test(source);

  if (
    (importsDatabase || callsDatabase) &&
    !LEGACY_LINE_DATABASE_ALLOWLIST.has(relative)
  ) {
    addViolation(
      file,
      "direct database access",
      "New LINE modules must use an application service and repository; only audited legacy modules are temporarily allowed",
    );
  }
}

for (const sourceRoot of SOURCE_ROOTS) {
  for (const file of collectFiles(path.join(ROOT, sourceRoot))) {
    const relative = normalizedRelative(file);
    const source = fs.readFileSync(file, "utf8");
    const dependencies = importsOf(source);
    if (relative.includes("/domain/")) checkDomain(file, dependencies);
    if (relative.includes("/application/")) checkApplication(file, dependencies);
    if (/\/(pages|components|presentation)\//.test(relative) || /\/src\/(?:[A-Z][^/]*App|App)\.jsx$/.test(relative)) {
      checkPresentation(file, dependencies, source);
    }
    if (relative.includes("/modules/line/")) {
      checkLineModule(file, dependencies, source);
    }
  }
}

if (violations.length) {
  console.error("OOP architecture boundary violations:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("OOP architecture boundaries: PASS");
}
