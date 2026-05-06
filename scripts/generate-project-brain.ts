const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, 'PROJECT_BRAIN.md');
const CONFIG_PATH = path.join(ROOT, 'project-brain.config.json');

const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
]);

const METHOD_DECORATORS = ['Get', 'Post', 'Put', 'Patch', 'Delete'];

/**
 * =========================
 * TYPES (JSDoc for clarity)
 * =========================
 */

/**
 * @typedef {{
 *   projectName: string;
 *   currentPhase: string;
 *   nextPhase: string;
 *   lastReviewed: string;
 *   overview: string[];
 *   currentState: Record<string, { label: string; items: string[] }>;
 *   knownIssues: string[];
 *   mvp: string[];
 *   outOfScopeForNow: string[];
 *   architectureRules: string[];
 *   roadmap: string[];
 *   nextActions: string[];
 *   completedMilestones?: {
 *     phase1?: string[];
 *     phase2?: string[];
 *     phase3?: string[];
 *     phase4?: string[];
 *     phase5?: string[];
 *     phase6?: string[];
 *     phase7?: string[];
 *   };
 * }} BrainConfig
 */

/**
 * =========================
 * FILE HELPERS
 * =========================
 */

function read(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`❌ Failed to read JSON: ${filePath}`);
    console.error(error);
    process.exit(1);
  }
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

/**
 * =========================
 * CONTROLLER SCAN
 * =========================
 */

function walk(dir, files = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (!IGNORE.has(item.name)) {
        walk(full, files);
      }
    } else if (item.name.endsWith('.controller.ts')) {
      files.push(full);
    }
  }

  return files;
}

