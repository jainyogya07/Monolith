import fetch from 'node-fetch';

const TYPES = ['CRITICAL', 'HIGH_PRIORITY', 'STANDARD', 'BACKGROUND'];

async function sendTask(i: number) {
    const type = TYPES[Math.floor(Math.random() * TYPES.length)];
    try {
        const response = await fetch('http://localhost:3000/task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                payload: { validData: true, index: i }
            })
        });
        const data = await response.json();
        console.log(`Task ${i} [${type.padEnd(13)}]: ${(data as any).status} ${(data as any).reason || ''}`);
    } catch (err) {
        console.error(`Task ${i} failed request`);
    }
}

async function setLoad(load: number) {
    console.log(`\n>>> INJECTING STRESS: Setting System Load to ${load}%\n`);
    await fetch('http://localhost:3000/admin/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load })
    });
}

async function run() {
    console.log('Starting load test...');

    // Normal Batch
    for (let i = 0; i < 10; i++) {
        await sendTask(i);
        await new Promise(r => setTimeout(r, 50));
    }

    // Inject High Load
    await setLoad(99);

    // Stressed Batch
    for (let i = 10; i < 30; i++) {
        await sendTask(i);
        await new Promise(r => setTimeout(r, 50));
    }

    // Back to normal
    await setLoad(10);

    // Recovery Batch
    for (let i = 30; i < 40; i++) {
        await sendTask(i);
        await new Promise(r => setTimeout(r, 50));
    }
}

run();
