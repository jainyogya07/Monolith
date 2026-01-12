# Monolith - Visualizer Walkthrough (Realism)

## Goal
Make the invisible visible. Visualize the stress on the system and use real metrics (Event Loop Lag) instead of simulations.

## What We Built

### 1. Physics-Based Visualizer (`client`)
- **Visuals**: A Gravity Well representing the CPU core.
- **Particles**: Orbiting dots representing queued tasks.
    - **Spawn Rate** = Queue Depth.
    - **Orbit Speed** = Load / Lag.
    - **Core Size** = Raw Event Loop Lag.
- **Color Coding**:
    - 🟢 Green: Healthy
    - 🟡 Yellow: Loaded
    - 🔴 Red: Critical / Dropping

### 2. Event Loop Lag Monitoring (`server`)
- Removed artificial `currentLoad` (0-100).
- Implemented `perf_hooks` monitoring in `QueueManager.ts`.
- **Lag Metric**: Measures how much the Node.js event loop is blocked.
    - < 10ms: Healthy
    - > 100ms: Struggling

### 3. Real-Time Streaming
- **Socket.IO**: Streams `queueLength`, `systemLoad`, and `rawLag` to the frontend every 100ms.

## Verification
1.  **Start System**:
    - Server: `npm run dev` (Port 3000)
    - Client: `npm run dev` (Port 5173)
2.  **Open Browser**: `http://localhost:5173` -> See the void.
3.  **Inject Stress**:
    - Run `npx ts-node src/test-ramp.ts`.
    - **Observation**:
        - Gravity well turns RED.
        - Particle count explodes (Queue building).
        - Particles spin faster (System stress).
        - Console logs show **Preventive Drops**.

## Conclusion
Monolith is now a fully functional, self-protecting, and observable system.

![Blank Page Check](/Users/yogayjain/.gemini/antigravity/brain/129e7d80-0b12-42b9-87fe-62db1db6a0d2/sentinel_demo_final_1768204431282.webp)
*Verification of Monolith Visualizer Online Status*
