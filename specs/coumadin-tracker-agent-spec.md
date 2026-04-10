# Agent Spec: Coumadin (Warfarin) Daily Tracker Web App

## Project Overview

A mobile-first progressive web app (PWA) to help a patient taking Coumadin (Warfarin) daily:
1. Remember to take their pill each day via browser notifications
2. Log the daily dose taken (mg), which can change based on INR results
3. Log and track INR blood test results over time
4. Predict the likely current INR based on recent dose history and past INR trends

The app replaces a manual daily alarm and handwritten INR records. All data is stored locally on the device (no backend required). The app should feel clean, calm, and medical-adjacent — easy to use with one hand on a phone.

---

## Target Platform

- **Primary**: Mobile browser (iOS Safari, Android Chrome)
- **Secondary**: Desktop browser (no layout work needed beyond responsiveness)
- **PWA**: Must be installable to home screen (manifest + service worker)
- **Offline**: All core features work offline; no login or server required

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **React + TypeScript** (Vite project) | Type safety for data models; component model fits the three-tab structure |
| Styling | Tailwind CSS utility classes | Fast, mobile-friendly layout |
| Storage | `localStorage` via a typed wrapper | Simple, offline, no backend |
| Notifications | ⏸ Deferred to later phase | See note below |
| Charts | `recharts` | INR trend line graph |
| Icons | `lucide-react` | Clean medical-friendly icons |

> **Note on Notifications**: Browser/push notification support is deferred to a later phase. The reminder time setting will be present in the UI as a placeholder, but the actual scheduling and Service Worker integration will be specced and built separately after the core app is approved.

---

## App Structure

### Three main screens (tabs):

```
[ 💊 Pill ]    [ 🩸 INR ]    [ 📈 Predict ]
```

---

## Screen 1: Pill Reminder & Dose Log

### Purpose
Show today's pill status, let the user mark it as taken with the dose they took, and fire a daily browser notification at the configured time.

### UI Components

#### Today's Status Card
- Large pill icon (color-coded: gray = not yet taken, green = taken today)
- Text: **"Have you taken your Coumadin today?"**
- Dose selector shown inline before confirming: a small segmented control or `+`/`-` stepper showing available pill strengths (e.g. 0.5mg, 1mg, 2mg, 5mg — configurable in Settings, see below). Default pre-fills the last used dose.
- Big CTA button: **"✓ Mark as Taken (0.5mg)"** — label updates dynamically with selected dose
- Tapping records today's date + timestamp + dose in localStorage
- If already taken today: show **"✅ Taken at 08:32 — 0.5mg"** with a small **Edit** link to change the dose
- Date shown: "Today, Saturday March 7"

#### Pill Strength & Settings
A collapsible "Settings" section (or gear icon) on this screen containing:

| Setting | Type | Notes |
|---|---|---|
| My pill strength(s) | Multi-value input | User enters the mg values available to them (e.g. `0.5`, `1.0`). These populate the dose selector. At least one required. |
| Default dose | Single select from configured strengths | Pre-selected in the daily log button |
| Daily reminder time | Time input | Saved to localStorage; notification scheduling deferred to later phase — show as "Coming soon" |

- Small note under pill strengths: *"Coumadin comes in different strengths. Add the ones your doctor has prescribed."*
- Changes save immediately to localStorage

#### Recent History Strip
- Last 7 days shown as small pill icons in a horizontal row
- Each day: date label + colored dot (green = taken, red = missed, gray = future)
- Below the dot: dose taken that day in small text (e.g. "0.5mg")
- Tapping a past day opens a modal to retroactively log/unlog it, including dose selection

### Notification Logic
⏸ **Deferred to later phase.** The reminder time is saved in settings but no notifications are triggered in v1.

---

## Screen 2: INR Tracker

### Purpose
Log INR test results with full details and visualize the trend over time.

### UI Components

#### Add INR Result Form
A card at the top with:

| Field | Type | Notes |
|---|---|---|
| INR Value | Number input (step 0.1, min 0.5, max 10) | e.g. `2.4` |
| Date of Test | Date input | Defaults to today |
| Weekly Dose (auto-calculated) | Read-only display | Sum of pill_log doses in the 7 days before this test date. Shows e.g. "6.5mg this week (13 days since last test)". Editable override allowed. |
| Target Range | Two number inputs: Min / Max | Saved globally (not per entry); default `2.0` – `3.0` |
| Notes | Textarea (optional) | Doctor comments, dosage changes, etc. |

- **"Save Result"** button — appends to localStorage array, clears form (except target range)
- Validation: INR value required; date required; show inline errors if missing

#### Target Range Setting
- Shown once at the top of the form: **"Your target INR range: 2.0 – 3.0"**
- Tapping opens an inline edit (or modal) to update min/max
- Saved globally in localStorage; used for chart coloring and status badges

