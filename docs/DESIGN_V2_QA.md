# LeadX — Signal Desk V2 / Visual QA

Scope: non-production candidate only. Fixtures are synthetic; no real customer data is used.

## Candidate
- PR: #25
- base: `main@01dc33f4b39e9352e920941685961e30ffc29033`
- initial design commit: `a2660c24af2605b77d015ab6905b490040e67d2e`
- QA correction commit: `ba3c0e61d60f5479c108d1601ab98eb2d077e1e0`
- production deploy: NO

## First visual gate
Run `31199803262`, job `92936793941`:
- build: PASS
- public product contracts: 20/20 PASS
- typecheck: PASS
- Worker syntax: PASS
- legacy active runtime: ABSENT
- Wrangler dry-run: PASS
- visual QA: 11/14 PASS; candidate blocked

Detected before promotion:
1. mobile close icon could flex-shrink to 35px;
2. authenticated bootstrap held the global boot screen until contacts finished loading, so the intended workspace loading state never rendered;
3. the 320px sheet assertion measured the 340ms enter transform instead of the settled layout.

Corrections are bounded to those findings: fixed 44px icon geometry, render workspace loading after authenticated session resolution, and measure dialog geometry after its enter transition settles. No functional criterion was removed or weakened.

## Required final gate
Render and verify at:
`1440×1000`, `1024×768`, `768×1024`, `390×844`, `360×800`, `320×568`.

Also verify long names/email/next-action, empty workspace, 100/100 Free limit, network error/retry, loading, auth, editor sheet, touch targets and horizontal overflow.

`FINAL_VISUAL_QA=PENDING`
