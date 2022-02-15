/**
 * Balances the syncing between Typescript and Rollup.
 * When Rollup detects a change, it will initiate rollupWatchTriggered().
 * If typescriptStarted() is called before rolloutWait timeout occurs, Rollup will proceed to wait until typescript
 * can call typescriptEnded() which will allow rollup to continue.
 *
 * @see TypescriptPlugin.watchChange
 * @see TypescriptPlugin.load
 */
export default class Watch {
    private readonly defaultTimeout;
    private rolloutWait?;
    private typescriptBuildWait?;
    constructor(defaultTimeout?: number);
    typescriptStarted(): void;
    typescriptEnded(): void;
    rollupWatchTriggered(): void;
    rollupWait(): Promise<void>;
}
