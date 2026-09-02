# Google Analytics 4 — 3D Box Studio

This document describes how GA4 is implemented on [3dboxstudio.com](https://3dboxstudio.com), every custom event, how to test, and how to build funnels in GA4 Admin.

## Architecture overview

| Layer | Location | Role |
|-------|----------|------|
| GA script loader | `src/components/GoogleAnalytics.tsx` | Loads **gtag.js** via `@next/third-parties/google` (not GTM) |
| Page views | `@next/third-parties` `GoogleAnalytics` component | Automatic SPA `page_view` on route changes |
| Page context | `src/components/AnalyticsPageView.tsx` | Supplementary `page_context` event with `page_type` (no duplicate `page_view`) |
| Event API | `src/lib/analytics/` | `trackEvent(name, params)` + typed helpers |
| Attribution | `src/components/AttributionCapture.tsx` | First-touch UTM/referrer → httpOnly cookie (signup only; does **not** override GA session attribution) |
| Studio CTAs | `src/components/StudioLink.tsx` | `studio_cta_clicked` + session entry context for `studio_open` |

**There is a single GA implementation.** Do not add gtag snippets, GTM containers, or a second measurement ID.

### Initialization

```tsx
// app/layout.tsx
<GoogleAnalytics />  // reads NEXT_PUBLIC_GA_MEASUREMENT_ID
<AnalyticsPageView />  // page_type context
```

- **Measurement ID:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` (`G-XXXXXXXX`)
- **Disabled when:** env var empty, or route is `/admin` / `/admin/*`
- **Development:** events are **not sent** unless `NODE_ENV=production` **or** `NEXT_PUBLIC_ANALYTICS_DEBUG=true`

### Core API

```ts
import { trackEvent } from "@/lib/analytics";

trackEvent("event_name", { param: "value" });
```

All helpers (`trackStudioOpen`, `trackExportCompleted`, etc.) call `trackEvent` internally. Analytics never throws; blocked scripts and ad blockers are ignored safely.

### Debug mode

Set in `.env.local`:

```env
NEXT_PUBLIC_ANALYTICS_DEBUG=true
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

When enabled:

- Every event logs to the console as `[Analytics] event_name { ...params }`
- Events are sent to GA even in non-production builds (for DebugView)

Default: **disabled** — local dev does not pollute production GA.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Production | GA4 measurement ID (`G-XXXXXXXX`). Empty = GA fully disabled. |
| `NEXT_PUBLIC_ANALYTICS_DEBUG` | No | `true` = console logging + allow sending in dev. Default off. |

---

## Privacy rules

**Never sent to GA:**

- Email, name, phone, account IDs
- Filenames, image URLs, storage URLs, project IDs
- User-entered text, artwork contents, tokens
- Raw exception messages or stack traces

**Allowed:** predefined enums, buckets, sanitized categories, template preset IDs, page paths, article slugs (public URLs).

**Attribution:** The app does **not** manually set `source`, `medium`, or `campaign` on product funnel events. UTMs, `gclid`, and referrers (including ChatGPT, Perplexity, Claude, Gemini) are preserved by GA4 + first-page load. `AttributionCapture` only enriches `sign_up` with first-touch context stored server-side.

---

## Event deduplication

| Mechanism | Events protected |
|-----------|------------------|
| `sessionStorage` milestone flags | `studio_open`, `design_started`, `design_completed`, `design_customized` (per category) |
| `shouldTrackPageContext` per path key | `page_context` |
| `resetDesignSession()` on new design | Resets per-design milestones when starting a new session |
| Ref guards | `studioOpenTrackedRef`, `templateInitRef` (skip initial template render) |

React Strict Mode: milestone flags persist in `sessionStorage` within the tab so double `useEffect` mounts do not duplicate milestone events.

---

## `design_completed` definition

**Trigger:** First successful **cloud save** in a design session — manual Save, Save As, or auto-save after artwork upload.

**Rationale:** The product treats cloud persistence as the meaningful “design is real” milestone (auto-save on artwork is documented in-app). Export is tracked separately in the export funnel.

Fired once per design session via `markDesignCompleted()` inside `trackProjectSaved()`.

---

## Event reference

| Event | Trigger | Parameters | Funnel stage | Key Event? |
|-------|---------|------------|--------------|------------|
| `page_view` | Automatic on route change (`@next/third-parties`) | GA defaults (`page_path`, etc.) | Acquisition | No |
| `page_context` | Once per client navigation | `page_path`, `page_type` | Acquisition | No |
| `studio_cta_clicked` | Click tracked Studio CTA toward `/studio` | `source_page_type`, `page_path`, `page_slug?`, `cta_location`, `destination` | Content → Studio | No |
| `studio_open` | User enters studio workspace (past auth gate, session ready) — once per tab | `entry_point`, `template_type`, `user_status` | Studio entry | No |
| `design_started` | User begins a design session (create new, close start dialog, import JSON, reopen project) — once per design session | `template_type`, `box_type`, `user_status` | Design | No |
| `template_selected` | User selects a preset from Box template dropdown (not initial load) | `template_type`, `template_name`, `template_category`, `box_type`, `user_status` | Design | No |
| `artwork_uploaded` | Face image passes validation and is applied | `template_type`, `file_type`, `file_size_bucket`, `upload_surface`, `user_status` | Design | No |
| `design_customized` | First use of each customization category per design session | `customization_type`, `template_type`, `box_type`, `user_status` | Design | No |
| `design_completed` | First successful cloud save in design session | `template_type`, `box_type`, `user_status` | Design complete | **Yes (secondary)** |
| `export_clicked` | User clicks PNG export, Record video, or Download JSON | `export_format`, `export_resolution`, `template_type`, `box_type`, `user_status` | Export intent | No |
| `export_completed` | Export/download succeeds | above + `is_first_export` | Export success | **Yes (primary)** |
| `export_failed` | Export/recording fails | `export_format`, `template_type`, `failure_category` | Export | No |
| `project_saved` | Cloud save succeeds (manual or auto) | `template_type`, `box_type`, `user_status` | Retention | No |
| `project_reopened` | User opens saved project (panel, recent, link, URL) | `template_type`, `box_type`, `user_status` | Retention | No |
| `sign_up` | Account created (email or Google) | `method`, optional campaign/landing params | Auth | No |
| `login` | Successful sign-in (email or returning Google) | `method` | Auth | No |
| `studio_activated` | Legacy: immediately after `sign_up` | `method` | Auth | No |
| `studio_error` | Sanitized studio failure | `error_category`, `stage` | Diagnostics | No |

### Parameter enums

**`entry_point`:** `homepage`, `template_page`, `blog`, `guide`, `direct`, `other`

**`user_status`:** `guest`, `signed_in`, `signed_in_unverified`

**`customization_type`:** `artwork`, `dimensions`, `material`, `background`, `camera`, `color`, `lighting`, `other`

**`upload_surface`:** `front`, `back`, `left`, `right`, `top`, `bottom`, `other`

**`export_format`:** `png`, `json`, `mp4`, `webm`

**`failure_category`:** `canvas_unavailable`, `recorder_unsupported`, `recorder_start_failed`, `serialization_failed`, `download_failed`, `unknown`

---

## Key Events (GA4 Admin)

Mark manually in **Admin → Events → Mark as key event**:

1. **`export_completed`** — primary product success metric
2. **`design_completed`** — secondary (reliable: first cloud save)

Do **not** mark every funnel step as a Key Event.

**Future (when built):** `purchase`, `subscription_started` per GA4 ecommerce recommendations.

---

## GA4 Explorations

### Funnel A — Overall product funnel

Steps (event name):

1. `session_start`
2. `studio_open`
3. `design_started`
4. `artwork_uploaded`
5. `design_completed`
6. `export_clicked`
7. `export_completed`

Exploration: **Funnel exploration** → open mode, 7 steps, breakdown by `session default channel group` optional.

### Funnel B — ChatGPT traffic

Segment: Session source contains `chatgpt.com` (or exact match on `chatgpt.com`).

Steps: `session_start` → `studio_open` → `design_started` → `export_completed`

### Funnel C — Google Organic

Segment: Session default channel group = Organic Search, source = google.

Steps: same as Funnel B.

### Funnel D — Content conversion

Steps: `page_context` where `page_type` in (`blog`, `guide`, `landing`) → `studio_cta_clicked` → `studio_open` → `design_started` → `export_completed`

Filter `studio_cta_clicked` by `source_page_type` and `page_slug` for per-article performance.

### Funnel E — Template performance

Steps: `template_selected` → `design_started` → `export_completed`

Breakdown: `template_type`

---

## Testing

### Local / staging

1. Set `NEXT_PUBLIC_ANALYTICS_DEBUG=true` and your GA measurement ID.
2. Open DevTools → Console; confirm `[Analytics]` logs on actions.
3. Do **not** use production GA ID for casual local browsing without debug mode (events are suppressed in dev by default).

### GA4 Realtime

1. GA4 → **Reports → Realtime**
2. Open the site in another tab (production URL)
3. Perform actions; watch **Event count by Event name** for `studio_open`, `export_completed`, etc.

### GA4 DebugView

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) or use `debug_mode` via gtag (DebugView picks up validated streams).
2. With `NEXT_PUBLIC_ANALYTICS_DEBUG=true`, trigger events and open **Admin → DebugView**.

### Verification checklist

- [ ] Single GA tag (no duplicates in Network tab for second `gtag/js?id=`)
- [ ] Homepage: one automatic `page_view` per navigation
- [ ] Client-side route change fires new `page_view` + one `page_context`
- [ ] `studio_open` once when entering studio
- [ ] `design_started` once per design session
- [ ] `export_completed` only after successful download
- [ ] UTMs present in landing URL still visible in GA acquisition reports
- [ ] No PII in event parameter payloads (DebugView)

---

## Exclude internal / developer traffic

**Do not hardcode IPs in the repository.**

Recommended GA4 Admin setup:

1. **Admin → Data collection → Data filters**
2. Create filter: **Internal traffic** (define your office/home IPs in **Admin → Data streams → Configure tag settings → Show all → Define internal traffic**)
3. Set filter to **Active** once validated in Testing mode
4. Optionally exclude staging/preview hostnames via **Data filters** on `hostname`

For Vercel preview deployments, use a separate GA4 property or leave `NEXT_PUBLIC_GA_MEASUREMENT_ID` unset on previews.

---

## Future monetization events (not implemented)

The analytics layer is structured to add when features ship:

| Event | When to add |
|-------|-------------|
| `paywall_viewed` | Paywall UI shown |
| `pricing_viewed` | Pricing page/modal viewed |
| `upgrade_clicked` | User clicks upgrade CTA |
| `begin_checkout` | Checkout started (GA4 recommended) |
| `purchase` | Payment succeeded (GA4 ecommerce) |
| `subscription_started` | Subscription active |

Use `trackEvent()` — no code changes to the core wrapper required.

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/analytics/core.ts` | `trackEvent`, send guard, debug logging |
| `src/lib/analytics/events.ts` | Typed event helpers |
| `src/lib/analytics/session.ts` | Deduplication + `is_first_export` |
| `src/lib/analytics/entryContext.ts` | CTA → `studio_open` entry attribution |
| `src/lib/analytics/mappers.ts` | Sanitized enums |
| `src/components/GoogleAnalytics.tsx` | gtag loader |
| `src/components/AnalyticsPageView.tsx` | `page_context` |
| `src/components/StudioLink.tsx` | CTA tracking |
| `src/BoxDesigner.tsx` | Studio product events |
| `src/hooks/useStudioDocument.ts` | Save/reopen/export JSON |
| `src/hooks/useViewportRecording.ts` | Video export events |

---

## Known limitations

- **No separate template landing pages** — `template_page` entry point is reserved; template selection is tracked via `template_selected` in-studio.
- **No pricing/paywall** — monetization events are documented only.
- **Apple OAuth** — not implemented; `login` / `sign_up` support `apple` enum for future use.
- **`studio_activated`** — retained for backward compatibility with existing reports; prefer `studio_open` + `sign_up` for new funnels.
