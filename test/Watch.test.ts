import Watch from "@plugin/Watch";
import {performance} from "perf_hooks";
import { performanceMonitor, timeout } from "@test/resources/TestHelpers";

describe( 'Ensure Watcher behaves as expected to preserve sync', function () {



    test("A) Triggered in under 1000 MS", async () => {
        let monitor = performanceMonitor();
        let watch = new Watch(1000);

        performance.mark( "A" );
        await watch.rollupWait();
        performance.measure( 'A', 'A' );
        let results = await monitor;

        expect(results['A']).toBeDefined();
        expect(results['A'].duration).toBeLessThanOrEqual(5);
    },100000);

    test( "B) Watch will be allowed to resume after 500 ms", async () => {
        let monitor = performanceMonitor();
        let watch = new Watch(500);

        performance.mark("B");
        watch.rollupWatchTriggered();
        await watch.rollupWait();
        performance.measure('B', 'B');
        let results = await monitor;

        expect(results['B'].duration).toBeGreaterThanOrEqual(500);
    });

    test( "C) Typescript notices a file change before Rollup", async () => {
        let watch = new Watch(1000);

        watch.typescriptStarted();
        setTimeout( () => {
            watch.typescriptEnded();
        }, 100);
        await timeout(10);
        watch.rollupWatchTriggered();
        await watch.rollupWait();
    });

    test( "D) Rollup notices a file change before Typescript", async () => {
        let watch = new Watch(1000);

        watch.rollupWatchTriggered();
        setTimeout( () => {
            watch.typescriptStarted();
            setTimeout( () => {
                watch.typescriptEnded();
            }, 100);
        },100);
        await watch.rollupWait();
    });

    // watch.rollupWatchTriggered();
} );