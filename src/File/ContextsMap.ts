import { Context, File } from "./Definitions";

export default class ContextsMap implements Iterable<Context>
{
    public file: File;
    public readonly contexts: Map<string, Context> = new Map<string, Context>();

    constructor( file?: File )
    {
        if ( !file ) file = <File> {};
        this.file = file;
    }

    [Symbol.iterator](): Iterator<Context> {
        return this.contexts.values();
    }
}