import {
    createSemanticDiagnosticsBuilderProgram, createSolutionBuilder, createSolutionBuilderHost,
    createSolutionBuilderWithWatch,
    createSolutionBuilderWithWatchHost, SemanticDiagnosticsBuilderProgram, SolutionBuilder, SolutionBuilderHostBase,
    sys, WatchStatusReporter
} from "typescript";

/**
 * Helps create a SolutionBuilder with or without watch based on the watchMode toggle.
 *
 * Due to how similar these projects are, We don't need to create different configurations as the watch method on
 * SolutionBuilderPlugin will never be called when watch is disabled.
 */
export default class BuildMode
{
    private readonly generateHostHooks?: ( host: SolutionBuilderHostBase<SemanticDiagnosticsBuilderProgram> ) => void;
    private _host!: SolutionBuilderHostBase<SemanticDiagnosticsBuilderProgram>;
    private _solutionBuilder!: SolutionBuilder<SemanticDiagnosticsBuilderProgram>;

    public get host(): SolutionBuilderHostBase<SemanticDiagnosticsBuilderProgram>
    {
        return this._host;
    }

    private set host( value: SolutionBuilderHostBase<SemanticDiagnosticsBuilderProgram> )
    {
        this._host = value;
    }

    public get solutionBuilder(): SolutionBuilder<SemanticDiagnosticsBuilderProgram>
    {
        return this._solutionBuilder;
    }

    private set solutionBuilder( value: SolutionBuilder<SemanticDiagnosticsBuilderProgram> )
    {
        this._solutionBuilder = value;
    }

    private createWatchMode( watchDiagnosticsBind?: WatchStatusReporter )
    {
        let host = createSolutionBuilderWithWatchHost(
            sys,
            createSemanticDiagnosticsBuilderProgram,
            undefined,
            undefined,
            watchDiagnosticsBind                           // Used to trigger typescript updates.
        );

        this.generateHostHooks?.( host );
        this.host = host;

        this.solutionBuilder = createSolutionBuilderWithWatch(
            host,
            [ process.cwd() ],    //TODO this needs to be a config override.
            {}
        );
    }

    private createExecuteMode()
    {
        let host = createSolutionBuilderHost(
            sys,
            createSemanticDiagnosticsBuilderProgram,
            undefined,
            undefined
        );

        this.generateHostHooks?.( host );
        this.host = host;

        this.solutionBuilder = createSolutionBuilder(
            host,
            [ process.cwd() ],    //TODO this needs to be a config override.
            {}
        );
    }

    constructor( watchMode: boolean, generateHostHooks?: ( host: SolutionBuilderHostBase<SemanticDiagnosticsBuilderProgram> ) => void, watchDiagnosticsBind?: WatchStatusReporter ) {
        this.generateHostHooks = generateHostHooks;

        if ( watchMode ) this.createWatchMode( watchDiagnosticsBind );
        else this.createExecuteMode();
    }
}