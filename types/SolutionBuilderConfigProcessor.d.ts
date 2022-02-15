import { CompilerOptions } from "typescript";
/**
 * Extended so we can add our own controls in the future.
 */
export interface ProjectOptions extends CompilerOptions {
}
export interface SolutionBuilderOptions {
    /**
     * Triggered when SolutionBuilderPlugin starts building. Will also be called on each watch detection.
     * @see SolutionBuilderPlugin.run
     * @see SolutionBuilderPlugin.watch
     */
    onBuilderStarting?: (() => void);
    /**
     * Triggered when SolutionBuilderPlugin has completed building.
     * @see SolutionBuilderPlugin.watch
     */
    onBuilderEnded?: (() => void);
    /**
     * A global flag that will apply to all config projects. Specific {@see projects} configs will override this one.
     */
    compilerOptions?: ProjectOptions;
    /**
     * Use the path of a TS config to modify that project's details. Example:
     * @example
     *     "./project/tsconfig.json": {
     *         compilerOptions: {
     *             sourceMap: true,
     *         }
     *     }
     */
    projects?: {
        [key: string]: ProjectOptions;
    };
}
/**
 * Processes config files, setting specific configurations ahead of time.
 */
export default class SolutionBuilderConfigProcessor implements SolutionBuilderOptions {
    static Process(config: SolutionBuilderOptions): SolutionBuilderOptions;
    /**
     * Checks for the project configuration, and modifies details as needed.
     *
     * In the future this may need to be its own class.
     * @param options
     * @private
     */
    private static processProjects;
}
