import { Context, File } from "./Definitions";
/**
 * Keeps track of all the contexts assigned to a source path.
 *
 * Context paths must all be unique per source.
 */
export default class ContextsMap implements Iterable<Context> {
    file: File;
    readonly contexts: Map<string, Context>;
    constructor(file?: File);
    [Symbol.iterator](): Iterator<Context>;
}
