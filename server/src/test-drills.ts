import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function sendTask(type: string, payload: any) {
    try {
        const res = await fetch(`${BASE_URL}/task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, payload })
        });
        return await res.json();
    } catch (e) {
        return { error: 'e.message' };
    }
}

async function triggerBlock() {
    try {
        await fetch(`${BASE_URL}/block`);
    } catch (e) { }
}

async function runDrill(drillName: string) {
    console.log(`\n>>> STARTING DRILL: ${drillName.toUpperCase()} <<<\n`);

    if (drillName === '1') {
        // --- EXPERIMENT 1: Event Loop Starvation ---
        console.log('🧪 EXPERIMENT 1: Event Loop Starvation');
        console.log('Sending concurrent blocking requests to freeze the Node.js event loop...');

        // Fire 20 concurrent requests to /block
        // Each blocks for 300ms. 20 * 300ms = 6000ms of potential blocking if serial, 
        // but Node is single threaded so they will serialize and BLOCK EVERYTHING.
        const blocks = [];
        for (let i = 0; i < 20; i++) {
            blocks.push(triggerBlock());
            // Also send some normal tasks to see them get stuck/dropped
            if (i % 2 === 0) sendTask('STANDARD', { msg: 'I am stuck' });
        }
        await Promise.all(blocks);
        console.log('✅ Experiment 1 Complete. Check Visualizer for RED CORE and High Lag.');
    }

    else if (drillName === '2') {
        // --- EXPERIMENT 2: Queue Flood ---
        console.log('🧪 EXPERIMENT 2: Queue Flood (Async Pressure)');
        console.log('Flooding system with 500 tasks to overwhelm Queue without blocking CPU too much...');

        const flood = [];
        for (let i = 0; i < 500; i++) {
            flood.push(sendTask('STANDARD', { lighter: true }));
            // Slight delay to prevent local socket exhaustion, but fast enough to flood
            if (i % 50 === 0) await new Promise(r => setTimeout(r, 10));
        }
        await Promise.all(flood);
        console.log('✅ Experiment 2 Complete. Check Visualizer for MASSIVE PARTICLE ORBIT.');
    }

    else if (drillName === '3') {
        // --- EXPERIMENT 3: Priority Inversion ---
        console.log('🧪 EXPERIMENT 3: Priority Inversion');
        console.log('Interleaving 200 BACKGROUND tasks with 10 CRITICAL tasks...');

        const mixed = [];
        // Send Background flood
        for (let i = 0; i < 200; i++) {
            mixed.push(sendTask('BACKGROUND', { noise: true }).then((r: any) => {
                if (r.action === 'drop') process.stdout.write('.');
            }));

            // Inject Critical every 20 items
            if (i % 20 === 0) {
                mixed.push(sendTask('CRITICAL', { vip: true }).then((r: any) => {
                    if (r.action === 'accept') console.log('\n✅ CRITICAL ACCEPTED mid-flood');
                    else console.error('\n❌ CRITICAL DROPPED!');
                }));
            }
        }
        await Promise.all(mixed);
        console.log('\n✅ Experiment 3 Complete. Backgrounds should be dropped, Criticals accepted.');
    }

    else if (drillName === '4') {
        // --- EXPERIMENT 4: Recovery ---
        console.log('🧪 EXPERIMENT 4: Recovery Observation');
        console.log('Injecting short burst of chaos, then waiting for cleanliness...');

        // 1. Chaos
        for (let i = 0; i < 10; i++) {
            triggerBlock();
            sendTask('STANDARD', {});
        }
        console.log('Chaos injected. Waiting 5s...');

        // 2. Wait
        await new Promise(r => setTimeout(r, 5000));

        // 3. Probe
        const res = await sendTask('STANDARD', { probe: true }) as any;
        if (res.action === 'accept') {
            console.log('✅ System Recovered. Probe accepted.');
        } else {
            console.log('❌ System still failing. Probe result:', res);
        }
    }

    else {
        console.log('Usage: npx ts-node src/test-drills.ts <1|2|3|4>');
    }
}

const drill = process.argv[2];
runDrill(drill);
