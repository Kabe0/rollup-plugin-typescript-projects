/**
 * Used by SolutionBuilderWatch to keep Typescript and Rollup file watching in sync.
 */
interface Wait
{
    resolve?: ( (value: (boolean | PromiseLike<boolean>)) => void );
    promise?: Promise<boolean>;
    end: ( forced: boolean ) => void;
}

/**
 * Promise helper to handle the watching.
 * @param timeout
 */
function generateWait( timeout?: number )
{
    let wait: Wait = {
        end: ( forced) => {
            if ( wait.resolve ) wait.resolve( forced );
            wait.resolve = undefined;
        }
    };

    if ( timeout ) {
        wait.promise = Promise.race<boolean>( [
            new Promise<boolean>( ( resolve ) => setTimeout( resolve, timeout, false ) ),
            new Promise<boolean>( ( resolve, ) => wait.resolve = resolve )
        ] );
    } else {
        wait.promise = new Promise<boolean>( ( resolve, ) => wait.resolve = resolve );
    }

    return wait;
}

/**
 * Balances the syncing between Typescript and Rollup.
 * When Rollup detects a change, it will initiate rollupWatchTriggered().
 * If typescriptStarted() is called before rolloutWait timeout occurs, Rollup will proceed to wait until typescript
 * can call typescriptEnded() which will allow rollup to continue.
 *
 * @see TypescriptPlugin.watchChange
 * @see TypescriptPlugin.load
 */
export default class Watch
{
    private readonly defaultTimeout: number;
    private rolloutWait?:Wait;
    private typescriptBuildWait?:Wait;

    constructor( defaultTimeout = 1000 )
    {
        this.defaultTimeout = defaultTimeout;
    }

    public typescriptStarted()
    {
        this.rolloutWait?.end(true);
        this.rolloutWait = undefined;
    }

    public typescriptEnded()
    {
        this.typescriptBuildWait?.end(true);
        this.rolloutWait = undefined;
        this.typescriptBuildWait = undefined;
    }

    public rollupWatchTriggered()
    {
        if ( !this.rolloutWait ) {
            this.rolloutWait = generateWait( this.defaultTimeout );
            this.typescriptBuildWait = generateWait();
        }
    }

    public async rollupWait(): Promise<void>
    {
        // Returns true if the rolloutWait was forced to end which means typescript has started to load.
        let forced = await this.rolloutWait?.promise;

        if ( !forced ) {
            this.rolloutWait = undefined;
            this.typescriptBuildWait = undefined;
        }

        await this.typescriptBuildWait?.promise;
    }
}