function extractControllerBase(content) {
  const match = content.match(/@Controller\(([^)]*)\)/);
  if (!match) return '';

  let val = match[1].trim();
  val = val.replace(/['"`]/g, '');
  return val;
}

function extractRoutes(content, basePath) {
  const lines = content.split('\n');
  const routes = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const method of METHOD_DECORATORS) {
      const regex = new RegExp(`@${method}\\(([^)]*)\\)`);
      const match = line.match(regex);

      if (!match) continue;

      let route = (match[1] || '').trim();
      route = route.replace(/['"`]/g, '');

      let full = '';

      if (basePath && route) {
        full = `/${basePath}/${route}`;
      } else if (basePath) {
        full = `/${basePath}`;
      } else if (route) {
        full = `/${route}`;
      } else {
        full = '/';
      }

      full = full.replace(/\/+/g, '/');

      routes.push({
        method: method.toUpperCase(),
        path: full,
      });
    }
  }

  return routes;
}

function parseControllers(files) {
  const apiMap = [];

  for (const file of files) {
    const content = read(file);
    const base = extractControllerBase(content);
    const routes = extractRoutes(content, base);

    for (const route of routes) {
      apiMap.push({
        method: route.method,
        path: route.path,
        file: rel(file),
      });
    }
  }

  return apiMap.sort((a, b) => {
    if (a.path === b.path) {
      return a.method.localeCompare(b.method);
    }
    return a.path.localeCompare(b.path);
  });
}

/**
 * =========================
 * MARKDOWN HELPERS
 * =========================
 */

function renderBulletList(items) {
  if (!items || items.length === 0) {
    return '- None';
  }

  return items.map(item => `- ${item}`).join('\n');
}

function renderCurrentState(currentState) {
  const sections = [
    { key: 'backend', title: 'Backend' },
    { key: 'adminDashboard', title: 'Admin Dashboard' },
    { key: 'mobileTechnician', title: 'Mobile / Technician App' },
    { key: 'aiPlatform', title: 'AI Platform' },
    { key: 'bots', title: 'Bots (Zalo / Facebook)' },
  ];

  return sections
    .map(section => {
      const block = currentState[section.key];

      if (!block) {
        return `## ${section.title}\n- No data`;
      }

      return [
        `## ${section.title} → ${block.label}`,
        renderBulletList(block.items),
      ].join('\n');
    })
    .join('\n\n');
}

function renderCompletedMilestones(completedMilestones) {
  if (!completedMilestones) {
    return [
      '# ✅ COMPLETED MILESTONES',
      '',
      '- No milestone data',
    ].join('\n');
  }

  const sections = [
    { key: 'phase1', title: 'Phase 1 — Backend foundation' },
    { key: 'phase2', title: 'Phase 2 — Auth' },
    { key: 'phase3', title: 'Phase 3 — Orders + Technicians + Tracking' },
    { key: 'phase4', title: 'Phase 4 — Admin Dashboard' },
    { key: 'phase5', title: 'Phase 5 — Mobile / Technician app' },
    { key: 'phase6', title: 'Phase 6 — Zalo / Facebook integration' },
    { key: 'phase7', title: 'Phase 7 — Production hardening' },
  ];

  const rendered = sections
    .filter(section => {
      const items = completedMilestones[section.key];
      return Array.isArray(items) && items.length > 0;
    })
    .map(section => {
      return [
        `## ${section.title}`,
        renderBulletList(completedMilestones[section.key]),
      ].join('\n');
    });

  if (rendered.length === 0) {
    return [
      '# ✅ COMPLETED MILESTONES',
      '',
      '- No milestone data',
    ].join('\n');
  }

  return [
    '# ✅ COMPLETED MILESTONES',
    '',
    rendered.join('\n\n'),
  ].join('\n');
}

function renderApiSection(apiMap) {
  if (apiMap.length === 0) {
    return [
      '# 🚀 API MAP',
      '',
      '- No controller routes found',
      '',
      '---',
      '',
      '# 📊 SUMMARY',
      '',
      '- Total APIs: 0',
      '',
      '---',
    ].join('\n');
  }

  return [
    '# 🚀 API MAP',
    '',
    ...apiMap.map(route => `- **${route.method}** \`${route.path}\` → ${route.file}`),
    '',
    '---',
    '',
    '# 📊 SUMMARY',
    '',
    `- Total APIs: ${apiMap.length}`,
    '',
    `- Current stable milestone: ${apiMap.length > 0 ? 'Phase 3 DONE' : 'Unknown'}`,
    '',
    '---',
  ].join('\n');
}

/**
 * =========================
 * MARKDOWN GENERATOR
 * =========================
 */

function generateMarkdown(config, apiMap) {
  return [
    `# 🧠 PROJECT BRAIN (${config.projectName})`,
    '',
    `Generated: ${new Date().toISOString()}`,
    `Last Reviewed: ${config.lastReviewed}`,
    '',
    '---',
    '',
    '# 🎯 PROJECT OVERVIEW',
    '',
    renderBulletList(config.overview),
    '',
    '---',
    '',
    '# 🧩 CURRENT STATE',
    '',
    renderCurrentState(config.currentState),
    '',
    '---',
    '',
    '# ⚠️ KNOWN ISSUES',
    '',
    renderBulletList(config.knownIssues),
    '',
    '---',
    '',
    '# 🧭 MVP DEFINITION',
    '',
    '## In Scope',
    renderBulletList(config.mvp),
    '',
    '## Out of Scope For Now',
    renderBulletList(config.outOfScopeForNow),
    '',
    '---',
    '',
    '# 🏗️ ARCHITECTURE RULES',
    '',
    renderBulletList(config.architectureRules),
    '',
    '---',
    '',
    '# 🚀 CURRENT PHASE',
    '',
    `- Current: ${config.currentPhase}`,
    `- Next: ${config.nextPhase}`,
    '',
    '---',
    '',
    renderCompletedMilestones(config.completedMilestones),
    '',
    '---',
    '',
    '# 📍 ROADMAP',
    '',
    renderBulletList(config.roadmap),
    '',
    '---',
    '',
    '# ✅ NEXT ACTIONS',
    '',
    renderBulletList(config.nextActions),
    '',
    '---',
    '',
    renderApiSection(apiMap),
    '',
  ].join('\n');
}

/**
 * =========================
 * MAIN
 * =========================
 */

function main() {
  /** @type {BrainConfig} */
  const config = readJson(CONFIG_PATH);

  const controllers = walk(ROOT);
  const apiMap = parseControllers(controllers);

  const markdown = generateMarkdown(config, apiMap);

  fs.writeFileSync(OUTPUT, markdown, 'utf8');

  console.log(`✅ PROJECT_BRAIN generated: ${OUTPUT}`);
  console.log(`🧠 Config loaded: ${CONFIG_PATH}`);
  console.log(`📦 Controllers scanned: ${controllers.length}`);
  console.log(`🚀 APIs found: ${apiMap.length}`);
  console.log(`📍 Current phase: ${config.currentPhase}`);
  console.log(`➡️ Next phase: ${config.nextPhase}`);
}

main();