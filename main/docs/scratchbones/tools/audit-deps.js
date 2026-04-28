#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../../../');
const command = 'node main/docs/scratchbones/tools/audit-deps.js';
const generatedAt = new Date().toISOString();

const htmlEntrypoints = ['ScratchbonesBluffGame.html'];

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function readFile(relPath) {
  return fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function fileExists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const fromDir = path.dirname(fromFile);
  const resolved = path.normalize(path.join(fromDir, specifier));
  return toPosix(resolved);
}

function collectHtmlScriptRefs(htmlRelPath) {
  const src = readFile(htmlRelPath);
  const scripts = [];
  const scriptRegex = /<script\b([^>]*?)\bsrc=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = scriptRegex.exec(src)) !== null) {
    const attrs = m[1] || '';
    const scriptSrc = m[2];
    const isModule = /\btype\s*=\s*["']module["']/i.test(attrs) || /type\s*=\s*module/i.test(attrs);
    const clean = scriptSrc.replace(/^\.\//, '');
    scripts.push({ src: clean, isModule });
  }
  return scripts;
}

function collectJsImports(jsRelPath) {
  const src = readFile(jsRelPath);
  const imports = [];
  const patterns = [
    /import\s+[^\n]*?from\s+['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+[^\n]*?from\s+['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(src)) !== null) {
      imports.push(m[1]);
    }
  }
  return imports;
}

function buildModuleGraph(moduleEntrypoints) {
  const graph = new Map();
  const visited = new Set();
  const queue = [...moduleEntrypoints];

  while (queue.length) {
    const relFile = queue.shift();
    if (visited.has(relFile) || !fileExists(relFile)) continue;
    visited.add(relFile);

    const imports = collectJsImports(relFile)
      .map(spec => resolveImport(relFile, spec))
      .filter(Boolean)
      .filter(dep => dep.endsWith('.js'))
      .sort();

    graph.set(relFile, imports);
    for (const dep of imports) {
      if (!visited.has(dep)) queue.push(dep);
    }
  }

  return graph;
}

function collectPathLiterals(relPath) {
  const src = readFile(relPath);
  const deps = new Set();

  const quotedPathRegex = /['"]([^'"\n]+)['"]/g;
  let m;
  while ((m = quotedPathRegex.exec(src)) !== null) {
    const value = m[1];
    if (/^(\.?\/)?docs\/assets\//.test(value) || /^(\.?\/)?docs\/config\//.test(value) || /^(\.?\/)?main\/docs\//.test(value) || /^\.\/assets\//.test(value)) {
      const cleaned = value.replace(/^\.\//, '');
      if (!cleaned.endsWith('/')) deps.add(cleaned);
    }
  }

  const cssUrlRegex = /url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g;
  while ((m = cssUrlRegex.exec(src)) !== null) {
    const value = m[1];
    if (/^(\.?\/)?docs\/assets\//.test(value)) {
      const cleaned = value.replace(/^\.\//, '');
      if (!cleaned.endsWith('/')) deps.add(cleaned);
    }
  }

  if (relPath === 'docs/js/portrait-utils.js') {
    deps.add('docs/config/cosmetics/index.json');
    deps.add('docs/config/species/index.json');
  }

  return Array.from(deps).sort();
}

function formatHeader(title) {
  return [
    title,
    `Generated at: ${generatedAt}`,
    `Command: ${command}`,
    '',
  ].join('\n');
}

function relativeSort(values) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function run() {
  const htmlScriptRefs = htmlEntrypoints.flatMap((entry) => collectHtmlScriptRefs(entry));
  const classicScripts = htmlScriptRefs.filter(s => !s.isModule).map(s => s.src);
  const moduleEntrypoints = htmlScriptRefs.filter(s => s.isModule).map(s => s.src);

  const graph = buildModuleGraph(moduleEntrypoints);
  const moduleFiles = Array.from(graph.keys()).sort();

  const runtimeScannedFiles = relativeSort([
    ...htmlEntrypoints,
    ...classicScripts,
    ...moduleFiles,
  ]);

  const allRuntimeDeps = relativeSort(runtimeScannedFiles.flatMap(file => collectPathLiterals(file)));
  const runtimeConfigDeps = allRuntimeDeps.filter(dep => dep.startsWith('docs/config/'));
  const runtimeAssetDeps = allRuntimeDeps.filter(dep => dep.startsWith('docs/assets/') || dep.startsWith('assets/'));
  const missingRuntimeDeps = allRuntimeDeps.filter(dep => dep.startsWith('docs/') && !dep.includes('{') && !fileExists(dep));

  const readmeLines = [
    formatHeader('ScratchbonesBluffGame culled bundle'),
    'Updated entrypoint list:',
    ...htmlEntrypoints.map(entry => `- ${entry}`),
    ...classicScripts.map(file => `- ${file}`),
    ...moduleEntrypoints.map(file => `- ${file}`),
    '',
    'Module dependency graph (ES modules):',
    ...Array.from(graph.entries()).flatMap(([file, deps]) => {
      if (!deps.length) return [`- ${file} -> (no local module imports)`];
      return [`- ${file} ->`, ...deps.map(dep => `  - ${dep}`)];
    }),
    '',
    'Runtime asset/config dependencies:',
    ...runtimeConfigDeps.map(dep => `- ${dep}`),
    ...runtimeAssetDeps.map(dep => `- ${dep}`),
    '',
    'Missing runtime files referenced by these dependencies:',
    ...(missingRuntimeDeps.length ? missingRuntimeDeps.map(dep => `- ${dep}`) : ['- (none)']),
    '',
    'Notes:',
    '- `docs/js/portrait-utils.js` dynamically fetches docs/config indexes and species/cosmetics manifests at runtime; those JSON paths and image files are runtime dependencies even when not imported as ES modules.',
    '- Paths with `{rank}` are templates expanded at runtime.',
    '',
  ];

  const auditLines = [
    formatHeader('ScratchbonesBluffGame.html dependency audit'),
    'Updated entrypoint list:',
    ...htmlEntrypoints.map(entry => `- ${entry}`),
    ...classicScripts.map(file => `- ${file}`),
    ...moduleEntrypoints.map(file => `- ${file}`),
    '',
    'Module dependency graph:',
    ...Array.from(graph.entries()).flatMap(([file, deps]) => {
      if (!deps.length) return [`- ${file} -> (none)`];
      return [`- ${file}:`, ...deps.map(dep => `  - ${dep}`)];
    }),
    '',
    'Runtime config dependencies:',
    ...(runtimeConfigDeps.length ? runtimeConfigDeps.map(dep => `- ${dep}`) : ['- (none)']),
    '',
    'Runtime asset dependencies:',
    ...(runtimeAssetDeps.length ? runtimeAssetDeps.map(dep => `- ${dep}`) : ['- (none)']),
    '',
    'Missing runtime files:',
    ...(missingRuntimeDeps.length ? missingRuntimeDeps.map(dep => `- ${dep}`) : ['- (none)']),
    '',
    'Files scanned for this audit:',
    ...runtimeScannedFiles.map(dep => `- ${dep}`),
    '',
  ];

  fs.writeFileSync(path.join(repoRoot, 'README_CULLED_BUNDLE.txt'), readmeLines.join('\n'));
  fs.writeFileSync(path.join(repoRoot, 'SCRATCHBONES_DEPENDENCY_AUDIT.txt'), auditLines.join('\n'));

  console.log(`Generated README_CULLED_BUNDLE.txt and SCRATCHBONES_DEPENDENCY_AUDIT.txt at ${generatedAt}`);
}

run();
