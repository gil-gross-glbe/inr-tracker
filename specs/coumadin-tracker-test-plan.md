# Coumadin Tracker — Test Plan

## Overview

This document describes what should happen in the app across three levels:
1. **Behavioural tests** — plain-English descriptions of expected behaviour (the source of truth)
2. **Unit tests** — code-level tests for pure functions and logic
3. **E2E tests** — full user flows through the browser (Playwright)

All code must be fully covered. No feature ships without a corresponding test at each level.

---

## Part 1: Behavioural Descriptions

These are written in plain English. They describe observable outcomes from the user's perspective. They are the spec that unit and E2E tests must prove correct.

---

### Screen 1 — Pill Tab

#### Daily pill status

- When the user opens the app on a day they have not yet logged a pill, the screen shows "Have you taken your Coumadin today?" and the pill icon is grey.
- When the user opens the app on a day they have already logged a pill, the screen shows "Taken today at [time] — [dose]mg" and the pill icon is green.
- The current date is always shown below the status message.

#### Dose selector

- Four dose options are shown: 0.25mg, 0.5mg, 0.75mg, 1.0mg.
- The default dose (set in Settings) is pre-selected when the screen loads.
- The user can tap a different dose to select it before confirming.
- Only one dose can be selected at a time.
- The "Mark as taken" button label updates to reflect the currently selected dose (e.g. "Mark as taken (0.75mg)").

#### Logging a dose

- When the user taps "Mark as taken", today's date, the current time, and the selected dose are saved.
- The screen immediately updates to show the "taken" state without requiring a page reload.
- If the user taps "Edit today's entry", the dose selector reappears and the user can change the dose and save again, overwriting the previous entry for today.

#### 7-day history strip

- The strip always shows exactly the last 7 days including today.
- Today shows as a grey "?" dot if not yet logged.
- Past days show as a green "✓" dot with the dose below if a dose was logged.
- Past days show as a red "✕" dot with "—" below if the day passed without a log being saved (auto-marked at midnight).
- The dose label under each dot shows the exact mg value logged, or "—" if not taken.
- Tapping any past day opens the edit modal for that day.

#### Edit modal for a past day

- The modal shows the date of the day being edited.
- All four dose options are shown; the currently saved dose (if any) is pre-selected.
- The user can select a dose and tap "Save" to update the log for that day.
- The user can tap "Mark as skipped (✕)" to explicitly record a skipped day (or to change a previously logged day to skipped).
- After saving, the history strip updates immediately to reflect the change.
- The modal can be dismissed without saving by tapping outside it or a cancel control.

#### Settings panel

- The Settings panel is hidden by default and revealed by tapping the "Settings" button.
- Tapping "Settings" again collapses the panel.
- The panel shows the four fixed pill strengths: 0.25mg, 0.5mg, 0.75mg, 1.0mg (all pre-selected, not editable in v1).
- The user can change the default dose from a dropdown of the four options.
- The daily reminder time field is present but marked "coming soon" and is not interactive in v1.
- All settings changes save immediately to localStorage without a save button.

---

### Screen 2 — INR Tab

#### Add INR result form

- The form is always visible at the top of the screen.
- The INR value field accepts decimal numbers between 0.5 and 10 (step 0.1).
- The date field defaults to today's date.
- The weekly dose field is auto-calculated as the sum of all doses logged in the 7 days before the entered test date, rounded to 2 decimal places. It is shown as read-only with a note "(X of 7 days logged)".
- If fewer than 7 days of pill logs exist before the test date, the note says how many days were found (e.g. "3 of 7 days logged").
- The user can tap the weekly dose field to override it manually.
- The target range fields (min and max) default to 2.0 and 3.0. Once changed, the new values persist across sessions.
- The notes field is optional and accepts free text.
- Tapping "Save result" validates the form. If INR value or date is missing, inline error messages appear and no data is saved.
- On successful save, the form clears (except target range) and the new result appears at the top of the history list.

#### INR trend chart

- The chart shows all saved INR results as a connected line, ordered by date oldest to newest.
- A green shaded band is drawn between the target range min and max across the full width of the chart.
- Each data point is coloured: green if within range, orange if outside range by up to 0.5, red if outside range by more than 0.5.
- If 2 or more INR results exist, a dashed line extends from the last confirmed point to a hollow dashed circle representing the predicted value at today's date, labelled "Est.".
- If fewer than 2 results exist, no predicted point is shown.
- The x-axis shows abbreviated month labels. The y-axis shows INR values.

#### INR history list

- Results are listed newest first.
- Each entry shows: date, INR value (colour-coded), status badge (In range / Above / Below), and notes preview.
- Tapping an entry expands the notes in full.
- A delete button on each entry triggers a confirmation prompt before deleting.
- After deletion the list and chart update immediately.
- When no results exist, an empty state message is shown: "No INR results yet. Add your first result above."

---

### Screen 3 — Predict Tab

#### When to show the prediction

- If fewer than 2 INR results are saved, the prediction card is replaced by a placeholder: "Add at least 2 INR results to see your prediction."
- If 2 or more INR results are saved, the full prediction card is shown.

#### Prediction calculation

