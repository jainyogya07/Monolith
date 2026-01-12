import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function setLoad(load: number) {
    await fetch(`${BASE_URL}/admin/stress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load })
    });
}

async function sendTask(type: string, payload: any) {
    return fetch(`${BASE_URL}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload })
    }).then(r => r.json());
}

async function runRampTest() {
    console.log('>>> TEST: Ramp-Up Verification (Anticipation Check)');

    // 1. Initial State: Low Load
    await setLoad(20);
    console.log('Phase 1: Low Load (20%) - Baseline');
    await sendTask('STANDARD', {}); // Warmup

    // 2. Ramp Up to High Load (Enable Guardrail)
    // But we also need the Queue to be non-empty for the Forecaster to panic.
    await setLoad(80);
    console.log('Phase 2: High Load (80%) + Queue Building');

    // 3. Clog the Queue
    // Send 20 "Heavy" background tasks. They have high cost, so they block the queue.
    // Note: RiskModel assigns cost=100 for BACKGROUND.
    // processingTime = cost * 10 = 1000ms per task.
    // 20 tasks = 20 seconds of work. Queue should grow.
    // 20 tasks was too few (Forecast assumes 100 tasks/sec capacity).
    // SLA is 500ms -> 50 tasks capacity.
    // We need > 50 tasks to trigger violation. Let's send 80.
    console.log('Building backlog with 80 heavy tasks...');
    const clogPromises = [];
    for (let i = 0; i < 80; i++) {
        // These might be accepted because queue is initially empty
        clogPromises.push(sendTask('BACKGROUND', { heavy: true }));
    }
    await Promise.all(clogPromises);

    // 4. Probe with more Background tasks
    // Now queue should be deep (~20). 
    // Forecaster: 20 items * 10ms (avg in forecaster) = 200ms. 
    // Wait, StressForecaster assumes AVG_PROCESS_TIME_MS = 10.
    // But our queue processing is actually doing 1000ms.
    // This is a mismatch in model vs reality (which is fine, models are imperfect).
    // But even with 10ms assumption, if we pump enough, it should trigger.
    // Let's send a deluge of probes.

    console.log('Sending Probe Batch (should be dropped)...');
    const probePromises = [];
    for (let i = 0; i < 50; i++) {
        probePromises.push(sendTask('BACKGROUND', { probe: true }));
    }

    const results = await Promise.all(probePromises);
    const drops = results.filter((r: any) => r.action === 'drop' && r.reason === 'forecasted_sla_violation');

    if (drops.length > 0) {
        console.log(`✅ PASS: Anticipation Active! Dropped ${drops.length}/50 tasks.`);
        console.log('       Reason: forecasted_sla_violation');
        // Log one metric to confirm
        console.log('       Sample Metric:', JSON.stringify((drops[0] as any).metrics.forecast));
    } else {
        console.error('❌ FAIL: No preventive drops occurred.');
        process.exit(1);
    }
}

runRampTest();
