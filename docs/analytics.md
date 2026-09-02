# Google Analytics 4 — 3D Box Studio

This document describes how GA4 is implemented on [3dboxstudio.com](https://3dboxstudio.com), every custom event, how to test, and how to build funnels in GA4 Admin.

## Architecture overview

| Layer | Location | Role |
|-------|----------|------|
| Enablement policy | `src/lib/analytics/policy.ts` | Single `GA_ENABLED` rule for loader + custom events |
| GA script loader | `src/components/GoogleAnalytics.tsx` | Loads **gtag.js** via `@next/third-parties/google` (not GTM) |
| Page views | gtag `config` on load + GA4 Enhanced Measurement | Initial `page_view`; further navigations depend on GA4 property settings |
| Page context | `src/components/AnalyticsPageView.tsx` | Supplementary `page_context` event with `page_type` |
| Event API | `src/lib/analytics/` | `trackEvent(name, params)` + typed helpers |
| Attribution | `src/components/AttributionCapture.tsx` | First-touch UTM/referrer → httpOnly cookie (signup only; does **not** override GA session attribution) |
| Studio CTAs | `src/components/StudioLink.tsx` | `studio_cta_clicked` + session entry context for `studio_open` |

**There is a single GA implementation.** Do not add gtag snippets, GTM containers, or a second measurement ID.

### Initialization

```tsx
// app/layout.tsx
<GoogleAnalytics />   // gtag loader — only when GA_ENABLED
<AnalyticsPageView /> // page_context — only when GA_ENABLED
```

### Shared enablement policy (`GA_ENABLED`)

Defined in `src/lib/analytics/policy.ts` and used by **both** the gtag loader and `trackEvent()`:

| Condition | GA loads? | Events send? |
|-----------|-----------|--------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` empty | No | No |
| `NODE_ENV=development` and debug off | **No** | **No** |
| `NODE_ENV=production` | Yes | Yes |
| `NEXT_PUBLIC_ANALYTICS_DEBUG=true` (any env) | Yes | Yes |

**Localhost cannot pollute production GA** unless you explicitly set `NEXT_PUBLIC_ANALYTICS_DEBUG=true` with a real measurement ID.

### Core API

```ts
import { trackEvent } from "@/lib/analytics";

trackEvent("event_name", { param: "value" });
```

All helpers call `trackEvent` internally. Analytics never throws; blocked scripts and ad blockers are ignored safely.

### Debug mode

```env
NEXT_PUBLIC_ANALYTICS_DEBUG=true
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

When enabled:

- Console logs: `[Analytics] event_name { ...params }`
- `GA_ENABLED` is true in development (events send)
- `GoogleAnalytics` passes `debugMode={true}` → gtag config includes `{ debug_mode: true }` for **GA4 DebugView**

Debug mode is **off by default**. It is never enabled in production unless you explicitly set the env var.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Production | GA4 measurement ID (`G-XXXXXXXX`). Empty = GA fully disabled. |
| `NEXT_PUBLIC_ANALYTICS_DEBUG` | No | `true` = console logging + enable GA in dev + `debug_mode` for DebugView. Default off. |

---

## Privacy rules

**Never sent to GA:**

- Email, name, phone, account IDs
- Filenames, image URLs, storage URLs, project IDs
- User-entered text, artwork contents, tokens
- Raw exception messages or stack traces

**Allowed:** predefined enums, buckets, sanitized categories, template preset IDs, page paths, article slugs (public URLs).

**Attribution:** The app does **not** manually set `source`, `medium`, or `campaign` on product funnel events. UTMs, `gclid`, and referrers (including ChatGPT, Perplexity, Claude, Gemini) are preserved by GA4 + first-page load.

---

## Event deduplication

| Mechanism | Events protected |
|-----------|------------------|
| `sessionStorage` per design session | `design_started`, `design_customized` (per category) |
| `requestAnimationFrame` + effect cleanup | `page_context` (Strict Mode only; repeat URL visits allowed) |
| `studioOpenTrackedRef` per BoxDesigner mount | `studio_open` (re-fires when re-entering Studio) |
| `resetDesignSession()` on new design | Resets per-design milestones |
| `templateInitRef` | Skips initial template dropdown render |

### `page_context` frequency

- Fires **once per actual client navigation** to a URL
- **Does** fire again when returning to the same URL after navigating away (e.g. `/blog/x` → `/studio` → `/blog/x`)
- **Does not** fire twice for the same navigation due to React Strict Mode (rAF + cleanup clears the in-flight key)

### `studio_open` frequency

- Fires **once per entry into the Studio workspace** (each time `BoxDesigner` mounts with auth resolved and session ready)
- **Does** fire again when leaving Studio and returning (e.g. Studio → Blog → Studio)
- **Does** fire again in a new GA session if the user re-enters Studio (no tab-level persistence)
- **Does not** fire during auth loading, on the auth gate, or on React rerenders within the same mount

---

## `design_completed` — not implemented

**Decision:** Removed from instrumentation.

**Why:** The previous definition (first cloud save) fired almost immediately after `artwork_uploaded` because artwork upload triggers auto-save. That did not represent meaningful design completion and duplicated `project_saved`.

**Use instead:**

- `project_saved` — cloud persistence milestone
- `design_customized` — meaningful editing beyond upload
- `export_completed` — primary success metric

Do **not** mark `design_completed` as a Key Event. Reintroduce only when a stronger completion signal exists (e.g. explicit “ready to export” user action).

---

## Admin exclusion

Admin routes (`/admin`, `/admin/*`) are excluded two ways:

1. **No script on direct admin loads** — `GoogleAnalytics` returns `null` on admin routes when `GA_ENABLED`
2. **Opt-out after client navigation** — `window['ga-disable-G-XXXXXXXX'] = true` when pathname is admin, so gtag stops sending even if the script was loaded on a prior public page

`AnalyticsPageView` and `trackEvent` also skip admin paths.

---

## Event reference

| Event | Trigger | Parameters | Funnel stage | Key Event? |
|-------|---------|------------|--------------|------------|
| `page_view` | gtag config on load (+ GA4 Enhanced Measurement if enabled) | GA defaults | Acquisition | No |
| `page_context` | Once per client navigation | `page_path`, `page_type` | Acquisition | No |
| `studio_cta_clicked` | Click tracked Studio CTA toward `/studio` | `source_page_type`, `page_path`, `page_slug?`, `cta_location`, `destination` | Content → Studio | No |
| `studio_open` | Each Studio workspace entry (past auth, session ready) | `entry_point`, `template_type`, `user_status` | Studio entry | No |
| `design_started` | User begins a design session — once per design session | `template_type`, `box_type`, `user_status` | Design | No |
| `template_selected` | User selects a preset from Box template dropdown | `template_type`, `template_name`, `template_category`, `box_type` | Design | No |
| `artwork_uploaded` | Face image passes validation and is applied | `file_type`, `file_size_bucket`, `upload_surface` | Design | No |
| `design_customized` | First use of each customization category per design session | `customization_type` | Design | No |
| `export_clicked` | User clicks PNG export, Record video, or Download JSON | `export_format`, `export_resolution` | Export intent | No |
| `export_completed` | Export/download succeeds | above + `is_first_export` | Export success | **Yes (primary)** |
| `export_failed` | Export/recording fails | `export_format`, `failure_category` | Export | No |
| `project_saved` | Cloud save succeeds (manual or auto) | `template_type`, `box_type`, `user_status` | Retention | No |
| `project_reopened` | User opens saved project | `template_type`, `box_type`, `user_status` | Retention | No |
| `sign_up` | Account created | `method`, optional campaign/landing params | Auth | No |
| `login` | Successful sign-in | `method` | Auth | No |
| `studio_activated` | Legacy: after `sign_up` | `method` | Auth | No |
| `studio_error` | Sanitized studio failure | `error_category`, `stage` | Diagnostics | No |

---

## Key Events (GA4 Admin)

Mark manually in **Admin → Events → Mark as key event**:

1. **`export_completed`** — primary product success metric

Do **not** mark `design_completed` (not implemented). Do **not** mark every funnel step.

---

## GA4 Explorations

### Funnel A — Core activation funnel (recommended)

1. `session_start`
2. `studio_open`
3. `design_started`
4. `artwork_uploaded`
5. `design_customized`
6. `export_clicked`
7. `export_completed`

Optional parallel retention step: `project_saved` (not in the same linear funnel — often follows `artwork_uploaded` via auto-save).

### Funnel B — ChatGPT traffic

Segment: Session source contains `chatgpt.com`.

Steps: `session_start` → `studio_open` → `design_started` → `export_completed`

### Funnel C — Google Organic

Segment: Session default channel group = Organic Search.

Steps: same as Funnel B.

### Funnel D — Content conversion

Steps: `page_context` (`page_type` = `blog` / `guide` / `landing`) → `studio_cta_clicked` → `studio_open` → `design_started` → `export_completed`

### Funnel E — Template performance

Steps: `template_selected` → `design_started` → `export_completed` (breakdown: `template_type`)

---

## Testing

### Local / staging

1. Set `NEXT_PUBLIC_ANALYTICS_DEBUG=true` and your GA measurement ID.
2. Console: confirm `[Analytics]` logs.
3. GA4 → Admin → **DebugView**: events appear with `debug_mode: true` on the gtag config.
4. Without debug mode in development: **no gtag script, no events** — localhost is safe.

### GA4 Realtime

Production URL only (or debug-enabled local). Watch event counts for `studio_open`, `export_completed`, etc.

### Verification checklist

- [ ] No `gtag/js` request on localhost without `NEXT_PUBLIC_ANALYTICS_DEBUG=true`
- [ ] `page_context` fires on every navigation, including return visits to the same URL
- [ ] `studio_open` fires on each Studio re-entry, not once per tab forever
- [ ] Navigating public → `/admin` stops GA hits (`ga-disable` flag)
- [ ] `export_completed` only after successful download
- [ ] No PII in DebugView payloads

---

## Exclude internal / developer traffic

Use GA4 Admin **internal traffic filters** (define IPs in Data stream settings). Do not hardcode IPs in the repo.

Leave `NEXT_PUBLIC_GA_MEASUREMENT_ID` unset on Vercel preview deployments.

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/analytics/policy.ts` | `GA_ENABLED`, admin/studio path helpers, `ga-disable` flag |
| `src/lib/analytics/core.ts` | `trackEvent`, debug logging |
| `src/lib/analytics/events.ts` | Typed event helpers |
| `src/lib/analytics/session.ts` | Per-design-session deduplication |
| `src/components/GoogleAnalytics.tsx` | gtag loader + `debugMode` |
| `src/components/AnalyticsPageView.tsx` | `page_context` |
| `src/BoxDesigner.tsx` | Studio product events + `studio_open` |

---

## Known limitations

- **No `design_completed` event** until a reliable completion signal exists.
- **SPA `page_view`** relies on GA4 Enhanced Measurement for history changes; `page_context` supplements with `page_type`.
- **No template landing pages** — use `template_selected` in-studio.
- **`studio_activated`** — legacy; prefer `studio_open` + `sign_up` for new funnels.