The prediction uses the most recent completed INR interval (the period between the two most recent INR tests).

Step 1 — Compute the per-mg rate from the reference period:
```
rate = (INR_end - INR_start) / total_dose_in_period
```
Where total_dose_in_period is the sum of all doses logged between INR_start date and INR_end date (inclusive).

Step 2 — Apply the rate to the dose taken since the last test:
```
dose_since_last_test = sum of all doses logged after the last INR test date up to today
predicted_INR = INR_last + (dose_since_last_test × rate)
```

The result is rounded to 1 decimal place for display.

**Example:**
- Week 1: 7.0mg. Week 2: 6.5mg. Total: 13.5mg.
- INR went from 2.0 to 2.2. Change = +0.2.
- Rate = 0.2 ÷ 13.5 = 0.0148 per mg.
- Since last test: 10.5mg taken.
- Predicted change = 10.5 × 0.0148 = 0.155.
- Predicted INR = 2.2 + 0.155 = 2.36 → displayed as 2.4.

#### Prediction card content

- The estimated INR value is shown large, colour-coded vs the target range.
- A status badge shows: "Likely in range", "Likely above range", or "Likely below range".
- A sub-line summarises the inputs: "Last test was [value] on [date]. You've taken [X]mg since then."
- A disclaimer reads: "Estimate only — always confirm with a blood test."

#### Calculation breakdown card

- Shows each step of the calculation with its numeric values:
  - Reference period dates and duration
  - Total dose in that period (broken down by week if 2 weeks)
  - INR change in that period
  - Computed per-mg rate
  - Dose taken since last test
  - Predicted change
  - Final predicted value with formula
- The formula is shown in plain English at the bottom.

#### Safety warnings

- If predicted INR > 4.0: show a red warning card — "Predicted INR is high. Consider contacting your doctor."
- If predicted INR < 1.5: show an orange warning card — "Predicted INR may be low. Consider contacting your doctor."
- Warnings appear above the calculation card and do not block use of the app.

#### No pill log data since last test

- If no doses have been logged since the last INR test, dose_since_last_test = 0, and predicted_INR = INR_last.
- A note is shown: "No doses logged since your last test — showing last known INR."

---

## Part 2: Unit Tests

> File: `src/__tests__/`
> Framework: **Vitest** + **React Testing Library**

### `pillLog.test.ts`

| Test | What it checks |
|---|---|
| `isToday(date)` returns true for today's date | Pure date utility |
| `isToday(date)` returns false for yesterday | Pure date utility |
| `getWeeklyDose(pillLog, referenceDate)` sums doses for the 7 days before referenceDate | Core dose calculation |
| `getWeeklyDose` returns 0 when no entries exist in range | Edge case |
| `getWeeklyDose` excludes entries outside the 7-day window | Boundary condition |
| `getWeeklyDose` counts partial weeks correctly (e.g. 3 of 7 days) | Partial data |
| `markDayAsSkipped(date)` saves a skipped entry with doseMg = 0 | Skipped day logic |
| `getPastNDays(n)` returns correct array of date strings | History strip utility |
| `getDayStatus(date, pillLog)` returns "taken" for a logged day | Status classification |
| `getDayStatus` returns "skipped" for an explicitly skipped day | Status classification |
| `getDayStatus` returns "missed" for a past day with no entry | Auto-miss logic |
| `getDayStatus` returns "today" for today with no entry | Status classification |

### `inrResults.test.ts`

| Test | What it checks |
|---|---|
| `getINRStatus(value, range)` returns "in-range" for value within min–max | Core classification |
| `getINRStatus` returns "above" for value above max | Core classification |
| `getINRStatus` returns "below" for value below min | Core classification |
| `getINRStatus` returns "above-danger" for value > max + 0.5 | Danger threshold |
| `getINRStatus` returns "below-danger" for value < min - 0.5 | Danger threshold |
| `sortINRResultsByDate` returns results ordered oldest to newest | Chart data prep |
| `validateINRForm` returns errors when value is missing | Form validation |
| `validateINRForm` returns errors when date is missing | Form validation |
| `validateINRForm` returns no errors for valid inputs | Happy path |
| `validateINRForm` rejects INR value of 0 | Boundary |
| `validateINRForm` rejects INR value above 10 | Boundary |

### `prediction.test.ts`

| Test | What it checks |
|---|---|
| `computePrediction` returns null when fewer than 2 INR results | Guard condition |
| `computePrediction` returns correct value for the worked example (2.0→2.2, 13.5mg, +10.5mg since) | Core formula |
| `computePrediction` returns `INR_last` when dose since last test is 0 | Zero-dose edge case |
| `computePrediction` handles negative rate (INR decreasing with dose) | Inverse response |
| `computePrediction` caps result at 10 maximum | Safety cap |
| `computePrediction` caps result at 0.5 minimum | Safety cap |
| `computePredictionRate` calculates (INR_end - INR_start) / total_dose correctly | Sub-function |
| `getPredictionStatus` returns "high-warning" for prediction > 4.0 | Warning logic |
| `getPredictionStatus` returns "low-warning" for prediction < 1.5 | Warning logic |
| `getPredictionStatus` returns "in-range" for value within target | Normal state |
| `getDoseSinceLastTest(pillLog, lastTestDate)` sums correctly | Input to prediction |
| `getDoseSinceLastTest` returns 0 when no logs exist after lastTestDate | Edge case |

