# Accessibility Audit Results (Initial Baseline)

This document tracks WCAG-related findings and remediation steps. It is a starting baseline; comprehensive testing should include manual screen reader checks and automated scans (axe, Lighthouse).

## Summary
- Skip link: Provided by components/AccessibilityTools.tsx (SkipToContent)
- Live region: Provided (aria-live=polite) for announcing updates
- Keyboard focus: Toggleable focus-visible outlines
- Motion: Reduced motion toggle
- Contrast: Built-in contrast checker with WCAG AA/AAA indicators

## Checklist (WCAG 2.1 AA)
- Perceivable
  - Text alternatives: Ensure all images and icons have meaningful alt or aria-label. Status: Review needed
  - Adaptable: Semantic HTML landmarks (header, main, nav, footer). Status: Partial
  - Distinguishable: Color contrast ≥ 4.5:1 for body text. Status: In progress
- Operable
  - Keyboard accessible: All interactive elements reachable via keyboard. Status: In progress
  - Enough time: No auto-redirects without user control. Status: Review needed
  - Seizures: Avoid flashing content > 3 times/sec. Status: Pass (no flashing)
  - Navigable: Skip links, focus order, visible focus. Status: Partial (skip + focus outline provided)
- Understandable
  - Readable: Language declared and consistent. Status: Review needed
  - Predictable: Navigation and controls behave consistently. Status: In progress
  - Input assistance: Form labels, error messages, instructions. Status: Review needed
- Robust
  - Compatibility: ARIA used correctly; roles, states, properties valid. Status: In progress

## Known Issues & Actions
- Color contrast: Validate headings, buttons, and secondary text using the contrast checker; adjust colors or increase font weight/size.
- Focus management: Ensure modals and drawers trap focus and restore it on close.
- Landmarks: Add main with id="main" where applicable; ensure skip link target exists.
- Labels: Confirm accessible names on custom components (buttons, toggles, inputs) and include aria-label or aria-labelledby where needed.
- Tables/charts: Provide summaries or captions for complex visuals; ensure SR-only descriptions.

## Testing Guidance
- Automated: Use axe DevTools or Lighthouse in Chrome to scan pages.
- Screen readers: Test with NVDA (Windows) or VoiceOver (macOS/iOS). Verify skip link, focus visibility, and live announcements.
- Keyboard: Navigate all controls using Tab/Shift+Tab/Enter/Space; ensure logical order and visible focus.

## Recommended Next Steps
1. Add an accessibility route to showcase and verify patterns.
2. Integrate automated axe checks in CI for critical pages.
3. Review components for semantic roles and labels.
4. Tune color palette for consistent AA compliance.