#### INR Trend Chart
- Line chart (recharts `LineChart`) showing INR values over time
- X-axis: test dates
- Y-axis: INR value
- **Reference band**: shaded green area between target min and max
- **Data points**: colored dots — green if in range, orange if slightly out, red if far out (>0.5 from range boundary)
- Chart scrolls horizontally if many data points
- Shows last 10 entries by default; "Show all" toggle

#### INR History List
- Scrollable list of past results, newest first
- Each entry card shows:
  - Date (e.g. "March 3, 2025")
  - INR value (large, color-coded: green/orange/red vs target range)
  - Status badge: `IN RANGE` / `ABOVE RANGE` / `BELOW RANGE`
  - Notes preview (truncated, tap to expand)
  - Delete button (with confirmation)
- Empty state: *"No INR results yet. Add your first result above."*

---

## Screen 3: INR Prediction

### Purpose
Use the patient's recorded dose history and past INR results to estimate what their current INR is likely to be today. Only shown when at least 2 INR results exist.

### When to Show
- If fewer than 2 INR results exist: show a placeholder card — *"Add at least 2 INR results to see your prediction."*
- If 2+ INR results exist: show the full prediction card

### Prediction Model

Simple, transparent, two-step calculation using the most recent completed INR interval. Not a clinical algorithm — intentionally easy to follow and verify.

#### Step 1 — Compute the per-mg rate from the reference period

The reference period is the time between the two most recent INR tests.

```
total_dose_in_period = sum of all pill_log doses between INR_start_date and INR_end_date
rate = (INR_end - INR_start) / total_dose_in_period
```

**Example:** Week 1 = 7mg, Week 2 = 6.5mg → total = 13.5mg. INR went 2.0 → 2.2. Rate = 0.2 ÷ 13.5 = 0.0148 per mg.

#### Step 2 — Project to today

```
dose_since_last_test = sum of all pill_log doses after INR_end_date up to today
INR_predicted = INR_last + (dose_since_last_test × rate)
```

**Example:** 10.5mg taken since last test. Predicted change = 10.5 × 0.0148 = 0.155. Predicted INR = 2.2 + 0.155 = 2.36 → displayed as **2.4**.

**Caps**: never display below 0.5 or above 10. If dose_since_last_test = 0, predicted = INR_last.

### UI Components

#### Prediction Card
- Headline: **"Estimated INR Today"**
- Large number showing predicted value (e.g. `2.6`), color-coded vs target range using same logic as INR screen
- Status badge: `LIKELY IN RANGE` / `LIKELY ABOVE` / `LIKELY BELOW`
- Sub-line: *"Based on your last test (2.4 on Mar 3) and 6.5mg/week since then"*
- Confidence note in small text: *"This is an estimate only. Always confirm with a blood test."*

#### How It Was Calculated (expandable section)
Collapsible "Show calculation" toggle revealing:
- Last INR: value + date
- Dose taken since then: X mg over Y days (= Z mg/week)
- Sensitivity used: `±X INR per mg/week` (from last interval)
- Formula used: plain English explanation, e.g.:
  > *"Your INR dropped 0.4 points when you took 6.5mg/week last time. You've taken 6.5mg/week since your last test, so we estimate a similar effect."*

#### Recent Intervals Summary Table
A small table showing the data used:

| Period | Start INR | End INR | Avg Weekly Dose | Change |
|---|---|---|---|---|
| Feb 3 → Mar 3 | 2.8 | 2.4 | 6.5mg | −0.4 |
| Jan 5 → Feb 3 | 3.0 | 2.8 | 7.0mg | −0.2 |

#### Prediction on the INR Chart
On the INR tab chart, also render the predicted point as a **dashed dot** at today's date, visually distinct from confirmed readings (e.g. hollow circle, dashed line leading to it, labeled "Est.").

### Edge Cases for Prediction

| Scenario | Behavior |
|---|---|
| No pill_log entries since last INR test | Use last known weekly dose as the assumption; show note: *"No dose log since last test — using previous week's dose as estimate."* |
| Only 1 day since last test | Show prediction but note: *"Only 1 day since last test — estimate less reliable."* |
| Dose changed significantly since last test | If current weekly dose differs >30% from dose used in sensitivity calculation, show amber warning: *"Your dose has changed significantly — prediction may be less accurate."* |
| Predicted value > 4.0 (outside safe range) | Show red warning: *"Predicted INR is high. Consider contacting your doctor before your next scheduled test."* |
| Predicted value < 1.5 | Show orange warning: *"Predicted INR may be low. Consider contacting your doctor."* |



### Key: `pill_log`
```json
[
  { "date": "2026-03-07", "takenAt": "08:32", "takenTimestamp": 1741337520000, "doseMg": 0.5 },
  { "date": "2026-03-06", "takenAt": "09:01", "takenTimestamp": 1741251660000, "doseMg": 0.5 }
]
```

