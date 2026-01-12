# Monolith - Monte Carlo Forecast (Layer 2)

## Goal
To transition Monolith from **Reactive** to **Anticipatory**. We predict `SlaViolation` risk.

## Implementation: `StressForecaster.ts`
We implemented a lightweight Monte Carlo simulator that runs **50 simulations** per decision.
- **Inputs**: Current Queue Depth, Incoming Task Cost.
- **Simulation**:
    - Samples random processing times (Gaussian distribution).
    - Checks if Total Time > SLA (500ms).
- **Output**: `failureProbability` (0.0 to 1.0).

## Integration
The `DecisionEngine` now consulted the Forecaster:
```typescript
if (failureProbability > 0.8 && priority < 50) {
    return DROP(Reason: "Forecasted SLA Violation");
}
```

## Verification
We ran `test-ramp.ts`:
- **Scenario**: Queue was filled with 80 tasks (800ms backlog).
- **Result**: Forecaster predicted 92% failure rate.
- **Action**: Monolith started dropping **BEFORE** the 500ms timeout occurred.

## Why this matters
We save resources. Instead of processing a task that will eventually time out, we fail fast.
