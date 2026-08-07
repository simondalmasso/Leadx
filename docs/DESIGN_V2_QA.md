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

Corrections were bounded to those findings: fixed 44px icon geometry, render workspace loading after authenticated session resolution, and measure dialog geometry after its enter transition settles. No functional criterion was removed or weakened.

## Final automated gate
Run `31200535102`, job `92939204758`, source `d3299e041e81235d1134f437a62e41201969ad01`:
- workflow conclusion: PASS
- install frozen dependencies: PASS
- build: PASS
- public product contracts: PASS
- typecheck: PASS
- Worker syntax: PASS
- legacy active runtime: ABSENT
- Wrangler dry-run: PASS
- local production preview: PASS
- multi-breakpoint visual QA: PASS
- static preview/evidence upload: PASS

Artifact:
- ID: `9002729241`
- digest: `sha256:51cd1a64bedc485517b11a82e75d24faefb3aafffcc6418f88a30c0176f53027`
- retention: 3 days

## Breakpoint and state evidence
Rendered and verified at:
- `1440×1000`: PASS
- `1024×768`: PASS
- `768×1024`: PASS
- `390×844`: PASS
- `360×800`: PASS
- `320×568`: PASS

Additional synthetic-state QA:
- long name: PASS
- long email: PASS
- long next action: PASS
- workspace mobile: PASS
- editor mobile 390: PASS
- editor 320: PASS
- empty workspace: PASS
- Free 100/100 limit: PASS
- network error + retry surface: PASS
- workspace loading: PASS
- auth mobile: PASS
- visible mobile touch targets >=44px: PASS
- horizontal overflow: PASS / none detected

## Manual visual review
The final artifact was downloaded and inspected after CI, not inferred from DOM assertions alone. Landing, hero, statement, demo ledger, KPI strip, filters, pricing, workspace desktop/mobile, auth, editor and explicit empty/error/loading/limit states were reviewed as rendered images.

Result: hierarchy, line breaks, spacing rhythm, long-content behavior, responsive recomposition and accent restraint are coherent with one Signal Desk system. No material visual defect was found that justifies another candidate iteration.

`FINAL_VISUAL_QA=PASS`
`PRODUCTION_CHANGED=NO`
`DEPLOY_EXECUTED=NO`