### Key: `pill_settings`
```json
{
  "availableStrengths": [0.5, 1.0, 2.0],
  "defaultDoseMg": 0.5,
  "reminderTime": "08:00"
}
```

### Key: `reminder_time`
```json
"08:00"
```
*(kept for backwards compatibility; `pill_settings.reminderTime` is the source of truth)*

### Key: `inr_results`
```json
[
  {
    "id": "uuid-or-timestamp",
    "date": "2026-03-05",
    "value": 2.4,
    "weeklyDoseMg": 6.5,
    "weeklyDoseOverridden": false,
    "notes": "Dose unchanged, feeling well",
    "createdAt": 1741165200000
  }
]
```

- `weeklyDoseMg`: auto-calculated from `pill_log` for the 7 days before this test date, but user can override it
- `weeklyDoseOverridden`: `true` if the user manually edited the auto-calculated value

### Key: `inr_target_range`
```json
{ "min": 2.0, "max": 3.0 }
```

---

## INR Status Color Logic

```
value < target.min - 0.5        → RED    (Significantly Below)
value < target.min              → ORANGE (Below Range)
value >= target.min && value <= target.max → GREEN (In Range)
value > target.max              → ORANGE (Above Range)
value > target.max + 0.5        → RED    (Significantly Above)
```

---

## PWA Requirements

⏸ **Deferred to later phase** alongside notifications. In v1 the app runs as a standard web app without a service worker or manifest. PWA installability and offline support will be added once the core screens are approved.

---

## Visual Design Direction

- **Theme**: Clean medical/wellness — white background, green accent (health), calm blue secondary
- **Color palette**:
  - Primary action: `#16a34a` (green-600)
  - Danger/alert: `#dc2626` (red-600)
  - Warning: `#ea580c` (orange-600)
  - Background: `#f0fdf4` (green-50)
  - Cards: white with subtle shadow
- **Typography**: Readable at mobile sizes; pill status uses large text (2xl+)
- **Spacing**: Generous padding on cards; nothing cramped
- **Tone**: Calm, trustworthy, clinical-lite — not playful, not scary

---

## Edge Cases & UX Notes

| Scenario | Behavior |
|---|---|
| User denies notification permission | Show persistent banner: "Enable notifications to get daily reminders" with retry button |
| User opens app after midnight before taking pill | Show yesterday and today separately; do not auto-carry over |
| User enters duplicate INR entry for same date | Allow it — doctor might test twice; show both in history |
| INR value entered > 8 | Show warning: "This is a very high INR — please contact your doctor." (non-blocking) |
| No INR results yet | Show empty state illustration + encouraging copy |
| App closed at reminder time | Service worker notification fires if SW is registered and permission granted |
| No pill_log entries for a day in the past 7 days | Treat as 0mg for weekly dose calculation; show note in INR form: "X days with no logged dose included as 0mg" |
| User changes pill strength mid-period | Historical entries keep their recorded doseMg; only future defaults change |
| User adds INR result for a past date with no pill_log data | Weekly dose auto-calculates as 0 with a note; user should override manually |

---

## Deferred to Later Phase

- **Browser notifications & Service Worker** — reminder time is stored in settings but scheduling is not yet wired up
- **PWA / installable to home screen** — manifest and service worker added after core app is approved
- **Offline support** — follows PWA phase

## Out of Scope (v1)

- User accounts / cloud sync
- Multiple medication support
- Doctor sharing / PDF export (nice-to-have for v2)
- Clinical-grade INR prediction algorithms (the built-in model is a simple linear estimate only)

---

## Development Phases

### Phase 1 — Mockups (current)
Design and approve static mockups for all three screens before writing any app code.

### Phase 2 — Core App
Build the React + TypeScript app with all three screens, data models, and prediction logic. No notifications yet.

### Phase 3 — Notifications & PWA
Add Web Notifications API, Service Worker, manifest, and offline caching.

---

## Acceptance Criteria (Phase 2)

- [ ] User can configure their pill strength(s) and default dose in Settings
- [ ] Reminder time field is present in Settings (saved, not yet active)
- [ ] User can mark today's pill as taken (with dose) with one tap
- [ ] Last 7 days of pill history shows dose taken per day
- [ ] User can add an INR result with value, date, auto-calculated weekly dose (editable), target range, and notes
- [ ] INR chart shows trend with target range band, color-coded points, and a dashed predicted point
- [ ] INR history list shows all entries, newest first, with delete
- [ ] Target range is saved and persists across sessions
- [ ] Prediction tab shows estimated current INR when 2+ results exist, with plain-English explanation
- [ ] Prediction tab shows safety warnings when predicted INR is outside safe range
- [ ] All data persists in localStorage across page reloads
- [ ] Responsive layout works well on 375px–430px screen widths (iPhone SE → iPhone Pro Max)
- [ ] Full TypeScript — no `any` types on data models
