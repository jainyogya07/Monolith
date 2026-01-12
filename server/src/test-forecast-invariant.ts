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

async function testForecastInvariant() {
    console.log('>>> TEST: Forecast Critical Invariant Check');

    // 1. Set High Load to enable Forecast (Guardrail)
    await setLoad(80);
    console.log('Phase 1: High Load (80%)');

    // 2. Clog Queue to Ensure BAD Forecast
    console.log('Building backlog with 80 heavy tasks...');
    const clogPromises = [];
    for (let i = 0; i < 80; i++) {
        clogPromises.push(sendTask('BACKGROUND', { heavy: true }));
    }
    await Promise.all(clogPromises);

    // 3. Send CRITICAL Task
    // Even with a terrible forecast (Queue ~80 -> 800ms -> P(Fail) ~1.0),
    // Critical tasks (Priority ~90) should be ACCEPTED because the policy is:
    // if (prob > 0.8 && priority < 50) -> DROP

    console.log('Sending CRITICAL task into dangerous territory...');
    const result = await sendTask('CRITICAL', { important: true }) as any;

    if (result.action === 'accept') {
        console.log('✅ PASS: CRITICAL task accepted despite forecast risk.');
        if (result.metrics.forecast) {
            console.log('       Forecast was BAD:', JSON.stringify(result.metrics.forecast));
        } else {
            console.log('       Note: Forecast metrics missing (maybe queue drained too fast?)');
        }
    } else {
        console.error('❌ FAIL: CRITICAL task was DROPPED by forecast!');
        console.error('       Result:', JSON.stringify(result, null, 2));
        process.exit(1);
    }
}

testForecastInvariant();
