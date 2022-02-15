import { SemanticDiagnosticsBuilderProgram, SolutionBuilder, SolutionBuilderHostBase, WatchStatusReporter } from "typescript";
/**
 * Helps create a SolutionBuilder with or without watch based on the watchMode toggle.
 *
 * Due to how similar these projects are, We don't need to create different configurations as the watch method on
 * SolutionBuilderPlugin will never be called when watch is disabled.
 */
export default class BuildMode {
    private readonly generateHostHooks?;
    private _host;
    private _solutionBuilder;
    get host(): SolutionBuilderHostBase<SemanticDiagnosticsBuilderProgram>;
    private set host(value);
    get solutionBuilder(): SolutionBuilder<SemanticDiagnosticsBuilderProgram>;
    private set solutionBuilder(value);
    private createWatchMode;
    private createExecuteMode;
    constructor(watchMode: boolean, generateHostHooks?: (host: SolutionBuilderHostBase<SemanticDiagnosticsBuilderProgram>) => void, watchDiagnosticsBind?: WatchStatusReporter);
}
