/**
 * Property 2: Preservation — Desktop Layout Unchanged at > 1024px
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 *
 * This is a Node.js CSS static-analysis script.
 * It reads the CSS files for admin, login, faculty, and dashboard and asserts:
 *   1. Desktop baseline styles are present (sidebar widths, multi-column grids)
 *   2. No @media block with max-width > 1024px overrides these desktop styles
 *
 * EXPECTED OUTCOME: All assertions PASS on both unfixed and fixed code.
 * This confirms the desktop baseline is intact and preserved after the fix.
 *
 * Run with: node "Smart Classroom/smart-classroom-fixed/src/responsive-preservation.spec.js"
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

/**
 * Read a CSS file relative to this script's location.
 * The script lives at: Smart Classroom/smart-classroom-fixed/src/
 * CSS files live at:   Smart Classroom/smart-classroom-fixed/src/app/...
 */
function readCss(relPath) {
  const fullPath = path.resolve(__dirname, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`CSS file not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Check whether a CSS string contains a rule matching:
 *   selector { ... property: value ... }
 * outside of any @media block (i.e., at the top level / desktop baseline).
 *
 * Strategy: strip all @media blocks, then search for the selector + property/value.
 */
function hasDesktopRule(css, selector, property, value) {
  const stripped = stripMediaBlocks(css);
  // Build a loose regex: selector ... { ... property: value ... }
  // We allow whitespace and other properties between selector and the target declaration.
  const selectorEscaped = escapeRegex(selector);
  const propertyEscaped = escapeRegex(property);
  const valueEscaped = escapeRegex(value);

  // Match the selector followed (eventually) by a block containing the property: value
  const blockRegex = new RegExp(
    selectorEscaped + '\\s*\\{[^}]*' + propertyEscaped + '\\s*:\\s*' + valueEscaped,
    'i'
  );
  return blockRegex.test(stripped);
}

/**
 * Check whether a CSS string contains a rule matching:
 *   selector { ... property: <anything containing substring> ... }
 * outside of any @media block.
 */
function hasDesktopRuleContaining(css, selector, property, valueSubstring) {
  const stripped = stripMediaBlocks(css);
  const selectorEscaped = escapeRegex(selector);
  const propertyEscaped = escapeRegex(property);
  const valueEscaped = escapeRegex(valueSubstring);

  const blockRegex = new RegExp(
    selectorEscaped + '\\s*\\{[^}]*' + propertyEscaped + '\\s*:[^;]*' + valueEscaped,
    'i'
  );
  return blockRegex.test(stripped);
}

/**
 * Remove all @media blocks from a CSS string (handles nested braces).
 */
function stripMediaBlocks(css) {
  let result = '';
  let depth = 0;
  let inMedia = false;
  let i = 0;

  while (i < css.length) {
    // Detect start of @media
    if (!inMedia && css.slice(i, i + 6) === '@media') {
      inMedia = true;
      depth = 0;
      // Skip until we find the opening brace
      while (i < css.length && css[i] !== '{') i++;
      // Now we're at '{', start counting depth
    }

    if (inMedia) {
      if (css[i] === '{') depth++;
      else if (css[i] === '}') {
        depth--;
        if (depth === 0) {
          inMedia = false;
          i++;
          continue;
        }
      }
      i++;
    } else {
      result += css[i];
      i++;
    }
  }

  return result;
}

/**
 * Extract all @media blocks from a CSS string and return them as an array of
 * objects: { query: string, body: string }.
 */
function extractMediaBlocks(css) {
  const blocks = [];
  let i = 0;

  while (i < css.length) {
    const mediaIdx = css.indexOf('@media', i);
    if (mediaIdx === -1) break;

    // Find the opening brace
    const openBrace = css.indexOf('{', mediaIdx);
    if (openBrace === -1) break;

    const query = css.slice(mediaIdx + 6, openBrace).trim();

    // Extract the full block (handle nested braces)
    let depth = 0;
    let j = openBrace;
    while (j < css.length) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') {
        depth--;
        if (depth === 0) break;
      }
      j++;
    }

    const body = css.slice(openBrace + 1, j);
    blocks.push({ query, body });
    i = j + 1;
  }

  return blocks;
}

/**
 * Parse a max-width value (in px) from a media query string.
 * Returns null if no max-width is found.
 */
function parseMaxWidth(query) {
  const match = query.match(/max-width\s*:\s*(\d+(?:\.\d+)?)\s*px/i);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Check that no @media block with max-width > 1024px overrides a given
 * selector's property.
 *
 * A "desktop-range" media query is one whose max-width > 1024px (e.g. 1200px, 1440px).
 * Such a block would affect desktop viewports and could accidentally override
 * the baseline desktop styles.
 */
function noDesktopMediaOverride(css, selector, property) {
  const blocks = extractMediaBlocks(css);
  const selectorEscaped = escapeRegex(selector);
  const propertyEscaped = escapeRegex(property);

  for (const block of blocks) {
    const maxWidth = parseMaxWidth(block.query);
    // Only flag blocks whose max-width is > 1024px (desktop range)
    if (maxWidth !== null && maxWidth > 1024) {
      const overrideRegex = new RegExp(
        selectorEscaped + '\\s*\\{[^}]*' + propertyEscaped + '\\s*:',
        'i'
      );
      if (overrideRegex.test(block.body)) {
        return { ok: false, offendingQuery: block.query };
      }
    }
  }
  return { ok: true };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── CSS file paths (relative to this script) ───────────────────────────────

const CSS = {
  admin:     'app/admin/admin.css',
  login:     'app/pages/login/login.css',
  faculty:   'app/faculty/faculty.css',
  dashboard: 'app/dashboard/dashboard.css',
};

// ─── Load CSS files ──────────────────────────────────────────────────────────

console.log('\n=== Responsive Preservation Property Tests ===');
console.log('Property 2: Desktop Layout Unchanged at > 1024px\n');

let adminCss, loginCss, facultyCss, dashboardCss;

try {
  adminCss     = readCss(CSS.admin);
  loginCss     = readCss(CSS.login);
  facultyCss   = readCss(CSS.faculty);
  dashboardCss = readCss(CSS.dashboard);
  console.log('✔ All CSS files loaded successfully.\n');
} catch (err) {
  console.error('FATAL: Could not load CSS files:', err.message);
  process.exit(1);
}

// ─── Test Suite 1: Admin desktop baseline ───────────────────────────────────

console.log('--- Suite 1: admin/admin.css — Desktop Baseline ---');

assert(
  hasDesktopRule(adminCss, '.sidebar', 'width', '240px'),
  '.sidebar has desktop baseline width: 240px'
);

{
  const check = noDesktopMediaOverride(adminCss, '.sidebar', 'width');
  assert(
    check.ok,
    check.ok
      ? 'No @media block with max-width > 1024px overrides .sidebar width'
      : `@media (${check.offendingQuery}) overrides .sidebar width — desktop breakage detected`
  );
}

// ─── Test Suite 2: Login desktop baseline ───────────────────────────────────

console.log('\n--- Suite 2: pages/login/login.css — Desktop Baseline ---');

// The login page uses grid-template-columns: 1.1fr 0.9fr (multi-column)
assert(
  hasDesktopRuleContaining(loginCss, '.auth-layout', 'grid-template-columns', 'fr'),
  '.auth-layout has desktop multi-column grid (grid-template-columns contains "fr")'
);

// Confirm it is NOT a single-column layout at desktop level
assert(
  !hasDesktopRule(loginCss, '.auth-layout', 'grid-template-columns', '1fr'),
  '.auth-layout desktop baseline is NOT single-column (1fr) — two-panel layout preserved'
);

{
  const check = noDesktopMediaOverride(loginCss, '.auth-layout', 'grid-template-columns');
  assert(
    check.ok,
    check.ok
      ? 'No @media block with max-width > 1024px overrides .auth-layout grid-template-columns'
      : `@media (${check.offendingQuery}) overrides .auth-layout grid-template-columns — desktop breakage detected`
  );
}

// ─── Test Suite 3: Faculty desktop baseline ──────────────────────────────────

console.log('\n--- Suite 3: faculty/faculty.css — Desktop Baseline ---');

assert(
  hasDesktopRule(facultyCss, '.sidebar', 'width', '255px'),
  '.sidebar has desktop baseline width: 255px'
);

{
  const check = noDesktopMediaOverride(facultyCss, '.sidebar', 'width');
  assert(
    check.ok,
    check.ok
      ? 'No @media block with max-width > 1024px overrides .sidebar width'
      : `@media (${check.offendingQuery}) overrides .sidebar width — desktop breakage detected`
  );
}

// ─── Test Suite 4: Dashboard desktop baseline ────────────────────────────────

console.log('\n--- Suite 4: dashboard/dashboard.css — Desktop Baseline ---');

assert(
  hasDesktopRule(dashboardCss, '.sidebar', 'width', '240px'),
  '.sidebar has desktop baseline width: 240px'
);

{
  const check = noDesktopMediaOverride(dashboardCss, '.sidebar', 'width');
  assert(
    check.ok,
    check.ok
      ? 'No @media block with max-width > 1024px overrides .sidebar width'
      : `@media (${check.offendingQuery}) overrides .sidebar width — desktop breakage detected`
  );
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n=== Results ===');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);

if (failed > 0) {
  console.error('\n❌ Some preservation assertions FAILED.');
  process.exit(1);
} else {
  console.log('\n✅ All preservation assertions PASSED. Desktop baseline is intact.');
  process.exit(0);
}
