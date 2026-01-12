# Monolith - Architecture Deep Dive (Layer 1)

## Overview
We implemented the Core Decision Engine, the "brain" of Monolith.
It is responsible for:
1.  **Ingesting Tasks**: Accepting JSON payloads via HTTP.
2.  **Scoring Risk**: Calculating Priority and Complexity.
3.  **Making Decisions**: Deciding whether to `Accept` or `Drop` based on system load.

## Components

### 1. `RiskModel.ts`
- **Goal**: Quantify the "cost" of a task.
- **Logic**:
    - `CRITICAL` tasks (Payments) -> Priority 100
    - `STANDARD` tasks (Data) -> Priority 50
    - `BACKGROUND` tasks (Logs) -> Priority 10

### 2. `DecisionEngine.ts`
- **Goal**: Protect the system.
- **Logic**:
    - If `Load > 95%` AND `Priority < 30`: **DROP** (Shed background load).
    - If `Load > 100%`: **DROP ALL** (except Critical).

### 3. `QueueManager.ts`
- **Goal**: Execute tasks and track load.
- **Logic**:
    - Simulates processing time (`setTimeout`).
    - Tracks `currentLoad` (0-100).

## Verification
We verified this with `test-load.ts`:
- Sent 20 tasks.
- Spiked load to 100%.
- Observed `BACKGROUND` tasks being dropped while `CRITICAL` tasks passed.

## Evidence
- **Graceful Degradation**: System remained responsive.
- **Priority Respect**: Critical path protected.
