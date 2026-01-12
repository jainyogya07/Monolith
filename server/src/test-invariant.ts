import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function setLoad(load: number) {
    await fetch(`${BASE_URL}/admin/stress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load })
    });
}

async function testCriticalInvariant() {
    console.log('>>> TEST: Verifying Critical Task Invariant');

    // 1. Max Stress
    await setLoad(100);
    console.log('    System Load set to 100%');

    // 2. Submit Critical Task
    const response = await fetch(`${BASE_URL}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'CRITICAL',
            payload: { test: 'invariant' }
        })
    });

    const result = await response.json() as any;

    // 3. Assert
    if (result.action === 'accept') {
        console.log('✅ PASS: Critical task accepted under 100% load.');
        console.log(`       Metrics: Priority ${result.metrics.priority.toFixed(1)} > Load ${result.metrics.load}`);
    } else {
        console.error('❌ FAIL: Critical task was DROPPED!');
        console.error('       Result:', JSON.stringify(result, null, 2));
        process.exit(1);
    }

    // Cleanup
    await setLoad(0);
}

testCriticalInvariant();
