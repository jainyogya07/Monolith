# Forecasting Assumptions

This document lists the explicit assumptions and simplifications made in the `StressForecaster` Monte Carlo simulation.

## What We Assume (The Model)
1.  **Poisson Arrivals**: Incoming tasks arrive independently, following a Poisson distribution.
2.  **Stable Average Processing Time**: We assume a baseline processing cost for tasks, though we simulate variance around it.
3.  **Short Horizon**: We only simulate the next **1 second**. Any impact beyond 1s is ignored.
4.  **Single Worker Queue**: We model the system as a single processing queue (node event loop behavior).

## What We Ignore (The Simplifications)
1.  **GC Pauses**: We do not currently model stopping-the-world garbage collection spikes.
2.  **Network Latency**: We assume "arrival" means "in memory". Network I/O is external.
3.  **Dependency Failures**: We assume the database/external services are constant speed (or part of the processing variance).

## What Can Go Wrong (Risks)
1.  **Correlated Bursts**: If users coordinate attacks (non-Poisson), we might under-predict load.
2.  **Heavy Tail Tasks**: If a single task takes 10s (violating assumptions), the model will be wrong for that window.
