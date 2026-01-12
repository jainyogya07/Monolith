# Monolith 🪨

> **A Self-Protecting, Risk-Aware Decision Engine for Systems Under Stress.**

Monolith is a research system that demonstrates how backend systems can actively protect themselves. Instead of reacting only after queues explode and latency ruins the user experience, Monolith **anticipates failure**, prioritizes critical work, and sheds load intelligently.

It is not a product. It is a foundational engineering artifact designed to study and prove correct behavior under stress.

---

## 🧠 Why Monolith?

When system demand exceeds capacity, most backends fail in predictable, painful ways:
*   Queues grow without bound.
*   Latencies explode non-linearly.
*   High-priority requests starve behind low-priority ones.
*   Recovery is slow or impossible ("death spiral").

Many systems shed load reactively, often too late. **Monolith explores a different approach:**

> **Make admission decisions based on real system stress and forecasted risk — _before_ failure happens.**

---

## 🛡️ The 3-Layer Defense Model

Monolith defends itself using three explicit layers, each addressing a different failure mode.

### **Layer 1: Reactive Protection**
*   **Trigger**: System load > 95%.
*   **Action**: Immediately drops low-priority tasks.
*   **Goal**: Ensures the system does not spiral once saturation is reached.
*   📖 **[Architecture Deep Dive](docs/ARCH_DEEP_DIVE.md)**

### **Layer 2: Anticipatory Forecasting**
*   **Mechanism**: Bounded **Monte Carlo simulations** (N = 100).
*   **Action**: Estimates the probability that a queued task *will* violate the SLA (500ms). If `P(SLA violation) > 0.8` -> task is pre-rejected.
*   **Goal**: Saves resources by not processing tasks destined to fail.
*   📖 **[Monte Carlo Forecaster](docs/MONTE_CARLO.md)**

### **Layer 3: Real-Time Stress Awareness**
*   **Mechanism**: Monitors **Node.js Event Loop Lag** directly.
*   **Action**: Detects actual CPU blocking (>100ms lag) instantly throttles ingestion.
*   **Goal**: Reacts to internal resource starvation, not just external request volume.
*   📖 **[Visualization & Metrics](docs/VISUALIZER.md)**

---

## 🕹️ Demo Playbook

Monolith includes a physics-based visualizer that makes system stress visible in real time.

### 1️⃣ Start the System

```bash
# Terminal 1: Backend
cd server && npm install && npm run dev

# Terminal 2: Frontend
cd client && npm install && npm run dev
```

**Open:** [http://localhost:5173](http://localhost:5173). You should see a green gravity well (healthy system).

### 2️⃣ The Doom Ramp (Predictive Overload)
Flood the system with heavy tasks and observe preventive drops.
```bash
npx ts-node src/test-ramp.ts
```
*Watch: Queue particles multiply, Core grows unstable, and Tasks get dropped due to "Forecasted SLA Violation".*

### 3️⃣ God Mode (Manual Stress Injection)
Force stress to validate UI and decision behavior.
```bash
curl -X POST http://localhost:3000/admin/stress \
  -H "Content-Type: application/json" \
  -d '{"load":100}'
```
*The core should immediately turn 🔴 and begin shedding load.*

### 4️⃣ Controlled Failure Drills 🧪
Run deterministic failure injections to validate invariants.
```bash
npx ts-node src/test-drills.ts 1  # Event Loop Starvation
npx ts-node src/test-drills.ts 2  # Queue Flood
npx ts-node src/test-drills.ts 3  # Priority Inversion (VIPs Only)
npx ts-node src/test-drills.ts 4  # Recovery Validation
```
📖 **[View Failure Drill Report](docs/FAILURE_DRILLS.md)**

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    User -->|Submit Task| MonolithAPI
    MonolithAPI --> RiskModel
    RiskModel -->|Priority & Cost| DecisionEngine
    DecisionEngine -->|Check Lag| QueueManager
    DecisionEngine -->|Forecast SLA| MonteCarloForecaster

    MonteCarloForecaster -->|P(Fail) > 0.8| Drop[Drop Task]
    DecisionEngine -->|Safe| Queue[Execution Queue]

    QueueManager -->|Event Loop Lag| Visualizer
```

---

## 🚫 Non-Goals

Monolith is **NOT**:
*   A drop-in production library.
*   A distributed or multi-node system.
*   An autoscaler or load balancer replacement.

Monolith **IS**:
*   A reference decision engine.
*   A resilience engineering experiment.
*   A system for studying overload behavior.

---

## 📄 License

MIT. Built for resilience engineering research and systems education.

---

> *Freezing Monolith here is not limitation — it is discipline. Strong systems end where their responsibility ends.*
