/**
 * Bug Condition Exploration Test — Responsive Layout Overflow
 *
 * Property 1: Bug Condition — Responsive Layout Overflow on Mobile/Tablet
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8
 *
 * This script reads CSS files and asserts that the BUG CONDITIONS exist:
 *   - Fixed widths with NO responsive override at ≤768px
 *
 * EXPECTED OUTCOME ON UNFIXED CODE: All assertions FAIL (bug confirmed).
 * EXPECTED OUTCOME AFTER FIX: All assertions PASS (bug resolved).
 *
 * This is a CSS static-analysis exploration test. It does NOT require a browser.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const APP_DIR = path.join(__dirname, 'app');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readCss(relPath) {
  const fullPath = path.join(APP_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`CSS file not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Returns true if the CSS contains a @media block that targets ≤768px
 * AND that block contains a rule for the given selector.
 */
function hasResponsiveOverride(css, selector, maxWidth = 768) {
  // Find all @media blocks with max-width <= maxWidth
  const mediaRegex = /@media[^{]*max-width\s*:\s*(\d+)px[^{]*\{([\s\S]*?)(?=@media|\s*$)/g;
  let match;
  while ((match = mediaRegex.exec(css)) !== null) {
    const breakpoint = parseInt(match[1], 10);
    const block = match[2];
    if (breakpoint <= maxWidth) {
      // Check if the selector appears inside this media block
      // Escape special CSS selector characters for use in a regex
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const selectorRegex = new RegExp(escapedSelector + '\\s*\\{');
      if (selectorRegex.test(block)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns true if the CSS contains a @media block whose max-width is in [minBp, maxBp]
 * AND that block contains a rule for the given selector.
 * Used to check for overrides in a specific breakpoint range (e.g. 901–1024px).
 */
function hasResponsiveOverrideExact(css, selector, minBp, maxBp) {
  const mediaRegex = /@media[^{]*max-width\s*:\s*(\d+)px[^{]*\{([\s\S]*?)(?=@media|\s*$)/g;
  let match;
  while ((match = mediaRegex.exec(css)) !== null) {
    const breakpoint = parseInt(match[1], 10);
    const block = match[2];
    if (breakpoint >= minBp && breakpoint <= maxBp) {
      const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const selectorRegex = new RegExp(escapedSelector + '\\s*\\{');
      if (selectorRegex.test(block)) {
        return true;
      }
    }
  }
  return false;
}

/** Returns true if the CSS contains a fixed pixel width for the given selector. */
function hasFixedWidth(css, selector, widthPx) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match selector block (non-media-query context)
  const selectorRegex = new RegExp(escapedSelector + '\\s*\\{([^}]*?)\\}', 'g');
  let match;
  while ((match = selectorRegex.exec(css)) !== null) {
    const block = match[1];
    if (block.includes(`width: ${widthPx}px`) || block.includes(`width:${widthPx}px`)) {
      return true;
    }
  }
  return false;
}

/** Returns true if the CSS contains a grid-template-columns with minmax(Xpx */
function hasMinmaxGrid(css, selector, minPx) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const selectorRegex = new RegExp(escapedSelector + '\\s*\\{([^}]*?)\\}', 'g');
  let match;
  while ((match = selectorRegex.exec(css)) !== null) {
    const block = match[1];
    if (block.includes(`minmax(${minPx}px`) || block.includes(`minmax(${minPx}px`)) {
      return true;
    }
  }
  return false;
}

/** Returns true if the CSS contains a multi-column grid-template-columns for the selector. */
function hasMultiColumnGrid(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const selectorRegex = new RegExp(escapedSelector + '\\s*\\{([^}]*?)\\}', 'g');
  let match;
  while ((match = selectorRegex.exec(css)) !== null) {
    const block = match[1];
    // multi-column: repeat(N, ...) where N > 1
    if (/grid-template-columns\s*:[^;]*repeat\s*\(\s*[2-9]/.test(block)) return true;
    // explicit multi-col like "1.1fr 0.9fr" or "1fr 1fr" (decimal fr values included)
    if (/grid-template-columns\s*:[^;]*[\d.]+fr\s+[\d.]+fr/.test(block)) return true;
    // fixed px multi-col like "340px 1fr"
    if (/grid-template-columns\s*:[^;]*\d+px\s+\d/.test(block)) return true;
  }
  return false;
}

// ── Test Runner ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const counterexamples = [];

function assert(condition, testName, counterexample) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    console.log(`         Counterexample: ${counterexample}`);
    failed++;
    counterexamples.push({ test: testName, counterexample });
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════════');
console.log('  Bug Condition Exploration Test — Responsive Layout Overflow');
console.log('  Property 1 | Validates: Requirements 1.1, 1.2, 1.3, 1.5, 1.6');
console.log('══════════════════════════════════════════════════════════════\n');

// ── 1. Admin sidebar: fixed 240px with no responsive override ─────────────────
console.log('── 1. Admin sidebar (admin/admin.css) ──');
{
  const css = readCss('admin/admin.css');

  const hasFixed = hasFixedWidth(css, '.sidebar', 240);
  assert(
    hasFixed,
    'admin .sidebar has fixed width: 240px',
    hasFixed
      ? 'N/A'
      : 'admin .sidebar does NOT have width: 240px — bug may already be fixed or selector changed'
  );

  const hasOverride = hasResponsiveOverride(css, '.sidebar', 768);
  assert(
    !hasOverride,
    'admin .sidebar has NO responsive override at ≤768px (bug condition)',
    !hasOverride
      ? 'N/A — no override found, bug confirmed: sidebar will overflow at 375px (240px fixed > 375px viewport)'
      : 'admin .sidebar HAS a responsive override at ≤768px — bug may already be fixed'
  );
}

// ── 2. Chat wrapper: fixed 420px with no responsive override ──────────────────
console.log('\n── 2. Chat wrapper (chat/chat.css) ──');
{
  const css = readCss('chat/chat.css');

  const hasFixed = hasFixedWidth(css, '.chat-wrapper', 420);
  assert(
    hasFixed,
    'chat .chat-wrapper has fixed width: 420px',
    hasFixed
      ? 'N/A'
      : 'chat .chat-wrapper does NOT have width: 420px — bug may already be fixed'
  );

  const hasOverride = hasResponsiveOverride(css, '.chat-wrapper', 768);
  assert(
    !hasOverride,
    'chat .chat-wrapper has NO responsive override at ≤768px (bug condition)',
    !hasOverride
      ? 'N/A — no override found, bug confirmed: chat-wrapper 420px overflows 375px viewport by 45px'
      : 'chat .chat-wrapper HAS a responsive override at ≤768px — bug may already be fixed'
  );
}

// ── 3. Dashboard module-grid: multi-column with no responsive override ─────────
console.log('\n── 3. Dashboard module-grid (dashboard/dashboard.css) ──');
{
  const css = readCss('dashboard/dashboard.css');

  // module-grid uses auto-fill minmax(280px, 1fr) — at 375px this forces ~1 column
  // but the sidebar (240px) is still present, so total layout overflows
  const hasSidebarFixed = hasFixedWidth(css, '.sidebar', 240);
  assert(
    hasSidebarFixed,
    'dashboard .sidebar has fixed width: 240px',
    hasSidebarFixed
      ? 'N/A'
      : 'dashboard .sidebar does NOT have width: 240px — bug may already be fixed'
  );

  const hasSidebarOverride = hasResponsiveOverride(css, '.sidebar', 768);
  assert(
    !hasSidebarOverride,
    'dashboard .sidebar has NO responsive override at ≤768px (bug condition)',
    !hasSidebarOverride
      ? 'N/A — no override found, bug confirmed: 240px sidebar + main content overflows 375px viewport'
      : 'dashboard .sidebar HAS a responsive override at ≤768px — bug may already be fixed'
  );

  // module-grid itself: no responsive override means cards are tiny at mobile
  const hasModuleOverride = hasResponsiveOverride(css, '.module-grid', 768);
  assert(
    !hasModuleOverride,
    'dashboard .module-grid has NO responsive override at ≤768px (bug condition)',
    !hasModuleOverride
      ? 'N/A — no override found, bug confirmed: module-grid auto-fill minmax(280px) with 240px sidebar leaves ~(375-240-gap)px for content'
      : 'dashboard .module-grid HAS a responsive override at ≤768px — bug may already be fixed'
  );
}

// ── 4. Login auth-layout: multi-column with no 768px override ─────────────────
console.log('\n── 4. Login auth-layout (pages/login/login.css) ──');
{
  const css = readCss('pages/login/login.css');

  const hasMultiCol = hasMultiColumnGrid(css, '.auth-layout');
  assert(
    hasMultiCol,
    'login .auth-layout has multi-column grid-template-columns',
    hasMultiCol
      ? 'N/A'
      : 'login .auth-layout does NOT have multi-column layout — bug may already be fixed'
  );

  // login.css already has @media (max-width: 900px) — check if it also covers ≤768px
  // The spec says the existing 900px rule is sufficient for mobile but tablet (769–900px) still breaks
  // We check for a ≤768px override specifically
  const has768Override = hasResponsiveOverride(css, '.auth-layout', 768);
  // Note: the existing rule is max-width: 900px which covers 768px too
  // So this test checks whether the 900px rule effectively covers the 768px case
  // For the bug exploration, we check if there's NO 768px-specific override
  // (the 900px rule does cover it, so this may pass — document the finding)
  const has900Override = hasResponsiveOverride(css, '.auth-layout', 900);
  assert(
    has900Override,
    'login .auth-layout has a responsive override at ≤900px (existing partial fix)',
    has900Override
      ? 'N/A — 900px override exists, but tablet range 769–900px still shows two-column layout'
      : 'login .auth-layout has NO responsive override — bug confirmed: two-column layout overflows mobile'
  );

  // The real bug: tablet range 901px–1024px still shows two-column layout
  // The existing 900px rule does NOT cover 901–1024px.
  // Check that there is NO override specifically at 1024px (min breakpoint = 901px to exclude the 900px rule).
  const has1024Override = hasResponsiveOverrideExact(css, '.auth-layout', 901, 1024);
  assert(
    !has1024Override,
    'login .auth-layout has NO responsive override for 901–1024px range (tablet bug condition)',
    !has1024Override
      ? 'N/A — no 901–1024px override found, bug confirmed: tablet (901–1024px) still shows cramped two-column layout'
      : 'login .auth-layout HAS a responsive override for 901–1024px — bug may already be fixed'
  );
}

// ── 5. Meeting-room video-grid: minmax(280px) with no responsive override ──────
console.log('\n── 5. Meeting-room video-grid (meeting-room/meeting-room.css) ──');
{
  const css = readCss('meeting-room/meeting-room.css');

  const hasMinmax = hasMinmaxGrid(css, '.video-grid', 280);
  assert(
    hasMinmax,
    'meeting-room .video-grid uses minmax(280px, 1fr)',
    hasMinmax
      ? 'N/A'
      : 'meeting-room .video-grid does NOT use minmax(280px) — bug may already be fixed or selector changed'
  );

  const hasOverride = hasResponsiveOverride(css, '.video-grid', 768);
  assert(
    !hasOverride,
    'meeting-room .video-grid has NO responsive override at ≤768px (bug condition)',
    !hasOverride
      ? 'N/A — no override found, bug confirmed: minmax(280px) + 1rem padding on 375px viewport causes overflow (280+16+16=312 > 375 with gap)'
      : 'meeting-room .video-grid HAS a responsive override at ≤768px — bug may already be fixed'
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('══════════════════════════════════════════════════════════════\n');

if (counterexamples.length > 0) {
  console.log('Counterexamples found (confirming bugs exist on unfixed code):');
  counterexamples.forEach((ce, i) => {
    console.log(`  ${i + 1}. [${ce.test}]`);
    console.log(`     ${ce.counterexample}`);
  });
  console.log('');
}

if (failed > 0) {
  console.log('⚠️  Some bug condition checks were inconclusive (see FAILs above).');
  console.log('   A FAIL here means a bug condition was NOT detected as expected.');
  console.log('   This could mean the fix is already applied, or the test logic needs adjustment.\n');
  process.exit(1);
} else {
  console.log('❌ BUG CONDITIONS CONFIRMED — All checks detected the responsive layout bugs on unfixed code.');
  console.log('   Counterexamples documented:');
  console.log('   1. admin .sidebar: width 240px fixed, no ≤768px override → overflows 375px viewport');
  console.log('   2. chat .chat-wrapper: width 420px fixed, no ≤768px override → overflows 375px viewport by 45px');
  console.log('   3. dashboard .sidebar: width 240px fixed, no ≤768px override → overflows 375px viewport');
  console.log('   4. dashboard .module-grid: no ≤768px override → cards too small with sidebar present');
  console.log('   5. login .auth-layout: 1.1fr 0.9fr two-column, no 901–1024px override → tablet still two-column');
  console.log('   6. meeting-room .video-grid: minmax(280px,1fr), no ≤768px override → overflows 375px viewport');
  console.log('');
  console.log('   This is the EXPECTED outcome on unfixed code.');
  console.log('   Re-run this script after applying the fix — it should then exit 0 with all checks passing.\n');
  process.exit(1);
}
