# Handoff — UX/UI Audit & Implementation Plan
**Branch:** `isaac/brand-ui`
**Audit date:** 2026-05-13
**Auditor:** Claude Code (read-only, no product code changed)

---

## 1. Current Prototype Summary

The Lovable prototype is a TanStack Start (React) app with Supabase, deployed on Cloudflare Workers. It has a working end-to-end flow: paste transcript → Claude extracts tasks → agent sends kickoff emails via Resend → token-based reply links flip task state. The UI shell is built on shadcn/ui primitives, uses Inter for both sans and mono type, and ships with a dark color scheme (#1a1a1a background, #2d2d2d cards, #00704a primary green). State management is minimal — local React state + direct Supabase calls.

**Stack confirmed:**
- TanStack Router (file-based), TanStack Start (SSR), Bun
- shadcn/ui component set (full suite already installed)
- Tailwind v4 with CSS custom properties
- Supabase: workspaces, members, projects, tasks, agent_log, reply_tokens tables
- Claude API (claude-sonnet-4-20250514) for extraction
- Resend for email delivery
- Cloudflare Workers deployment target

---

## 2. Screens Found in the Lovable Prototype

| Route | Name | Purpose |
|---|---|---|
| `/` | Team | Add/remove workspace members with org-chart data |
| `/projects` | Projects list | Grid of all projects, link to create new |
| `/projects/new` | New project | Name, description, member picker — then redirects to Extract |
| `/projects/:id/extract` | Extract | Paste transcript, pick attendees, run Claude, review/edit tasks, Activate |
| `/projects/:id/agent` | Agent | Live task state view, send kickoff emails, task editing |
| `/projects/:id/report` | Report | Completion %, by-owner progress bars, blocked count |

**No landing page.** No reasoning transparency panel. No weekly report view. No login/auth screens (auth middleware exists in the integration layer but no UI).

---

## 3. UX Strengths

1. **Clean information hierarchy.** The mono-label / large-heading / muted-body rhythm (`text-[10px] uppercase tracking-wider` / `text-3xl font-semibold` / `text-sm text-muted-foreground`) is well-executed and directly reusable.
2. **Extract flow is solid.** Two-step — paste transcript + confirm attendees — then click once to run Claude. The clustered task output with source quotes is exactly right for the demo.
3. **TaskCard is well-designed.** Priority badge, state badge, source quote with left border accent, inline owner/deadline/priority controls — all coherent. This component should be kept and extended, not replaced.
4. **ExtractionProgress component.** Animated progress bar with named stages gives the AI extraction a sense of work being done. Good demo moment.
5. **Sticky Activate CTA.** Fixed bottom bar with "Activate agent — send kickoff emails" is the right interaction model for the demo's climactic moment.
6. **Semantic color tokens already defined.** `--warn`, `--info`, `--destructive`, `--primary` are all in place. The color intent is correct (green = action, amber = risk, red = blocked/high, blue = info).
7. **Demo data ready.** `DEMO_ATTENDEES` and `DEMO_TRANSCRIPT` exist in `src/lib/demo.ts` with a realistic fictional company (Northbeam NL). "Load demo" button is wired in.
8. **agent_log table exists** with `reasoning`, `direction`, `message_type`, `content` columns — the data substrate for the reasoning transparency panel is already modeled.

---

## 4. UX Weaknesses

1. **Dark theme contradicts the design goal.** The prototype is fully dark (#1a1a1a). The brief asks for a "calm, modern operations cockpit" with "light neutral surfaces." Dark makes it feel like a dev tool, not a trustworthy business product.
2. **Agent view is a flat task list — not a cockpit.** The current `/agent` screen is just TaskCards in a vertical stack. There is no reasoning panel, no communication timeline, no evidence that the agent is alive. This is the most critical gap.
3. **Reasoning transparency panel does not exist.** The `agent_log.reasoning` column is there, but nothing reads or displays it. The demo cannot show the agent "thinking."
4. **Weekly report is a stub.** The Report screen shows completion % and per-owner progress bars. It has no timeline, no message log, no blocked-reason detail, no weekly narrative. It reads like a placeholder.
5. **Landing page is absent.** There is no marketing/onboarding page. Demo visitors land directly in the app with no context about what Handoff does.
6. **Team setup screen is the root route.** `/` is the member management form — an administrative screen. For a demo, this is the wrong first impression.
7. **"New project" form is redundant for the demo flow.** The Extract screen already creates the project inline on Activate. The separate `/projects/new` route adds a detour. For the demo it should be cut or made optional.
8. **No visual brand.** The sidebar logo is a 2px green square and the word "Handoff." No wordmark, no visual identity, no favicon differentiation.
9. **`font-mono` is overridden to `font-sans`.** The CSS file contains a global override that maps `.font-mono` to Inter. This means the mono aesthetic is fake — it cannot be switched to a real monospace for code/log views without reverting this override. This is intentional in Lovable's template but will be a constraint.
10. **Sidebar hides/shows sections based on route** in a way that can be disorienting — workspace nav disappears when inside a project. For a demo this creates confusion about where you are.
11. **No mobile consideration.** Layout is desktop-first. No tested breakpoints below `md`. The sticky footer CTA will overlap content on small screens.
12. **Accessibility gaps.** No skip-links, no focus ring visible on cards, `aria-invalid` only on email field, no live regions for extraction progress announcements.

---

## 5. Recommended Information Architecture

```
/ (landing)               — public, explains Handoff, CTA to enter app
/app                      — authenticated shell
  /app/extract            — primary entry: paste transcript, run Claude
  /app/projects           — project history list
  /app/projects/:id       — project shell (breadcrumb)
    /app/projects/:id/extract   — re-extract / edit tasks
    /app/projects/:id/agent     — MAIN VIEW: agent cockpit + reasoning panel
    /app/projects/:id/report    — weekly report
  /app/team               — member management (secondary, not root)
```

For the demo, navigation should be simplified to a single persistent sidebar with: Extract (primary), Agent, Report, Team. The demo always starts at Extract and flows right.

---

## 6. Recommended Demo Flow

1. **Landing page** — visitor reads the 1-sentence value prop, clicks "See it in action."
2. **Extract screen** — transcript and attendees are pre-filled via "Load demo." Visitor clicks "Extract tasks." ExtractionProgress plays. Tasks appear with clusters, priorities, source quotes.
3. **Review tasks** — visitor sees 6 tasks across 3 clusters. One is HIGH priority. Source quotes give provenance. Visitor changes one owner to demonstrate editability.
4. **Activate** — sticky CTA fires. Toast: "Kickoff emails sent to 5 people covering 6 tasks." View transitions to Agent.
5. **Agent view (cockpit)** — task list on the left, reasoning timeline on the right. One task already shows "Email sent — awaiting reply." A second task (seeded) shows a blocked reply with agent's parsed response and escalation reasoning. The reasoning panel is the demo's "wow moment."
6. **Report screen** — 33% completion, 1 blocked, weekly narrative text, per-owner breakdown. Clean, printable.

---

## 7. Recommended Visual Direction

**Theme: light neutral operations cockpit**

| Token | Old (dark) | New (light) |
|---|---|---|
| `--background` | `#1a1a1a` | `#f8f8f7` (warm off-white) |
| `--foreground` | `#ececec` | `#18181b` |
| `--card` | `#2d2d2d` | `#ffffff` |
| `--border` | `#3d3d3d` | `#e4e4e7` |
| `--muted` | `#2d2d2d` | `#f4f4f5` |
| `--muted-foreground` | `#9b9b9b` | `#71717a` |
| `--primary` | `#00704a` | `#16a34a` (confident green) |
| `--destructive` | `#c0392b` | `#dc2626` |
| `--warn` | `#c08a2b` | `#d97706` |
| `--info` | `#5a8aa8` | `#2563eb` |
| `--sidebar` | `#1a1a1a` | `#f4f4f5` |
| `--sidebar-border` | `#3d3d3d` | `#e4e4e7` |

**Typography:**
- Keep Inter for all body text.
- Remove the `.font-mono` override that maps it to Inter. Use `font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace` for the reasoning panel log, agent event timestamps, and token/ID display only.
- The mono-uppercase label pattern (`text-[10px] uppercase tracking-widest`) is a strong visual motif — keep it but adjust tracking from `tracking-[0.18em]` to `tracking-widest` for consistency.

**Spacing and radius:**
- Keep the current `--radius: 0.5rem` (8px). It reads as precise, not rounded.
- Cards use a single 1px border on a white surface — this is cleaner than the dark card on dark background.

**Status semantics:**
- Green (#16a34a) — done, active, positive
- Amber (#d97706) — medium priority, warning, pending
- Red (#dc2626) — high priority, blocked, destructive
- Blue (#2563eb) — info, in_progress, communication events
- Zinc (#71717a) — muted, low priority, metadata

---

## 8. Agent View Layout

The Agent view is the most important screen. It must show the agent as alive and auditable.

**Recommended layout (1280px+):**

```
┌─────────────────────────────────────────────────────────────────────┐
│  HEADER: Project name  •  "6 tasks"  •  "Agent active"  pill       │
├───────────────────────────────┬─────────────────────────────────────┤
│  TASK LIST (left, ~55%)       │  REASONING PANEL (right, ~45%)      │
│                               │                                     │
│  [Cluster label]              │  ┌─ Event timeline ───────────────┐ │
│  ┌─ TaskCard ──────────────┐  │  │  10:02  Kickoff sent → Maya   │ │
│  │ HIGH  in_progress       │  │  │  10:14  Reply received         │ │
│  │ Ship onboarding to stag │  │  │         "I'm blocked on legal" │ │
│  │ "Sam: I'll ship by Fri" │  │  │  10:14  Agent reasoning ▼     │ │
│  │ Owner: Sam  Due: Fri    │  │  │  ┌─ Reasoning block ────────┐  │ │
│  └─────────────────────────┘  │  │  │ Parsed intent: blocked   │  │ │
│                               │  │  │ Escalation: → Maya       │  │ │
│  ┌─ TaskCard ──────────────┐  │  │  │ Response drafted: ...    │  │ │
│  │ MEDIUM  blocked         │  │  │  └──────────────────────────┘  │ │
│  │ Send pricing copy       │  │  │  10:15  Escalation sent → Maya │ │
│  │ Owner: Daan  Due: Mon   │  │  └────────────────────────────────┘ │
│  └─────────────────────────┘  │                                     │
│                               │  Selected task: Sam — onboarding    │
│  ...                          │  [View email thread]                │
└───────────────────────────────┴─────────────────────────────────────┘
│  FOOTER: "Activate agent — send kickoff emails"  [button]           │
└─────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- Clicking a TaskCard on the left focuses the reasoning panel to show only that task's event timeline.
- Default view shows all events in reverse-chronological order across all tasks.
- Blocked tasks pulse amber in the task list.
- A small "live" badge (green dot, animated pulse) in the header shows the agent is running.

**Below 1024px (tablet):** Stack layout — task list full-width on top, reasoning panel in an expandable drawer below.

---

## 9. Reasoning Transparency Panel Requirements

The reasoning panel reads from `agent_log` which has: `task_id`, `direction` (inbound/outbound), `message_type` (kickoff, reply, escalation, follow_up), `content`, `reasoning`, `sent_at`, `reply_received_at`.

**UI requirements:**

1. **Event timeline component** — vertically stacked events, newest at top. Each event shows:
   - Timestamp (relative: "3 min ago" + absolute on hover)
   - Direction icon: outbound arrow (blue) or inbound arrow (green)
   - Message type label: `KICKOFF` / `REPLY` / `ESCALATION` / `FOLLOW-UP`
   - Content preview (first 80 chars, expandable)
   - If `reasoning` is non-null: a collapsible "Agent reasoning" block with the full reasoning text in a mono font, light amber/amber-50 background to visually distinguish AI thought from human content.

2. **Reasoning block design:**
   - Background: `amber-50` (#fffbeb) with `amber-200` border
   - Label: `AGENT REASONING` in mono uppercase
   - Font: monospace, 12px, zinc-700
   - Expand/collapse toggle
   - Never truncate reasoning — the point is auditability

3. **Status badge on panel header:** "3 events · 1 blocked · last update 3 min ago"

4. **Empty state:** When no agent_log entries exist, show: "Agent is standing by. Activate to send kickoff emails and start tracking replies." with a subtle illustration or icon.

5. **Seeded demo data** (Bobbie's job): At least 1 kickoff event, 1 inbound blocked reply, 1 reasoning block with escalation decision, 1 outbound escalation to the project lead — pre-seeded in the database for the demo project.

---

## 10. Weekly Report UI Requirements

The current Report screen shows completion % and per-owner bars. This needs to become a proper weekly report.

**Required sections:**

1. **Report header** — "Week of [date range]" · Project name · "Generated by Handoff agent"
2. **Headline stats row** — 4 stat tiles: Total tasks, Done %, Blocked, Avg response time (hours)
3. **Task completion chart** — simple horizontal stacked bar or sparkline showing done/in_progress/blocked/pending distribution. Use the existing shadcn `chart` component (already installed).
4. **By-owner breakdown** — existing progress bar rows are good. Add: owner name, avatar initials (2 chars in a colored circle), task count, done/blocked split, days since last reply.
5. **Blocked items list** — a dedicated section listing all blocked tasks with the block reason (from `agent_log.content` where `message_type = 'reply'` and the reply indicates blocked). This is the most actionable part of the report.
6. **Agent activity log** — condensed list of all outbound messages sent this week, grouped by day.
7. **Weekly narrative** — a 2–3 sentence auto-generated summary of the week's progress (Chip exposes this from backend as a string field; see Section 13).
8. **Print / export button** — in the header. Can be `window.print()` for now; styling via `@media print`.

**Visual note:** The Report should feel like something you'd forward to a stakeholder. Light background, generous whitespace, clear section dividers, no dev-tool aesthetic.

---

## 11. Landing Page Recommendation

The landing page (`/`) should be a single-screen marketing page, not a full site. Its only job is to explain Handoff in 10 seconds and get the demo visitor into the app.

**Structure:**
```
┌─ Nav ────────────────────────────────────────┐
│  [Handoff logo]              [Enter app →]   │
└──────────────────────────────────────────────┘

┌─ Hero ───────────────────────────────────────┐
│                                              │
│  The meeting ended.                          │
│  Now Handoff chases the work.                │
│                                              │
│  [See it in action →]   (primary CTA)        │
│                                              │
│  ── or paste your transcript to start ──     │
│  [Transcript textarea, abbreviated]          │
│                                              │
└──────────────────────────────────────────────┘

┌─ 3-step explainer ───────────────────────────┐
│  01 Paste transcript → 02 Extract tasks →    │
│  03 Agent chases to done                     │
└──────────────────────────────────────────────┘
```

**Implementation notes:**
- The hero CTA links to `/projects/new/extract` with the demo pre-loaded, not a sign-up wall.
- No auth required for the buildathon demo.
- Wordmark: "Handoff" in a slightly heavier weight (font-semibold, tracking-tight, possibly with a green dot separator).
- Keep the page under 60kb total. No animations that block the demo flow.

---

## 12. Mobile/Responsive Considerations

| Screen | Breakpoint strategy |
|---|---|
| Landing | Single-column hero, CTA stacked below headline. Works at 375px. |
| Extract | Transcript textarea full-width, attendee picker in a collapsible. Works at 768px. |
| Task list | TaskCard already uses `md:grid-cols-[1fr_280px]` — collapses to single column below md. Keep. |
| Agent view | Stack: task list full-width, reasoning panel in a bottom sheet/drawer (use shadcn `Drawer`). |
| Report | Single column below md. Stats wrap to 2x2 grid. Bars remain. |
| Sidebar | Already collapsible (`collapsible="offcanvas"`). Add a proper mobile hamburger trigger in the top nav. |

**Critical fix:** The sticky footer CTA (`fixed inset-x-0 bottom-0`) overlaps content on mobile. Add `pb-20` to the main scroll container when the footer is visible.

---

## 13. Accessibility Considerations

| Issue | Fix |
|---|---|
| No skip-link | Add `<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>` in `__root.tsx` |
| ExtractionProgress not announced | Add `aria-live="polite"` to the stage label span |
| Focus ring missing on cards | Add `focus-visible:ring-2 focus-visible:ring-primary` to interactive card elements |
| TaskCard edit fields | The inline `<Input>` for task_text has no visible label — add `aria-label="Task description"` |
| Color-only status | Priority and state badges use color + text (good). Keep text labels — don't remove them in redesign. |
| Reasoning panel | Agent reasoning blocks should have `role="region" aria-label="Agent reasoning"` |
| Progress bar | Add `role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}` to ExtractionProgress |

---

## 14. Suggested Component Inventory

### Keep (minor polish only)
- `TaskCard` — strong, extend with blocked/done visual states and a "view thread" link
- `ExtractionProgress` — keep the animation, add `aria-live`
- `AppSidebar` / `AppLayout` — restructure nav items, apply light theme
- All `src/components/ui/*` shadcn primitives — full set already installed
- `ExtractionPage` header copy: "End the meeting. Hand off the work." — keep verbatim

### Extend
- `app-sidebar.tsx` — add Handoff wordmark with green accent dot, add landing/team nav items
- `styles.css` — switch to light theme token values (see Section 7), restore true monospace for `font-mono`

### Build new
| Component | File | Priority |
|---|---|---|
| `ReasoningTimeline` | `src/components/reasoning-timeline.tsx` | P0 — demo critical |
| `ReasoningBlock` | `src/components/reasoning-block.tsx` | P0 — demo critical |
| `AgentCockpitLayout` | `src/routes/projects.$projectId.agent.tsx` | P0 — full rewrite of agent screen |
| `WeeklyReportPage` | `src/routes/projects.$projectId.report.tsx` | P1 — substantial rewrite |
| `LandingPage` | `src/routes/index.tsx` (replace TeamPage) or `src/routes/landing.tsx` | P1 |
| `HandoffWordmark` | `src/components/handoff-wordmark.tsx` | P1 |
| `BlockedItemsList` | `src/components/blocked-items-list.tsx` | P1 |
| `OwnerProgressRow` | `src/components/owner-progress-row.tsx` | P2 |
| `StatTile` | `src/components/stat-tile.tsx` | P2 — extract from inline Stat functions |
| `TeamPage` (relocated) | move `/` → `/team` | P2 |

---

## 15. What Isaac Should Build First

**Week 1, in order:**

1. **Light theme token swap in `styles.css`** — single file change, immediately transforms the whole app. Unblock all visual review. (~30 min)
2. **Handoff wordmark component + sidebar polish** — replace the 2px square with a real mark, fix nav structure. (~1 hr)
3. **`ReasoningTimeline` + `ReasoningBlock` components** — build with static/hardcoded props first so Chip can wire real data later. This is the demo's most important UI. (~3 hrs)
4. **Agent view cockpit layout** — split-pane, task list left + reasoning panel right, selected-task interaction, blocked task visual states, live agent badge. (~2 hrs)
5. **Landing page** — hero copy, 3-step explainer, CTA to demo. (~1 hr)
6. **Weekly report improvements** — blocked items section, weekly narrative text area, chart, print layout. (~2 hrs)
7. **Accessibility pass** — skip link, aria-live on progress, focus rings, aria-label on task inputs. (~1 hr)

---

## 16. What Chip Needs to Expose from Backend for UI

| UI need | Backend work |
|---|---|
| Reasoning timeline | `GET /api/agent-log?projectId=` returning `agent_log` rows ordered by `sent_at` desc |
| Reasoning text | Ensure `agent_log.reasoning` is populated when the agent parses a reply and decides to escalate |
| Blocked reason | When a reply is parsed as "blocked", store the parsed reason text in `agent_log.content` for the inbound row |
| Weekly narrative | A `project_summary` field or a separate endpoint that returns a generated 2-3 sentence week-in-review string |
| Avg response time | Derivable from `agent_log.sent_at` (outbound) + `agent_log.reply_received_at` (inbound); expose as a computed field or let UI calculate from raw rows |
| Real-time updates | Supabase Realtime subscription on `agent_log` and `tasks` tables so the agent view reflects incoming replies without refresh — expose a channel name or use the existing `supabase` client's `.channel()` API |
| Demo seed data | At minimum: 1 project with 6 tasks, at least 3 `agent_log` entries (1 kickoff outbound, 1 blocked inbound with reasoning, 1 escalation outbound) pre-loaded for the demo |

---

## 17. What Bobbie Needs to Provide for Demo Content

| Asset | Detail |
|---|---|
| Fictional company name + domain | Currently `northbeam.nl` — confirm or update |
| 5 fictional attendee full names + email addresses | Already started in `src/lib/demo.ts` (Maya, Sam, Lotte, Daan, Priya) — confirm these |
| Demo transcript (final version) | Current transcript in `demo.ts` is good but should be polished for the demo script — Bobbie owns the final copy |
| 6 extracted task texts (final) | Should match what Claude extracts from the final transcript — Bobbie to run the demo once and lock the task list |
| Blocked reply copy | The email Sam sends back saying he's blocked — used in the seeded `agent_log` inbound row |
| Agent reply to blocked | The agent's drafted response to Sam — used in seeded `agent_log` outbound row |
| Escalation email copy | The escalation to Maya — used in seeded `agent_log` escalation row |
| Reasoning text (1 example) | What the agent "thinks" when parsing Sam's blocked reply — Bobbie drafts, Chip seeds into `agent_log.reasoning` |
| Weekly narrative text | 2-3 sentence "this week in Northbeam Q2 launch" paragraph for the Report screen |
| GDPR/Q&A copy | For the landing page footer if needed |

---

## 18. Explicit Non-Goals for Now

- **Authentication / login screens** — auth middleware exists but UI auth is out of scope for the buildathon demo.
- **WhatsApp/Twilio UI** — the agent sends via WhatsApp but there is no WhatsApp-specific UI to design. The reasoning panel shows the message content regardless of channel.
- **Multi-workspace support** — the DB supports it but the UI hardcodes `DEFAULT_WORKSPACE_ID`. Keep the hardcode.
- **Dark mode toggle** — switch to light only. Dark mode parity is a post-buildathon concern.
- **Onboarding wizard** — no multi-step setup flow. Demo users land in Extract.
- **Bulk task operations** — no multi-select, no bulk status update.
- **Search / filter** — no search across projects or tasks.
- **Notifications / inbox** — no in-app notification center.
- **Custom email templates** — Resend integration exists; template editing UI is out of scope.
- **Payment / billing** — not applicable.
- **i18n** — English only.
- **`/projects/new` form redesign** — this route is not on the demo critical path. Leave it functional but don't spend time polishing it.

---

## Safety Confirmation

- No Form Identity project files were read or modified.
- No product code in `/Users/isodaramji/Desktop/buildathon/handoff-src` was changed.
- No `.env` file contents were read or printed. The `.env` file in the zip was detected and skipped.
- The Lovable prototype was extracted only to `/private/tmp/handoff-lovable-audit` and was not copied into the buildathon repo.

---

*End of audit plan. This document is planning-only. No implementation was performed.*

---

## Autoplan Phase 1 — CEO Review

*Generated by /autoplan on 2026-05-14*

### Premises

| # | Premise | Source | Status |
|---|---|---|---|
| P1 | Demo is fully scripted — fictional company (Northbeam NL), no real customer data required | Isaac's pivot on Day 1 | Uncontested |
| P2 | Isaac implements via Lovable (prompt-based AI codegen), not direct file editing | Isaac's tool choice confirmed | **User Challenge — see gate** |
| P3 | The agent view / reasoning panel is the judge "wow moment" — highest design priority | Design doc + office-hours | Auto-confirmed |
| P4 | `agent_log` table exists with `task_id`, `direction`, `message_type`, `content`, `reasoning`, `sent_at`, `reply_received_at` | Supabase schema audit | Confirmed |
| P5 | The 7-item build order (Section 15) is achievable within the buildathon window | Plan estimate ~11 hrs | Needs calibration for Lovable |
| P6 | The plan's component-level specificity (file paths, CSS tokens, aria-labels) is useful even through a Lovable prompt layer | Plan premise | **User Challenge — see gate** |

---

### CEO Consensus Table

| Dimension | Finding | Risk Level | Action |
|---|---|---|---|
| Demo reliability | No fallback exists if Activate button fails live on stage. The demo's most critical moment has no safety net. | HIGH | Chip seeds a pre-activated demo project state before demo day; Isaac ensures visual state can be shown statically |
| Lovable workflow match | Plan written at code-file level (component names, CSS properties, aria attributes). Lovable takes natural-language prompts. The translation layer is Isaac's burden — not documented. | HIGH | Reframe Isaac's build order as Lovable prompt briefs (done in Phase 2) |
| Scope calibration | Accessibility section (Section 13) is 7 items including skip-links and live regions. In a 2-day buildathon this competes with the reasoning panel, which actually wins the demo. | MEDIUM | Accessibility → P3 after reasoning panel and landing page. Defer skip-link and aria-live unless spare time exists. |
| Theme swap complexity | Token table (Section 7) covers 12 CSS variables. In Lovable, this is a prompt, not a file edit. Estimate: 10–30 min prompt iteration, not the "~30 min" stated. | LOW | Keep estimate but flag that Lovable may need 2–3 prompt rounds to get all tokens right |
| What already exists | TaskCard, ExtractionProgress, AppSidebar, shadcn suite, demo seed data, agent_log schema — all confirmed in code. No re-implementation needed. | NONE | Preserve. Build only the 7 listed new components. |
| Weekly report as closer | Section 10 (weekly report) is 8 sub-requirements including a chart, print layout, and weekly narrative. For a 5-second demo moment, this is over-specified. | LOW | Weekly report → show 3 things: headline stats, blocked items, narrative text. Chart and print are stretch goals. |

---

### Decision Audit Trail

| ID | Decision | Chosen | Rationale | Auto-decided |
|---|---|---|---|---|
| D1 | Implementation layer | Keep plan as-is, translate to Lovable prompts during build | Lovable prompts benefit from component-level specificity | Yes (presented to user at gate) |
| D2 | Accessibility scope | Defer to P3 — post reasoning panel and landing | Demo wins on wow moment, not WCAG coverage | Yes |
| D3 | Weekly report scope | Reduce to 3 sections for demo, treat rest as stretch | 5-second demo moment doesn't need 8 sections | Yes |
| D4 | Demo fallback | Chip seeds a pre-Activated project state | Insurance against live Activate failure | Yes (Chip's task) |

---

### What Already Exists (do not rebuild)

- TaskCard component with priority badge, state badge, source quote, inline owner/deadline controls
- ExtractionProgress animated component
- AppSidebar / AppLayout shell
- Full shadcn/ui component suite (Button, Badge, Card, Drawer, Sheet, Chart, Input, Select, Textarea, etc.)
- `src/lib/demo.ts` with Northbeam NL fictional company, 5 attendees, demo transcript
- `agent_log` Supabase table with all required columns
- `reply_tokens` table for token-based email reply links
- Tailwind v4 CSS custom property setup in `styles.css`
- Resend email delivery wired (Chip's domain)
- `DEMO_ATTENDEES` and `DEMO_TRANSCRIPT` constants with "Load demo" button

---

### Failure Modes Registry

| Failure | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Activate fails live (Resend/Supabase timeout) | Medium | Critical — kills the demo's key moment | Pre-seed an already-Activated project. If live Activate fails, switch to pre-seeded view without breaking stride. |
| Reasoning panel empty (no agent_log rows) | Medium | High — "wow moment" shows nothing | Chip seeds 3 agent_log rows into the demo project before demo day. Isaac shows seeded data, not live-generated. |
| Lovable prompt produces wrong theme | Low | Medium — app looks wrong on projector | Run theme swap prompt first (Day 1). Test on light background before any other work. Have the CSS token table ready to paste verbatim. |
| Landing page CTA broken | Low | Low — judges enter app directly anyway | Route `/` directly to `/projects/new/extract` as fallback. |
| Weekly report chart fails to render | Low | Low — 5 seconds of demo, not the wow moment | Remove chart if it doesn't render. Show stat tiles + blocked list only. |

---

### CEO Completion Summary

The plan is solid. Two workflow risks dominate: (1) Lovable translation — the plan must be consumed as prompt briefs, not file edits, and (2) demo reliability — there is no fallback for a failed Activate. Both are addressable. The scope is correctly prioritized: reasoning panel first, landing page second, report third, accessibility last. The build order (Section 15) translates cleanly to a Lovable prompt sequence.

**Recommended before Phase 2:** Confirm with Isaac how he wants the plan re-expressed — as Lovable prompts or as component specs he translates himself. This shapes how Phase 2 Design Review is written.

---

## Autoplan Phase 3 — Engineering Review

*Generated 2026-05-14. Audience: Chip. Research + writing only — no product files were modified.*

---

### 1. Backend Feasibility Assessment

| UI need | Backend work | Risk | Notes |
|---|---|---|---|
| Reasoning timeline | `GET /api/agent-log?projectId=` returning `agent_log` rows ordered by `sent_at` desc | **MEDIUM** | Shape is correct. Missing field: there is no `task_id` join back to task name/owner in the current spec. Isaac's timeline needs to show *which task* each event belongs to. Add `task_text` and `task_owner` to the response (join from `tasks` table) or the UI must do a second fetch per event — which is a waterfall that will break on demo day. |
| Reasoning text | `agent_log.reasoning` populated on reply-parse + escalation | **HIGH** | This column exists in the schema but there is no confirmed code path that actually writes to it. If the agent parses Sam's reply and escalates without writing `reasoning`, the panel's "wow moment" shows nothing. Chip must add an explicit `reasoning` write in the reply-handler before anything else. |
| Blocked reason | `agent_log.content` for inbound blocked rows | **LOW** | Shape is correct. Risk: if Chip stores the raw email body instead of the *parsed* blocked reason, Isaac will display a wall of email text. Store the extracted one-liner ("blocked: waiting on legal sign-off from Maya"), not the full email. |
| Weekly narrative | `project_summary` field or separate endpoint | **MEDIUM** | This endpoint/field does not yet exist per the plan. Isaac needs a string — even a hardcoded one — at `GET /api/projects/:id/summary` or as a `summary` field on the project row. For the demo, this can be pre-written by Bobbie and stored as a static DB value; no Claude generation required at runtime. |
| Avg response time | Computed from `sent_at` (outbound) + `reply_received_at` (inbound) | **LOW** | The raw timestamps are sufficient; Isaac can compute `avg((reply_received_at - sent_at))` client-side from the agent_log rows. No new endpoint needed. Risk: `reply_received_at` must actually be written when a reply webhook fires — confirm this write exists. |
| Real-time updates | Supabase Realtime subscription on `agent_log` + `tasks` | **MEDIUM** | See Section 3 below for the full reliability assessment. The API shape (using the existing `supabase` client's `.channel().on('postgres_changes', ...)`) is correct. No new backend work needed beyond ensuring RLS policies allow the subscription. |

**Most critical missing piece:** `agent_log.reasoning` is not confirmed to be written by any existing code path. This blocks the entire reasoning panel. Chip must fix this first.

**Second missing piece:** No `task_text`/`task_owner` join on the agent-log endpoint. Without it, Isaac's timeline cannot label events by task — the panel shows a list of undifferentiated messages with no context.

---

### 2. Demo Seed Data Spec

Chip must run this seed before demo day. These are the exact strings — do not leave as placeholders.

#### Project

```
id:          'demo-northbeam-q2'           (hardcode this in demo mode)
name:        'Northbeam NL Q2 Launch'
workspace:   DEFAULT_WORKSPACE_ID
status:      'active'
created_at:  '2026-05-12T09:00:00Z'
```

#### Tasks (6 rows in `tasks` table)

| # | task_text | owner | priority | status |
|---|---|---|---|---|
| 1 | Ship onboarding flow to staging | Sam | high | in_progress |
| 2 | Get legal sign-off on T&Cs | Maya | high | blocked |
| 3 | Send Q2 pricing copy to Lotte | Daan | medium | pending |
| 4 | Finalize launch email sequence | Lotte | medium | in_progress |
| 5 | Set up analytics tracking for launch | Priya | medium | pending |
| 6 | Confirm launch date with stakeholders | Maya | low | done |

Task 1 (Sam, onboarding to staging) is the one the agent is actively chasing — all agent_log rows below reference this task's ID.

#### agent_log rows (4 rows, in order)

**Row 1 — Kickoff outbound to Sam**
```
task_id:          <task 1 id>
direction:        'outbound'
message_type:     'kickoff'
content:          'Hi Sam — following up on the Northbeam Q2 kickoff. You\'re down to ship the onboarding flow to staging by Friday. Can you confirm you\'re on track, or flag any blockers?'
reasoning:        null
sent_at:          '2026-05-13T10:02:00Z'
reply_received_at: null
```

**Row 2 — Inbound reply from Sam (blocked)**
```
task_id:          <task 1 id>
direction:        'inbound'
message_type:     'reply'
content:          'blocked: waiting on legal sign-off from Maya before I can finalize the onboarding copy and push to staging'
reasoning:        null
sent_at:          null
reply_received_at: '2026-05-13T10:14:00Z'
```

**Row 3 — Agent reasoning block**
```
task_id:          <task 1 id>
direction:        'outbound'
message_type:     'escalation'
content:          'Hi Maya — Sam is blocked on shipping the onboarding flow to staging and is waiting on your legal sign-off on the T&Cs. The launch is Friday. Can you unblock this today?'
reasoning:        'Sam\'s reply indicates a hard dependency on Maya\'s legal sign-off before he can push to staging. This is a cross-owner blocker — Sam cannot resolve it independently. Task deadline is Friday (2 days). Escalation threshold met: blocked reply + deadline within 72h. Action: escalate to Maya (project lead, already owns the T&Cs task). Draft escalation email referencing both tasks so Maya has full context.'
sent_at:          '2026-05-13T10:15:00Z'
reply_received_at: null
```

Note: Row 3 combines the reasoning + the escalation outbound into a single row. The `reasoning` column explains the decision; `content` is the email sent to Maya. The direction is `outbound` and message_type is `escalation`.

**Row 4 — Follow-up to Sam (acknowledgement)**
```
task_id:          <task 1 id>
direction:        'outbound'
message_type:     'follow_up'
content:          'Hi Sam — I\'ve flagged Maya directly to get the legal sign-off unblocked. I\'ll update you as soon as she responds. Hang tight.'
reasoning:        null
sent_at:          '2026-05-13T10:15:30Z'
reply_received_at: null
```

This 4th row makes the reasoning panel show a complete arc: kickoff → reply → escalation decision (with reasoning) → Sam acknowledgement. Four timeline events, one with a visible reasoning block — exactly the demo's "wow moment."

---

### 3. Real-time vs. Polling Decision

**Recommendation: poll every 5 seconds for the demo. Do not use Supabase Realtime.**

**Rationale:**

Supabase Realtime requires:
1. WebSocket connection that survives network switching (conference Wi-Fi is notoriously unreliable)
2. Row-Level Security policies configured to allow the subscription — if these are wrong, the channel silently fails with no error surfaced in the UI
3. The `postgres_changes` listener requires `REPLICA IDENTITY FULL` set on the tables, which is a Supabase project setting that may not be enabled by default on the free tier

For a 10-minute hackathon demo, any one of these can fail silently. A polling approach (`setInterval(() => refetch(), 5000)`) has none of these dependencies — it's just a fetch. If the fetch fails, you see an error. If Realtime fails, the UI freezes with no indication.

**Implementation for Isaac (5-second polling):**
```ts
// In AgentCockpitLayout, after mount:
useEffect(() => {
  const interval = setInterval(() => {
    refetchAgentLog()   // TanStack Query invalidation or direct supabase fetch
    refetchTasks()
  }, 5000)
  return () => clearInterval(interval)
}, [])
```

Add a "Last updated X seconds ago" timestamp in the panel header so judges can see it's live without needing to explain.

If Chip has already confirmed that Realtime is configured and tested end-to-end on the demo project, keep it — but have the polling fallback ready as a one-line swap.

---

### 4. Critical Path for Chip

Timeline: May 14–17 (prep), May 18–19 (buildathon). Chip has approximately 3 days of focused work before the event, plus the buildathon itself.

**Priority order:**

| # | Task | Why this order | Time estimate |
|---|---|---|---|
| 1 | Write `agent_log.reasoning` in reply-handler | Blocks the entire reasoning panel — Isaac cannot test anything without this | 2–3 hrs |
| 2 | Seed demo database (all 4 rows + 6 tasks + project) | Unblocks Isaac's UI testing immediately; he needs real DB rows to develop against | 1–2 hrs |
| 3 | `GET /api/agent-log?projectId=` with task join | Isaac's panel fetches this endpoint; without it he's building against a mock | 2 hrs |
| 4 | Confirm `reply_received_at` is written on webhook | Required for avg response time to be non-null and for the timeline to show arrival timestamps | 1 hr |
| 5 | Add `project_summary` string to project row or endpoint | Weekly report's narrative text; can be a static Bobbie-written string in DB — no generation required | 1 hr |
| 6 | Confirm RLS policies allow `agent_log` + `tasks` reads without auth | Isaac's UI fetches without a logged-in user (no auth in demo) — if RLS blocks this, all data fetches fail silently | 1 hr |

**What Chip should NOT spend time on before the buildathon:**
- Supabase Realtime configuration (replaced by polling per Section 3)
- WhatsApp/Twilio UI integration (out of scope per Section 18)
- Multi-workspace logic (hardcoded in demo)

**On buildathon day (May 18):** Chip's job is to keep the agent actually running — watch for Resend/Twilio errors, monitor reply webhooks, re-seed if demo data gets corrupted. Isaac owns the UI; Chip owns the backend plumbing staying alive.

---

### 5. Risks to Isaac's UI Build — Dependency List

Isaac cannot test certain UI components until Chip has shipped specific backend work. This is the exact dependency map:

**"Chip must ship X before Isaac can test Y"**

| Chip must ship | Isaac is blocked on |
|---|---|
| Task 1: `agent_log.reasoning` written on reply-parse | Reasoning block component — Isaac can build the component with hardcoded props, but cannot verify it shows real data |
| Task 2: Demo DB seeded (4 agent_log rows + 6 tasks) | The entire reasoning timeline — without rows, the panel hits the empty state and Isaac cannot review layout, timestamps, expand/collapse, or the blocked-reply styling |
| Task 3: `GET /api/agent-log?projectId=` with task join | Wiring `ReasoningTimeline` to real data — Isaac can build the component but cannot connect it |
| Task 4: `reply_received_at` written on webhook | The "avg response time" stat tile in the weekly report — shows `NaN hrs` or `0 hrs` without this |
| Task 5: `project_summary` string on project row | The weekly narrative section in the report — Isaac shows a hardcoded placeholder until this exists |
| Task 6: RLS open for demo project | **All data fetches** — if RLS blocks unauthenticated reads, the app shows empty state everywhere and Isaac cannot develop at all |

**Concrete ask from Isaac to Chip:** Before Isaac writes a single Lovable prompt for the reasoning panel, he needs Chip to confirm two things in a Slack/Discord message:

1. "Demo DB seeded — project ID is `[id]`" — so Isaac can hardcode this in demo mode
2. "RLS is open on agent_log and tasks for the demo workspace" — so Isaac's fetches don't silently return empty arrays

Without these two confirmations, Isaac is building blind. Everything else (task join, reasoning text, response timestamps) can be validated during the buildathon itself once the UI shell exists.

---

*End of Phase 3 Engineering Review.*

---

## Autoplan Phase 2 — Design Review

*Generated by /autoplan on 2026-05-14. Research and writing only — no product files were modified.*

---

### 7-Dimension Analysis

---

**1. Visual Hierarchy — the ASCII layout spec (Section 8)**

The layout spec is structurally correct: header stripe → two-pane split → footer CTA. The hierarchy intention is clear. The most likely Lovable failure is column width collapse. Lovable tends to interpret percentage splits (55/45) as equal halves or as a simple flex row where the right pane shrinks to fit content rather than holding its width. When the reasoning panel has only one or two events, Lovable will let it compress to ~200px — making the layout feel lopsided and hiding the "wow moment" behind wasted whitespace. The fix is to force `min-w-0` on the left pane and an explicit `min-w-[380px]` or `w-[45%] flex-shrink-0` on the right. The prompt must state these constraints explicitly; the ASCII diagram alone will not survive Lovable's layout interpretation.

Secondary risk: the footer CTA (`fixed inset-x-0 bottom-0`) will overlap the bottom of the task list unless the main scroll container has explicit `pb-20`. Lovable frequently forgets this padding when it generates sticky footers.

---

**2. Brand Coherence — "calm operations cockpit" across all screens**

The visual direction holds well on the Extract screen (clean form, white card, green CTA) and the Agent view (structured split pane). The breaks will happen at two points.

First, the Team screen. It is currently a form-heavy admin view with an org-chart structure. Nothing in the prompt scripts or the plan addresses restyling the Team screen. After the light theme swap, the team screen will have the right token colors but its layout density and component choices (possibly a table or stacked list) will feel like a different product. It will look like a re-skinned dark tool rather than the cockpit aesthetic.

Second, the Report screen. The plan calls for stat tiles, a blocked list, and a weekly narrative. These three elements have very different visual weights. Stat tiles are scannable; the blocked list is dense; the narrative is prose. Without explicit spacing and section divider specs in the prompt, Lovable will compress them together with inconsistent vertical rhythm. The "forward to a stakeholder" feeling Section 10 asks for requires explicit whitespace — `py-8` section breaks and a subtle `border-t border-border` between sections. The prompt must specify these or the output will feel generic.

---

**3. Demo Flow UX — the 6-step sequence (Section 6)**

The first four steps (landing → extract → review → activate) flow naturally. The attention risk is Step 5: the transition from Activate to the Agent cockpit. The judge will have been watching the extraction animation (ExtractionProgress) and then the task review list for approximately 60 seconds. When Activate fires and the view transitions to the Agent cockpit, the screen changes completely — new layout, new pane structure, new content. Without a clear visual bridge (a brief toast that says "Agent started — 6 kickoff emails sent" before navigation, or an animated route transition), judges will not register that the product just did something significant. They will see a new screen and lose the narrative thread.

The second attention drop is in the reasoning panel itself. When the judge looks at the right pane, the event timeline shows three events (kickoff → blocked reply → escalation). The most important event — the reasoning block — is collapsible and starts collapsed. If Isaac does not open it during the demo, judges will not see what makes Handoff different from a simple task tracker. The prompt for ReasoningTimeline should default the most recent reasoning block to `open` (not collapsed) so it is visible without a click.

Step 6 (Report) is safe — it is a 5-second glance, not an interaction.

---

**4. Reasoning Panel Legibility — amber-50 on projector**

This is the highest contrast risk in the build. `amber-50` (#fffbeb) on a white or near-white background (#ffffff card) produces a luminance difference of approximately 1.1:1 to 1.3:1. On a calibrated monitor this reads as a subtle warm tint. On a projector — especially in a room with ambient light, which is standard for hackathon demo stages — it will be invisible. The amber-50 block will look like a plain white box with a slightly yellowish border.

The fixes, in order of preference:

- Raise background to `amber-100` (#fef3c7) for the reasoning block. This gives visible contrast against the white card without looking garish.
- Use `amber-200` as the left border accent (4px solid left border) in addition to the fill, not instead of it. A colored left border reads clearly on projectors even when fill colors wash out.
- Set the reasoning block text to `zinc-800` (not `zinc-700` as specced) for maximum legibility on a washed-out display.

The mono font at 12px is also a projector risk. Twelve pixels of JetBrains Mono at 1280x800 projector resolution will be 9–10 effective pixels — borderline legible from 3 meters. The prompt should request `text-[13px]` minimum for the reasoning block body.

---

**5. Typography Execution — JetBrains Mono in Lovable**

The plan calls for removing the `.font-mono` override that maps mono to Inter, and restoring true monospace using `'JetBrains Mono', 'Fira Code', ui-monospace`. This is a CSS `font-family` stack in `styles.css`. The execution risk is in two parts.

First, Lovable's generated code does not guarantee external font loading. If the prompt says "use JetBrains Mono" without specifying a Google Fonts import or a `@font-face` declaration, Lovable will add the font name to the CSS stack but not import it. The browser will fall through to `ui-monospace` (system mono), which on macOS is SF Mono and on Windows is Consolas. Both are readable, but they do not look like the designed intent. The prompt must say: "Add a Google Fonts import for JetBrains Mono at the top of the CSS file" explicitly.

Second, Tailwind v4's `font-mono` utility is mapped in `theme.extend.fontFamily`. If the override that maps `font-mono` to Inter is in both `styles.css` and in the Tailwind config, removing it from one but not the other will produce inconsistent results — some mono classes will render correctly, others will not. The prompt should target both: "remove the `.font-mono { font-family: var(--font-sans); }` line from styles.css AND update the Tailwind config fontFamily.mono to use JetBrains Mono."

---

**6. Mobile/Responsive Scope — what to cut for a hackathon projector demo**

Section 12 adds six responsive specifications. For a hackathon projector demo, the only screen size that matters is 1280x800 (the near-universal conference projector resolution). A judge browsing on their phone during the demo is a secondary scenario; a judge on mobile using Handoff on their own device is not going to happen in a 3-minute pitch slot.

Cut from the Section 15 build order entirely:

- Sidebar mobile hamburger trigger (already has `collapsible="offcanvas"` — good enough)
- Agent view bottom sheet drawer for below 1024px (the tablet layout)
- Report 2x2 stat grid wrapping at mobile breakpoints

Keep for safety (low effort, high reward):

- `pb-20` fix on the main scroll container (prevents the sticky footer from eating content — affects the demo machine itself if it is a laptop with a narrow window)
- Landing page single-column hero (it is one Tailwind class; the landing page prompt should include it automatically)

Verdict: Remove the responsive work from Isaac's build order. Replace with a single line at the end of each prompt: "Ensure the layout looks correct at 1280x800 viewport width." Do not spend hackathon time on mobile breakpoints.

---

**7. Component Reuse Risk — "keep TaskCard, extend it" in Lovable**

This is the highest technical risk in the entire build order. Lovable's core behavior when given an "extend this component" prompt is to generate a new version of the component that satisfies the new prompt — often replacing internal JSX structure, removing props it does not see referenced in the prompt, and resetting styles that existed but were not mentioned. The phrase "keep TaskCard" in a Lovable prompt does not reliably prevent Lovable from rewriting the component.

The specific failure modes to expect:

- The source quote section (left border accent, `text-muted-foreground` italic) is visually quiet. Lovable tends to omit visually quiet sub-elements when rewriting a card component unless they are mentioned by name in the prompt.
- The inline owner/deadline/priority controls (Select components inside the card) are interactive elements that Lovable may replace with static text when rewriting.
- The priority badge and state badge color logic (red for high/blocked, amber for medium, green for done) is in a conditional class — Lovable often collapses this to a single color when rewriting.

Mitigation: The AgentCockpitLayout prompt (Prompt 4) should explicitly say "do NOT modify the existing TaskCard component — import it as-is and use it in the layout." The extension for blocked/pulsing amber should be expressed as "wrap TaskCard with a `ring-2 ring-amber-400 animate-pulse` border on the card's outer div when `task.state === 'blocked'`" — a wrapping concern, not an internal rewrite.

---

### Lovable Prompt Scripts

---

### Prompt 1 — Light Theme Token Swap

**Estimated Lovable iterations:** 2
**Verify success by:**
- Open the app — the background should be a warm off-white (#f8f8f7), not dark. Cards should be white with a light grey border.
- Check the sidebar — it should be light (#f4f4f5 background), not black.
- Check a primary button — it should be confident green (#16a34a), not the old dark green (#00704a).

---LOVABLE PROMPT START---
Update the app's color theme by replacing the CSS custom property values in `styles.css`. Do not change any component files — only the CSS token values.

Here are the exact before to after replacements for each token:

```
--background:         #1a1a1a  →  #f8f8f7
--foreground:         #ececec  →  #18181b
--card:               #2d2d2d  →  #ffffff
--card-foreground:    current  →  #18181b
--border:             #3d3d3d  →  #e4e4e7
--muted:              #2d2d2d  →  #f4f4f5
--muted-foreground:   #9b9b9b  →  #71717a
--primary:            #00704a  →  #16a34a
--primary-foreground: keep     →  #ffffff
--destructive:        #c0392b  →  #dc2626
--warn:               #c08a2b  →  #d97706
--info:               #5a8aa8  →  #2563eb
--sidebar:            #1a1a1a  →  #f4f4f5
--sidebar-border:     #3d3d3d  →  #e4e4e7
--sidebar-foreground: current  →  #18181b
```

Also do the following in `styles.css`:
1. Remove any line that reads `.font-mono { font-family: var(--font-sans); }` or equivalent — this override maps monospace to Inter and must be removed.
2. Add a Google Fonts import for JetBrains Mono at the very top of the file: `@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');`
3. Set the `font-mono` font stack in the theme to: `'JetBrains Mono', 'Fira Code', ui-monospace, monospace`

If there is a Tailwind config (`tailwind.config.ts` or equivalent) that overrides `fontFamily.mono`, update it to match: `mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace']`.

Do not change any component JSX. Only change CSS token values and font configuration.
---LOVABLE PROMPT END---

---

### Prompt 2 — Handoff Wordmark + Sidebar

**Estimated Lovable iterations:** 2
**Verify success by:**
- The sidebar top shows a filled green circle followed by the word "Handoff" in font-semibold, tracking-tight — not the old 2px square placeholder.
- The sidebar nav items are exactly: Extract, Agent, Report, Team — in that order, with no other items visible.
- Clicking each nav item routes to the correct screen.

---LOVABLE PROMPT START---
Update the sidebar component (`app-sidebar.tsx` or wherever the sidebar is defined).

**Wordmark change:**
Replace the current sidebar logo/brand element (currently a small green square and the text "Handoff") with a new wordmark. The wordmark should be:
- A filled green circle rendered using the unicode character `●` in `text-primary` color (which is now #16a34a) — use a `span` element
- Followed by a single space character
- Followed by the text "Handoff" in `font-semibold tracking-tight text-foreground`
- Both elements on one line, vertically centered, `text-base` size
- No image, no SVG logo — pure text and unicode only

**Nav items change:**
Replace the current nav item list with exactly these four items, in this order:
1. Extract — icon: `Zap` from lucide-react — routes to the current extract path
2. Agent — icon: `Bot` from lucide-react — routes to the current agent path
3. Report — icon: `BarChart3` from lucide-react — routes to the current report path
4. Team — icon: `Users` from lucide-react — routes to the current team route

Remove any other nav items that currently exist in the sidebar. Keep the sidebar's existing collapsible behavior. The sidebar background should already be `bg-sidebar` (#f4f4f5) from the theme token change — do not override it.
---LOVABLE PROMPT END---

---

### Prompt 3 — ReasoningTimeline Component

**Estimated Lovable iterations:** 3
**Verify success by:**
- A vertical list of events appears, newest at top. Each event shows a relative timestamp, a direction icon (blue for outbound, green for inbound), an uppercase mono message type label, and a content preview of approximately 80 characters.
- When an event has a `reasoning` field, a collapsible "AGENT REASONING" block appears below the content preview with amber-100 background, amber-200 left border (4px), and 13px mono text.
- The most recent event's reasoning block renders open by default (visible without clicking).

---LOVABLE PROMPT START---
Create a new component file `src/components/reasoning-timeline.tsx`.

This component renders an event timeline for agent communication log entries. Build it with static hardcoded props first — no API calls.

**TypeScript interface:**
```typescript
interface AgentEvent {
  id: string
  sentAt: string           // ISO timestamp string
  direction: 'inbound' | 'outbound'
  messageType: 'KICKOFF' | 'REPLY' | 'ESCALATION' | 'FOLLOW-UP'
  content: string
  reasoning?: string | null
}

interface ReasoningTimelineProps {
  events: AgentEvent[]
  taskOwner?: string
}
```

**Visual spec for each event row:**
- Outer container: `border-b border-border py-3 last:border-0`
- Top row: flex with space-between
  - Left: relative timestamp string — for the static version use a simple calculated string like "13 min ago". Add the absolute ISO time as a `title` attribute so it appears on hover.
  - Right: direction icon — for `outbound` use the `ArrowUpRight` icon from lucide-react in `text-blue-500`, for `inbound` use `ArrowDownLeft` in `text-green-600`. Icon size 14px (`size={14}`).
- Second row: message type label in `text-[10px] font-mono uppercase tracking-widest text-muted-foreground`
- Third row: first 80 characters of `content` in `text-sm text-foreground`
- If `reasoning` is non-null: render a collapsible section below the content preview (see reasoning block spec below)

**Reasoning block (collapsible):**
- Toggle trigger: `text-[10px] font-mono uppercase tracking-widest text-amber-700 cursor-pointer flex items-center gap-1 mt-2`
- Label text: "AGENT REASONING" with a `▶` chevron when closed and `▼` when open
- When open: a `div` with `bg-amber-100 border-l-4 border-amber-200 rounded-r-md p-3 mt-2`
  - Text: `text-[13px] font-mono text-zinc-800 whitespace-pre-wrap leading-relaxed`
  - Full reasoning text — do not truncate
  - Add `role="region" aria-label="Agent reasoning"` to this div
- Default state: the first event in the list (the most recently sent, since newest is at top) that has a non-null reasoning should render with the reasoning block open by default (`useState(true)`). All other reasoning blocks default to closed.

**Panel header:**
Above the event list, render a single line in `text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4`:
"[N] events · [blocked count] blocked · last update [relative time ago]"
For the static version hardcode: "3 events · 1 blocked · last update 5 min ago"

**Empty state:**
If `events` is an empty array, render: "Agent is standing by. Activate to send kickoff emails and start tracking replies." in `text-sm text-muted-foreground text-center py-8`.

**Static demo data:**
Export a named constant `DEMO_EVENTS` at the bottom of the file with these 3 hardcoded entries:
```typescript
export const DEMO_EVENTS: AgentEvent[] = [
  {
    id: '3',
    sentAt: new Date(Date.now() - 5 * 60000).toISOString(),
    direction: 'outbound',
    messageType: 'ESCALATION',
    content: 'Hi Maya, escalating to you — Sam is blocked on legal sign-off for the onboarding deployment. This is on the critical path for Friday.',
    reasoning: "Sam's reply indicates a hard blocker: legal approval is missing. This is not a scheduling issue — it requires a decision from someone with authority over the legal process. I am escalating to Maya (project lead) rather than following up with Sam again, as another follow-up would not unblock the task. Escalation drafted and sent."
  },
  {
    id: '2',
    sentAt: new Date(Date.now() - 6 * 60000).toISOString(),
    direction: 'inbound',
    messageType: 'REPLY',
    content: "Hey, I'm actually blocked on this — legal hasn't cleared the data processing terms yet and I can't proceed without sign-off.",
    reasoning: null
  },
  {
    id: '1',
    sentAt: new Date(Date.now() - 13 * 60000).toISOString(),
    direction: 'outbound',
    messageType: 'KICKOFF',
    content: "Hi Sam, following up on the onboarding deployment — you committed to shipping to staging by Friday. Can you confirm you're on track?",
    reasoning: null
  }
]
```

Do not connect to Supabase or any API. Export both the `ReasoningTimeline` component as the default export and `DEMO_EVENTS` as a named export. Chip will wire the real data later.
---LOVABLE PROMPT END---

---

### Prompt 4 — AgentCockpitLayout (full agent view rewrite)

**Estimated Lovable iterations:** 3
**Verify success by:**
- At 1280px wide: the agent page shows a two-pane layout — task list on the left (roughly 55% width), reasoning panel on the right (roughly 45%, does not shrink below 380px even when the event list is short).
- Clicking any TaskCard in the left pane changes the right panel header to show that task's owner and task text. Clicking a "Show all" link returns to the full timeline.
- A task with `state === 'blocked'` has a visible pulsing amber ring around it.
- The page header shows the project name, a task count, and a pulsing green dot labeled "Agent active".

---LOVABLE PROMPT START---
Rewrite the agent view screen (`src/routes/projects.$projectId.agent.tsx` or the equivalent agent route file).

**IMPORTANT: Do NOT modify the existing `TaskCard` component in any way.** Import it as-is. All TaskCard extensions are done by wrapping it, not by editing the component.

**Page header (full width, above the split pane):**
A `div` with `flex items-center gap-3 mb-6`:
- Project name in `text-xl font-semibold text-foreground`
- A dot separator `·` in `text-muted-foreground`
- Task count: "6 tasks" in `text-sm text-muted-foreground`
- "Agent active" badge: a `span` containing a `span` with `inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5` followed by the text "Agent active" in `text-xs font-medium text-green-700`

**Split pane layout — use this exact structure:**
```jsx
<div className="flex h-[calc(100vh-120px)] overflow-hidden gap-0">
  <div className="w-[55%] min-w-0 overflow-y-auto pr-6 border-r border-border">
    {/* task list */}
  </div>
  <div className="w-[45%] min-w-[380px] flex-shrink-0 overflow-y-auto pl-6">
    {/* reasoning panel */}
  </div>
</div>
```
Use this exact className structure. The right pane must have `min-w-[380px] flex-shrink-0` so it never collapses regardless of content.

**Task list (left pane):**
- Group tasks by cluster label if that data is available. Render each cluster group with a header: `text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 mt-4`
- For each task: render `<TaskCard task={task} />` (imported as-is). Wrap each TaskCard in a `div` that:
  - Has `onClick={() => setSelectedTaskId(task.id)}` to select the task
  - If `task.state === 'blocked'`: also has `className="ring-2 ring-amber-400 rounded-lg animate-pulse"` on the wrapper div
  - If `task.id === selectedTaskId`: also has `className="ring-2 ring-primary rounded-lg"` on the wrapper div
  - Use `cn()` to combine these classes conditionally

For the static demo, hardcode 3 tasks in the left pane using placeholder data matching the Northbeam NL demo (Sam: onboarding — blocked, Daan: pricing copy — in_progress, Lotte: email sequence — pending).

**Reasoning panel (right pane):**
- Import `ReasoningTimeline` and `DEMO_EVENTS` from `src/components/reasoning-timeline.tsx`
- Use `useState<string | null>(null)` for `selectedTaskId`
- When `selectedTaskId` is null: render a header "All tasks — agent activity" in `text-sm font-medium text-foreground mb-4`, then `<ReasoningTimeline events={DEMO_EVENTS} />`
- When `selectedTaskId` is set: render a header showing the selected task owner and task text (truncated to 40 chars) in `text-sm font-medium text-foreground mb-4`. Show a `← Show all` link in `text-xs text-muted-foreground cursor-pointer` that calls `setSelectedTaskId(null)` on click. Pass `DEMO_EVENTS` to `ReasoningTimeline` — Chip will add task_id filtering when wiring real data.

**Remove** any "Send kickoff emails" button or sticky footer CTA from the agent view. That element belongs only on the Extract screen.

Ensure the layout looks correct at 1280x800 viewport width. This is the primary target — mobile layout is not required.
---LOVABLE PROMPT END---

---

### Prompt 5 — Landing Page

**Estimated Lovable iterations:** 2
**Verify success by:**
- Navigating to `/` shows the landing page, not the Team screen or any other app screen.
- The hero headline reads exactly: "The meeting ended." on the first line, "Now Handoff chases the work." on the second line.
- The primary CTA button "See it in action →" is visible and links to the extract route.
- The 3-step explainer shows "01 Paste transcript", "02 Extract tasks", "03 Agent chases to done" in a horizontal row.

---LOVABLE PROMPT START---
Replace the content of the root route (`src/routes/index.tsx`) with a landing page. First, move the existing Team page component to a `/team` route if it is not already there — do not delete the Team page, just relocate it. The root route `/` should now render the landing page only.

**Landing page structure:**

**Nav bar:**
A `nav` element with `sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm`:
- Inner: `max-w-5xl mx-auto px-6 h-14 flex items-center justify-between`
- Left side: Handoff wordmark — a `span` with `●` in `text-primary font-semibold` followed by a space and "Handoff" in `font-semibold tracking-tight text-foreground text-base`
- Right side: a link "Enter app →" in `text-sm font-medium text-foreground hover:text-primary transition-colors` that navigates to the extract screen

**Hero section:**
A `section` with `py-24 px-6 text-center`:
- Inner: `max-w-2xl mx-auto`
- Headline line 1: "The meeting ended." — `text-4xl font-semibold tracking-tight text-foreground`
- Headline line 2: "Now Handoff chases the work." — same classes, `mt-1`
- Subtext: `text-base text-muted-foreground mt-5 leading-relaxed` — "Drop in a meeting transcript. Handoff extracts every action item and sends personalised chaser emails until everything is done."
- Primary CTA: a `Button` component (`variant="default"`, `size="lg"`) with text "See it in action →" and `className="mt-8"`. On click, navigate to the extract route (the `/projects/:id/extract` route or wherever Extract lives — use the existing routing). For now just navigate to that route without pre-loading demo data; Chip will wire the demo pre-load separately.

**3-step explainer:**
A `section` with `py-16 px-6 border-t border-border`:
- Inner: `max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center`
- Three items with this structure for each:
  ```
  <div>
    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">01</p>
    <p className="text-base font-semibold text-foreground mt-2">Paste transcript</p>
  </div>
  ```
  Step numbers: "01", "02", "03". Step titles: "Paste transcript", "Extract tasks", "Agent chases to done".
- No icons, no illustrations, no animations — typographic only.

**Page background:** `bg-background` only. No gradient, no hero image, no decorative elements. Keep total page weight minimal.

Do not add any authentication prompts, sign-up forms, or login walls.
---LOVABLE PROMPT END---

---

### Prompt 6 — Weekly Report (3-section version)

**Estimated Lovable iterations:** 2
**Verify success by:**
- The report screen shows exactly 3 content sections: a row of 4 stat tiles, a blocked items list, and a weekly narrative text block.
- The 4 stat tiles each show a large number and a label in uppercase mono below it.
- A "Print" button in the page header calls `window.print()` when clicked.

---LOVABLE PROMPT START---
Rewrite the Report screen (`src/routes/projects.$projectId.report.tsx` or the equivalent report route). Remove the existing completion percentage display and per-owner progress bars entirely. Replace with the 3-section layout below.

**Page header:**
A `div` with `flex items-start justify-between mb-10`:
- Left side (stacked vertically):
  - `text-sm text-muted-foreground` — "Week of 12 May – 18 May 2026"
  - `text-xl font-semibold text-foreground mt-0.5` — "Northbeam Q2 Launch · Handoff Report"
- Right side: a `Button` with `variant="outline"` and `size="sm"`, labeled with the `Printer` lucide icon and the text "Print". Add `className="no-print"` to this button. On click: `window.print()`. Add a `<style>` block or a `@media print` rule that sets `.no-print { display: none; }` and `body { background: white; }` when printing.

**Section 1 — Headline stats row** (`mb-10`):
Section label: `text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4` — "Overview"
A `div` with `grid grid-cols-2 md:grid-cols-4 gap-4`:
Each stat tile is a `Card` with `p-5`:
- Large number: `text-3xl font-semibold text-foreground`
- Label: `text-[11px] font-mono uppercase tracking-widest text-muted-foreground mt-1`

The 4 tiles (hardcoded values for now):
1. Number: "6" — Label: "Total tasks"
2. Number: "33%" in `text-green-600` — Label: "Done"
3. Number: "1" in `text-amber-600` — Label: "Blocked"
4. Number: "47 min" — Label: "Avg response time"

**Section 2 — Blocked items list** (`mb-10`):
Add a `border-t border-border pt-8` separator above this section.
Section label: same mono uppercase style — "Blocked items"
For each blocked item (hardcode 1 for now):
A `Card` with `p-4 mt-3`:
- Owner name: `text-sm font-semibold text-foreground`
- Task text: `text-sm text-foreground mt-1`
- Block reason: a `div` with `border-l-2 border-amber-400 pl-3 mt-3`
  - Text inside: `text-sm text-muted-foreground italic`

Hardcoded blocked item: Owner "Sam Bakker", Task "Ship onboarding flow to staging", Reason "Blocked on legal sign-off for data processing terms — cannot proceed without clearance from legal."

**Section 3 — Weekly narrative** (`mb-10`):
Add a `border-t border-border pt-8` separator above this section.
Section label: same mono uppercase style — "Agent summary"
A `p` tag with `text-sm text-foreground leading-relaxed`:
Hardcoded text: "The Northbeam Q2 launch project made partial progress this week. 2 of 6 tasks are complete, with the onboarding deployment blocked on a legal approval that has been escalated to the project lead. The remaining tasks are in progress and on track for the end-of-week deadline."

**No chart.** Do not add any chart or data visualisation component — it is not required.

Use only hardcoded data. Chip will replace these with real Supabase queries.
---LOVABLE PROMPT END---

---

### Prompt 7 — Accessibility Pass

**Estimated Lovable iterations:** 1
**Verify success by:**
- Tab to the very top of the page — a "Skip to content" link should become visible on focus (it is hidden until focused via `sr-only`).
- Inspect the ExtractionProgress stage label in devtools — it should have `aria-live="polite"` on the element.
- Focus a TaskCard using the Tab key — a visible ring (2px blue/primary outline) should appear around the card.
- Inspect the task text Input inside TaskCard — it should have `aria-label="Task description"`.

---LOVABLE PROMPT START---
Make exactly these 4 targeted accessibility changes. Do not restructure any components, change any styling outside these specific additions, or modify anything not listed below.

**Change 1 — Skip link in root layout:**
In the root layout file (`__root.tsx`, `root.tsx`, or the root layout component), add this as the very first child element inside the layout, before the sidebar or any nav:
```html
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:border focus:border-border focus:rounded-md focus:text-sm focus:font-medium focus:text-foreground"
>
  Skip to content
</a>
```
Also add `id="main-content"` to the `<main>` tag or the primary content wrapper div in the root layout.

**Change 2 — ExtractionProgress live region:**
In the `ExtractionProgress` component, find the element that displays the current stage name (the text that changes as extraction progresses — something like "Parsing transcript" or "Extracting tasks"). Add `aria-live="polite"` and `aria-atomic="true"` as attributes on that element only. Do not change any other part of ExtractionProgress.

**Change 3 — TaskCard focus ring:**
In the `TaskCard` component, find the outermost container element that receives click or keyboard interaction. Add these classes to it: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`. Also ensure this element has `tabIndex={0}` so it is keyboard-focusable. Do not change any other styling on TaskCard.

**Change 4 — Task text input aria-label:**
In the `TaskCard` component, find the `<Input>` component used for editing the task text (the field for the task description or `task_text`). Add `aria-label="Task description"` as a prop to that Input component. Do not add any visible label element — only the aria-label attribute.

Make only these 4 changes across the 3 files (root layout, ExtractionProgress, TaskCard). No other files should be modified.
---LOVABLE PROMPT END---

---

*End of Phase 2 Design Review.*

---

## Autoplan Phase 4 — Final Approval Gate

*Approved by Isaac on 2026-05-14*
*Status: **APPROVED — plan is locked***

### Changes Approved

| # | Change | Original | Locked value |
|---|---|---|---|
| C1 | Reasoning block contrast | amber-50 background | amber-100 + 4px amber-200 left border, 13px mono |
| C2 | Responsive scope | 6 fixes in Section 12 | 2 only: pb-20 sticky footer + landing single-column |
| C3 | Reasoning panel default state | collapsible, starts collapsed | most recent block starts open |

### What Isaac Builds (final locked order)

**In Lovable, paste these prompts in order. Each one is in Phase 2 above.**

| # | Task | Prompt | Est. Lovable iterations | Time |
|---|---|---|---|---|
| 1 | Light theme token swap | Prompt 1 | 2 | ~30 min |
| 2 | Handoff wordmark + sidebar | Prompt 2 | 2 | ~45 min |
| 3 | ReasoningTimeline + ReasoningBlock | Prompt 3 | 3 | ~2 hrs |
| 4 | Agent cockpit layout | Prompt 4 | 3 | ~2 hrs |
| 5 | Landing page | Prompt 5 | 2 | ~1 hr |
| 6 | Weekly report (3 sections) | Prompt 6 | 2 | ~1.5 hrs |
| 7 | Accessibility (4 targeted fixes) | Prompt 7 | 1 | ~30 min |

**Total: ~8.5 hrs Lovable prompt-and-iterate time. Target: complete by end of May 16.**

### What Chip Ships (final locked order, from Phase 3)

| Priority | Task | Why it unblocks Isaac |
|---|---|---|
| 1 | Write `agent_log.reasoning` in reply-handler | Without this, the reasoning panel is empty |
| 2 | Seed demo DB (6 tasks, 4 agent_log rows) | Isaac needs data to validate every component |
| 3 | `/api/agent-log?projectId=` endpoint with task join | Powers ReasoningTimeline |
| 4 | Confirm `reply_received_at` written on webhook | Avg response time stat |
| 5 | Add `project_summary` string to project row | Weekly narrative section |
| 6 | Confirm RLS open on demo workspace | Isaac's components get data in browser |

**Chip tells Isaac when done: "Demo DB seeded — project ID is [X], RLS open."**

### Demo Reliability Guarantee

Before demo day (May 18):
- Chip pre-seeds a project in state: already Activated, 3 agent_log rows populated (kickoff + blocked reply + escalation)
- If live Activate fails during demo, switch to this pre-seeded project without breaking stride
- Isaac has seen this project in Lovable preview before demo day — knows exactly what it looks like

---

*Plan locked. /autoplan complete.*
