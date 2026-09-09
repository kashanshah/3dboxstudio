# Google Analytics 4 — 3D Box Studio

This document describes how GA4 is implemented on [3dboxstudio.com](https://3dboxstudio.com), every custom event, how to test, and how to build funnels in GA4 Admin.

## Architecture overview

| Layer | Location | Role |
|-------|----------|------|
| Enablement policy | `src/lib/analytics/policy.ts` | Single `GA_ENABLED` rule for loader + custom events |
| gtag loader | `src/components/GoogleAnalytics.tsx` | One controlled gtag.js init (`send_page_view: false`) |
| SPA pageviews | `src/components/AnalyticsPageView.tsx` | Explicit `page_view` + `page_context` per permitted navigation |
| Event API | `src/lib/analytics/core.ts` | `trackEvent(name, params)` + typed helpers |
| Attribution | `src/components/AttributionCapture.tsx` | First-touch UTM/referrer → httpOnly cookie (signup only) |
| Studio CTAs | `src/components/StudioLink.tsx` | `studio_cta_clicked` + session entry context for `studio_open` |

**There is a single GA implementation.** Do not add gtag snippets, GTM containers, or a second measurement ID.

### Who owns `page_view`?

| Event | Owner | When |
|-------|-------|------|
| `page_view` | `AnalyticsPageView` | Once per permitted client navigation (explicit `trackPageView`) |
| `page_context` | `AnalyticsPageView` | Same cycle as `page_view` |

gtag is initialized with **`send_page_view: false`**. The loader does **not** rely on GA4 Enhanced Measurement history tracking for SPA pageviews.

**GA4 Admin:** Disable **Page changes based on browser history events** in Enhanced Measurement for this stream (or accept possible duplicate pageviews from Enhanced Measurement if left enabled). The app sends explicit SPA pageviews; history-based auto tracking is redundant and can race on admin navigations.

### Initialization

```tsx
// app/layout.tsx
<GoogleAnalytics />   // gtag loader — only when GA_ENABLED and not on /admin
<AnalyticsPageView /> // explicit page_view + page_context
```

### Shared enablement policy (`GA_ENABLED`)

| Condition | gtag loads? | Events send? |
|-----------|-------------|--------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` empty | No | No |
| `NODE_ENV=development` and debug off | **No** | **No** |
| `NODE_ENV=production` | Yes (non-admin) | Yes (non-admin) |
| `NEXT_PUBLIC_ANALYTICS_DEBUG=true` | Yes (non-admin) | Yes (non-admin) |

**Localhost cannot pollute production GA** unless `NEXT_PUBLIC_ANALYTICS_DEBUG=true` with a real measurement ID.

### DebugView

When `NEXT_PUBLIC_ANALYTICS_DEBUG=true`:

- Console logs: `[Analytics] event_name { ... }`
- `GA_ENABLED` is true in development
- gtag config includes `{ debug_mode: true, send_page_view: false }`
- Events appear in GA4 **Admin → DebugView**

Debug mode is **off by default** and never enabled in production unless the env var is set.

---

## Admin exclusion

Admin routes (`/admin`, `/admin/*`) are excluded at three layers:

1. **Loader** — `GoogleAnalytics` does not mount on admin routes (no gtag on direct admin loads)
2. **Synchronous path guard** — `trackEvent()` reads `window.location.pathname` and returns immediately (no debug log, no send) on admin paths
3. **Route tracker** — `AnalyticsPageView` returns before emitting `page_view` / `page_context` on admin paths
4. **Defense in depth** — `window['ga-disable-G-XXXXXXXX'] = true` when pathname is admin (after gtag was loaded on a prior public page)

---

## Event deduplication

| Mechanism | Events protected |
|-----------|------------------|
| Route tracker (`routeTracking.ts`) + rAF cleanup | `page_view`, `page_context` |
| `sessionStorage` per design session + `claimNewDesignSession` | `design_started`, `design_customized` (per category) |
| `markProjectReopenedOnce(projectKey)` short window | `project_reopened` |
| `markStudioErrorOnce(category, stage)` cooldown | `studio_error` |
| `studioOpenTrackedRef` per `BoxDesigner` mount | `studio_open` |
| `runUrlBootstrapOnce` (shared in-flight promise per id/token) | URL load → `project_reopened` |
| `templateInitRef` | Skips initial template dropdown render |

### `page_view` / `page_context` frequency

- Fire **once per actual client navigation** to a permitted URL
- **Re-fire** when returning to the same URL after navigating away (`/blog/x` → `/studio` → `/blog/x`)
- **Do not** double-fire from React Strict Mode (rAF + effect cleanup clears in-flight key)
- **Never** fire on `/admin` or `/admin/*`

### `studio_open` frequency

- Fire **once per Studio workspace entry** (`BoxDesigner` mount, auth resolved, session ready)
- **Re-fire** when leaving Studio and returning
- **Do not** fire during auth loading, on the auth gate, or on rerenders within the same mount

### `design_started` semantics

Fire **once per genuine new design session**:

| Fires | Does **not** fire |
|-------|-------------------|
| Start dialog → Create new / Close (blank canvas) | Template dropdown changes |
| File → New | Autosave / cloud sync |
| Successful JSON import | Opening an existing cloud/share/recent/preview project |
| | React rerenders, Strict Mode double-invokes, auth `/me` polls |

Implementation: `beginTrackedDesignSession()` → `claimNewDesignSession()` (resets milestones, Strict Mode safe) → single `design_started`.

Opening an existing project fires **`project_reopened` only** (not `design_started`).

### `project_reopened` semantics

Fire when the user **genuinely opens an existing project**:

| Fires (once per open action) | Does **not** fire |
|------------------------------|-------------------|
| Start dialog → open project | Effect re-runs from unstable callbacks |
| File → Open / Recent | Auth user object identity churn |
| Share URL bootstrap (`/studio/{id}`) — once per id (Strict Mode safe) | Autosave / save-as reload |
| Preview token bootstrap — once per token | Rerenders / Strict Mode duplicates |

`beginReopenedDesignSession(projectKey)`:

1. Dedupes identical keys (short window)
2. Calls `resetExistingDesignSession()` — fresh `designSessionId`, clears `design_customized` categories, marks `designStarted` so **`design_started` will not emit**
3. Emits `project_reopened` once

Share/preview URL loads use `runUrlBootstrapOnce` so Strict Mode remounts share one in-flight promise; failures clear the cache and can retry.

### `studio_error` semantics

| `error_category` | `stage` | Code triggers |
|------------------|---------|---------------|
| `cloud_save_failed` | `other` | `saveCloud` / `autoSaveCloud` / `saveCloudAs` catch |
| `cloud_load_failed` | `studio_load` | Share URL or preview load catch |
| `export_failed` | `export` | PNG/JSON/recording failure paths |
| `file_validation_failed` | `artwork_upload` | Face artwork validation reject |
| `webgl_init_failed` | `rendering` | `StudioErrorBoundary` (WebGL-like errors) |
| `unknown` | `rendering` | `StudioErrorBoundary` (other render errors) |

**Deduping:** same `error_category` + `stage` is rate-limited (~10s). Error boundary tracks once per failure until Retry. Continuous autosave failures no longer flood GA4.

**Sept 2–8 production note:** 221 `studio_error` / 35 users is consistent with repeated `cloud_save_failed` from autosave retries and/or `cloud_load_failed` from share-URL effect storms (same root instability as `project_reopened`). Category breakdown is not available from app logs alone; use GA4 Explorations filtered by `error_category` / `stage`.

### `template_selected` parameters

Payload order ensures the **newly selected** template wins over stale React state:

```ts
{
  ...studioParams(ctx),           // user_status, etc.
  template_type: <selected id>, // always the new selection
  template_name: <selected id>,
  template_category: "box_preset",
  box_type: <selected id>,
}
```

### `export_clicked` / `export_completed`

Unchanged: one click → `export_clicked`; successful finish → `export_completed` (with `is_first_export`). Do not gate or merge these with design-session milestones.

---

## `design_completed` — not implemented

Removed: first cloud save fired immediately after `artwork_uploaded` via auto-save, duplicating `project_saved`.

**Core activation funnel:**

`session_start` → `studio_open` → `design_started` → `artwork_uploaded` → `design_customized` → `export_clicked` → `export_completed`

Use `project_saved` for cloud persistence and `project_reopened` for returning to existing work (separate from `design_started`).

---

## Key Events (GA4 Admin)

Mark **`export_completed`** only as the primary Key Event.

---

## Testing

```bash
npm run test          # vitest unit tests
NEXT_PUBLIC_ANALYTICS_DEBUG=true npm run dev  # DebugView QA
```

### Verification checklist

- [ ] No `gtag/js` on localhost without `NEXT_PUBLIC_ANALYTICS_DEBUG=true`
- [ ] Exactly one explicit `page_view` per permitted navigation
- [ ] No `page_view` or custom events on `/admin`
- [ ] `template_selected` records the newly selected template ID
- [ ] Returning to the same URL after leaving fires `page_view` again
- [ ] Re-entering Studio fires `studio_open` again
- [ ] Opening a share URL fires one `project_reopened` (not a stream) and **no** `design_started`
- [ ] Create new / import fires one `design_started`; Strict Mode does not duplicate
- [ ] Failed autosave does not emit `studio_error` more than once per ~10s per category

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/analytics/policy.ts` | `GA_ENABLED`, path helpers |
| `src/lib/analytics/gtag.ts` | Controlled gtag init (`send_page_view: false`) |
| `src/lib/analytics/core.ts` | `trackEvent` + admin guard |
| `src/lib/analytics/pageview.ts` | Explicit `page_view` |
| `src/lib/analytics/routeTracking.ts` | Route dedupe state machine |
| `src/lib/analytics/session.ts` | Design-session + reopen + error dedupe |
| `src/lib/analytics/events.ts` | Typed event helpers |
| `src/lib/studioUrlBootstrap.ts` | Strict-Mode-safe share/preview URL load cache |
| `src/hooks/useStudioUrlBootstrap.ts` | BoxDesigner share/preview bootstrap effects |
| `src/components/GoogleAnalytics.tsx` | gtag script loader |
| `src/components/AnalyticsPageView.tsx` | SPA `page_view` + `page_context` |
