import { CompilerOptions } from "typescript";
import ContextsMap from "@plugin/File/ContextsMap";

export enum FileTypes
{
    File,
    Typescript,
    TypescriptDefinition
}

/**
 * Handles tracking Typescript registered files which will be set by the FileTypes. Currently, we don't support
 * files that are outside the scope of Typescript's SourceFiles.
 * @see FileTypes
 * @see FileHelpers.IsTypescriptFile
 * @see FileHelpers.IsReadOnlyTypescriptDefinitionFile
 */
export interface File
{
    kind: FileTypes;
    compilerOptions: CompilerOptions;
    fileName: string;
    project: string;
}


/**
 * Represents a readonly library file; Typically, external files that were found inside node_modules included
 * by a project.
 */
export interface ReadOnlyTypescriptDefinitionsFile extends File
{
    readonly kind: FileTypes.TypescriptDefinition;
}

/**
 * Represents an internal file that can be processed by rollup.
 * By setting the destPath, destText or defPath defText, the file can be converted to a TypescriptWithDestinationFile
 * or TypescriptWithDefinitionsFile using IsDestinationSet and IsDefinitionSet
 * TODO update documentation
 */
export interface TypescriptFile extends File
{
    readonly kind: FileTypes.Typescript;
}

export enum ContextType
{
    Source,
    Destination,
    Definition,
    Declaration
}

export interface Context
{
    type: ContextType;
}

export interface ContextData extends Context
{
    text: string;
}

export interface ContextSource extends ContextData
{
    type: ContextType.Source;
}

export interface ContextDestination extends ContextData
{
    type: ContextType.Destination;
}

export interface ContextDefinition extends ContextData
{
    type: ContextType.Definition;
}
/**
 * The details from this primarily come from Typescript itself.
 * In the future, it would be possible to replace node-resolve or hook into it in a way to speed it up,
 * as Typescript already has a pretty good resolver for .js node_module dependencies. As of right now,
 * we are eating up resources with redundancies.
 */
export interface ContextDeclaration extends Context
{
    destPath: string;
    extension: string;
    external?: boolean;
    packageId?: { name: string, subModuleName: string, version: string }
}

/**
 * Defines a reverse lookup of a Context.
 */
export interface ContextPathData<T extends Context>
{
    path: string,
    contextPath: string,
    context: T
    file: File
}


export type ContextsElement =
    [
        key: string,
        contexts: ContextsMap
    ];

