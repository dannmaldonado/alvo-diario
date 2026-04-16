# Cumulative Time Fix — Testing Guide

## Bug Fixed
When user clicks "Mais Estudo" (repeat study block), the progress bar showing cumulative minutes was resetting to zero, losing all previously accumulated study time.

**Root Cause:** The `getCumulativeMinutes()` function recalculated based on `currentPhaseIdx`, which moved backward when `repeatPhase()` was called.

## Solution Implemented
Added a **snapshot-based cumulative tracking** system in `/apps/web/src/hooks/useStudySession.ts`:

### Changes Made

1. **New State:** `cumulativeSnapshot` (line 213)
   - Stores cumulative minutes when decision screen appears
   - Cleared when advancing to next phase

2. **Modified `getCumulativeMinutes()`** (lines 283-305)
   ```typescript
   // If snapshot exists (repeat state), use: snapshot + current elapsed
   if (cumulativeSnapshot > 0) {
     return cumulativeSnapshot + Math.ceil(currentPhaseElapsed / 60);
   }
   // Otherwise, use normal calculation
   ```

3. **Modified `handlePhaseComplete()`** (lines 321, 329, 338)
   - Captures snapshot before showing decision screen
   - Applied to: revisao_intervalo, estudo_intervalo, questoes phases

4. **Modified `goToNextPhase()` and `goToPhase()`** (lines 347, 368)
   - Clear snapshot when advancing to preserve normal calculation

## How It Works

### Repeat Phase Flow
1. User studies → Timer completes
2. `handlePhaseComplete()` captures: `setCumulativeSnapshot(80)` (example)
3. Decision screen appears showing "Mais Estudo" or "Ir para Questões"
4. **Progress bar shows 80/240** (NOT reset)
5. User clicks "Mais Estudo" → `repeatPhase(2)` called
6. Snapshot is NOT cleared
7. `getCumulativeMinutes()` returns: `80 + currentPhaseElapsed`
8. **Progress bar increments from 80** (81, 82, ... 105)

### Advance Phase Flow
1. User clicks "Ir para Questões"
2. `goToPhase(4)` clears snapshot: `setCumulativeSnapshot(0)`
3. `getCumulativeMinutes()` uses normal calculation
4. Full time (previous + repeat) is now counted in phases

## Testing Checklist

### Quick Test (5 minutes)
1. Open http://localhost:3000/estudo
2. Study revisão (25 min) → wait or fast-forward
3. After revisao_intervalo breaks (5 min), decision screen appears
4. **VERIFY:** Progress bar shows ~30 min (not reset)
5. Click "Mais Revisão"
6. **VERIFY:** Progress bar still shows ~30 min (not 0)

### Comprehensive Test (Manual or Fast-Forward)

#### Phase 1: revisao → revisao_intervalo → Decision
1. Start study session (phase 0: revisao)
2. Timer completes 25 min → auto-advance to revisao_intervalo
3. Timer completes 5 min (intervalo) → decision screen appears
   - Snapshot = 30 min (25 + 5)
   - **VERIFY:** Header shows "Hoje: 30min" ✅
   - **VERIFY:** Progress bar shows 30/240 ✅

#### Phase 2: Advance to estudo
4. Click "Ir para Estudo" (advance)
   - Snapshot cleared (now = 0)
   - **VERIFY:** Progress bar still shows 30/240 ✅

#### Phase 3: estudo → estudo_intervalo → Decision (BUG WAS HERE)
5. Study estudo 25 min (full duration) → auto-advance to estudo_intervalo
   - Cumulative now = 30 + 25 = 55 min
6. Timer completes 5 min (intervalo) → decision screen appears
   - Snapshot = 60 min (55 + 5)
   - **VERIFY:** Header shows "Hoje: 60min" (NOT reset to 0) ✅ **← THIS WAS THE BUG**
   - **VERIFY:** Progress bar shows 60/240 (NOT reset to 0/240) ✅ **← THIS WAS THE BUG**

#### Phase 4: Repeat estudo (MAIN TEST)
7. Click "Mais Estudo" (repeat)
   - Snapshot preserved (still = 60)
   - Phase resets to estudo (idx 2), timer resets to 25:00
   - **VERIFY:** Header shows "Hoje: 60min" (still preserved) ✅ **← FIX VERIFICATION**
   - **VERIFY:** Progress bar shows 60/240 (snapshot used) ✅ **← FIX VERIFICATION**

#### Phase 5: Study the repeated estudo phase
8. Study for 10 min
   - getCumulativeMinutes() = 60 + 10 = 70
   - **VERIFY:** Header shows "Hoje: 70min" ✅
   - **VERIFY:** Progress bar shows 70/240 ✅

## Expected Behavior After Fix

| Scenario | Before Fix | After Fix | Status |
|----------|-----------|-----------|--------|
| Decision screen shows | ✅ Works | ✅ Works | ✓ |
| Click "Mais Estudo" | ❌ Progress resets to 0 | ✅ Progress preserved | **FIXED** |
| Progress bar increments during repeat | ❌ Starts from 0 | ✅ Increments from snapshot | **FIXED** |
| Click "Ir para Questões" | N/A | ✅ Snapshot cleared, normal calc | ✓ New |
| Multiple repeats work | ❌ Loses time | ✅ All time accumulates | **FIXED** |

## Code Review

The fix modifies only `/apps/web/src/hooks/useStudySession.ts`:
- **Line 213:** Add `cumulativeSnapshot` state
- **Lines 283-305:** Modify `getCumulativeMinutes()` to use snapshot
- **Lines 321, 329, 338:** Capture snapshot in `handlePhaseComplete()`
- **Lines 347, 368:** Clear snapshot in `goToNextPhase()` and `goToPhase()`

## Build Status
- ✅ TypeScript compilation: PASS
- ✅ ESLint: PASS (no errors)
- ✅ Dev server: Running on http://localhost:3000

## Deployment Notes
This fix should be deployed immediately as it addresses a critical UX bug where users lose study time credit when repeating phases.