### `localStorage.test.ts`

| Test | What it checks |
|---|---|
| `savePillLog(entries)` persists and `loadPillLog()` retrieves the same data | Round-trip |
| `saveINRResults(results)` persists and `loadINRResults()` retrieves correctly | Round-trip |
| `saveSettings(settings)` persists and `loadSettings()` retrieves correctly | Round-trip |
| `loadPillLog()` returns empty array when key does not exist | Default state |
| `loadSettings()` returns default values when key does not exist | Default state |
| Corrupted localStorage value returns default without throwing | Resilience |

---

## Part 3: E2E Tests

> Framework: **Playwright**
> File: `e2e/`
> Run against: local dev server (`npm run dev`)

### `pill-tab.e2e.ts`

| Scenario | Steps | Expected outcome |
|---|---|---|
| Mark pill as taken | Open app → confirm dose is 0.5mg pre-selected → tap "Mark as taken" | Status updates to "Taken today", green icon, time shown |
| Change dose before logging | Open app → tap 0.75mg → tap "Mark as taken" | Entry saved as 0.75mg, history strip shows "0.75" |
| Edit today's entry | Log 0.5mg → tap "Edit today's entry" → select 1.0mg → save | History strip updates to "1.0", stored value is 1.0mg |
| Edit a past day | Open app with 7-day history → tap Wednesday dot → select 0.5mg → save | Wednesday dot turns green, shows "0.5" |
| Mark a past day as skipped | Tap a day that was green → tap "Mark as skipped" → save | Day turns red ✕, mg shows "—" |
| Open and close settings | Tap "Settings" → panel appears → tap "Settings" again | Panel collapses |
| Change default dose | Open settings → change default to 0.25mg → close → reopen app | Dose selector pre-selects 0.25mg |
| Auto-missed day | Seed pill log with no entry for 3 days ago | That day shows red ✕ automatically |

### `inr-tab.e2e.ts`

| Scenario | Steps | Expected outcome |
|---|---|---|
| Add a valid INR result | Navigate to INR tab → enter 2.4, today's date → tap Save | Result appears at top of history list, form clears |
| Weekly dose auto-fills | Seed 5 pill log entries (0.5mg each) in past 7 days → open INR form | Weekly dose field shows "2.5mg · 5 of 7 days logged" |
| Override weekly dose | Auto-filled dose shows 2.5mg → tap field → type 3.0 → save | Saved entry has weeklyDoseMg = 3.0, weeklyDoseOverridden = true |
| Validation — missing INR value | Leave INR value empty → tap Save | Error message appears, no entry saved |
| Validation — missing date | Leave date empty → tap Save | Error message appears, no entry saved |
| Delete a result | Tap delete on a history entry → confirm | Entry removed from list and chart |
| INR chart renders | Add 3+ results → view chart | Line and dots visible, green band visible between 2.0 and 3.0 |
| In-range badge | Add result with value 2.5, range 2.0–3.0 | Badge shows "In range" in green |
| Below-range badge | Add result with value 1.8, range 2.0–3.0 | Badge shows "Below" in orange |
| Above-range badge | Add result with value 3.6, range 2.0–3.0 | Badge shows "Above" in orange |

### `predict-tab.e2e.ts`  

| Scenario | Steps | Expected outcome |
|---|---|---|
| Placeholder shown with 0 results | Open predict tab with no INR data | Shows "Add at least 2 INR results" message |
| Placeholder shown with 1 result | Add 1 INR result → navigate to predict tab | Placeholder still shown |
| Prediction shown with 2+ results | Add 2 INR results with pill log data → navigate to predict | Prediction card visible with numeric estimate |
| Correct prediction value | Seed: INR 2.0 on Feb 18, INR 2.2 on Mar 3, doses 7mg+6.5mg, 10.5mg since last test | Displayed prediction = 2.4 (2.2 + 0.16 rounded) |
| High INR warning | Seed data that produces prediction > 4.0 | Red warning card shown |
| Low INR warning | Seed data that produces prediction < 1.5 | Orange warning card shown |
| No dose since last test | Seed 2 INR results but no pill log after last test | Prediction = last INR, note shown about no logged doses |
| Calculation card matches prediction | Any valid prediction state | Each row in the calc card matches the numbers used in the displayed result |

---

## Testing Rules for the Agent

1. Every function exported from `src/utils/` must have a corresponding unit test.
2. Every user-facing behaviour described in Part 1 must have a corresponding E2E test.
3. E2E tests must not depend on real dates — use a fixed test date injected via an env variable or test setup.
4. Unit tests must not touch localStorage directly — use the typed wrapper and mock it.
5. All tests must pass in CI before any PR is merged.
6. Test files live alongside source files: `pillLog.ts` → `pillLog.test.ts` in the same folder.
7. E2E tests live in `/e2e/` at the project root.
8. No `any` types in test files.
