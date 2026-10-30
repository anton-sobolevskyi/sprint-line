import { expect, type Page } from '@playwright/test';

/** axe-core version pinned for reproducible scans */
const AXE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.3/axe.min.js';

export type AxeViolation = {
  id: string;
  impact: string | null;
  description: string;
  helpUrl: string;
  nodes: { target: string[] }[];
};

export type AxeResults = {
  violations: AxeViolation[];
};

/**
 * Inject axe-core and run against the current document.
 * Tags aligned with docs/AUDIT.MD (WCAG 2.A / 2.AA / 2.1 AA / 2.2 AA).
 */
export async function runAxe(page: Page): Promise<AxeResults> {
  await page.addScriptTag({ url: AXE_CDN });

  return page.evaluate(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axe = (window as any).axe;
    if (!axe?.run) {
      throw new Error('axe-core failed to load');
    }
    return axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
      },
    }) as Promise<AxeResults>;
  });
}

/** Fail the test on critical/serious violations; format a readable message. */
export async function expectNoSeriousA11yViolations(page: Page): Promise<void> {
  const results = await runAxe(page);
  const serious = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  if (serious.length === 0) {
    expect(serious).toHaveLength(0);
    return;
  }

  const report = serious
    .map((v) => {
      const targets = v.nodes
        .slice(0, 5)
        .map((n) => `    - ${n.target.join(' ')}`)
        .join('\n');
      return `[${v.impact}] ${v.id}: ${v.description}\n${targets}\n  ${v.helpUrl}`;
    })
    .join('\n\n');

  expect(serious, `Serious/critical a11y violations:\n\n${report}`).toHaveLength(0);
}
