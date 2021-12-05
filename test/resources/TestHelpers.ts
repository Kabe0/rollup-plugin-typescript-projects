import {
    Context,
    ContextDeclaration,
    ContextDefinition,
    ContextDestination, ContextSource,
    ContextType,
    File,
    FileTypes
} from "@plugin/File/Definitions";
import { LoremIpsum } from "lorem-ipsum";
import { adjectives, animals, colors, Config, uniqueNamesGenerator } from "unique-names-generator";
import ContextsCollection from "@plugin/File/ContextsCollection";
import { OutputAsset, OutputChunk, OutputOptions, RollupBuild } from "rollup";
import { PerformanceObserver } from "perf_hooks";

let nameConfig: Config = {
    dictionaries: [adjectives, colors, animals],
    style: 'lowerCase'
};

/**
 * Creates a random int within the min-max range.
 * @param max
 * @param min
 */
function getRandomInt( max: number, min: number = 0 )
{
    return min + Math.floor( Math.random() * ( max + 1 ) );
}

export interface TestFile extends File
{
    name: string;
    ext?: string;
    text: string;
    textAfter?: string;
    directoryPath: string;
}

export let importReferences: string[] = [
    "./example/path/{file}",
    "/some/file/example/{file}",
    "@some/file/example/{file}"
];

export enum GeneratorEvents
{
    SourceAdded = "source-added",
    DeclarationsAdded = "declarations-added",
    DestinationPreAdded = "destination-pre-added",
    DestinationPostAdded = "destination-post-added",
    DefinitionPreAdded = "definition-pre-added",
    DefinitionPostAdded = "definition-post-added"
}

export type ContextParam =
    [
        event: GeneratorEvents,
        path: string,
        contextPath: string,
        context: Context,
        file: TestFile
    ];

/**
 * Automatically generates a set of random files filled with Ipsum text, then creates relationship contexts similar
 * to how a real project might be configured.
 */
export class IpsumFileContextGenerator
{
    public files: Map<string, TestFile> = new Map<string, TestFile>();
    public contexts: ContextParam[] = [];
    private readonly minFiles:number;
    private lorem: LoremIpsum = new LoremIpsum();

    constructor( minFiles:number = 45 ) { this.minFiles = minFiles }

    public start()
    {
        // Keep looping till we reach the required file amount.
        while( this.files.size < this.minFiles ) {
            this.generateFiles();
        }

        for( let [ path, file ] of this.files ) {
            this.generateContexts( path, file );
        }
    }

    public generateContextCollection(): ContextsCollection
    {
        let contextsCollection = new ContextsCollection();
        for( let context of this.contexts ) {
            ((  event, path, contextPath, context, file ) => {
                contextsCollection.assign( path, contextPath, context, file );
            })(...context);
        }
        return contextsCollection;
    }

    private generateFiles( path: string = "", depth:number = 0 )
    {
        let folderName = uniqueNamesGenerator(nameConfig);
        let directoryPath = `${path}/${folderName}`;

        let fileCount = getRandomInt(5, 1);
        for( let i = fileCount; i--; ) {
            let kind = getRandomInt(2);     // 0-2
            let ext = ".ts";
            let name = uniqueNamesGenerator(nameConfig);
            let file: TestFile;

            switch ( kind ){
                case FileTypes.Typescript:
                    ext = ".ts";
                    file = <TestFile> {
                        name,
                        ext,
                        kind: FileTypes.Typescript,
                        compilerOptions: { outDir: "example" },
                        text: this.lorem.generateParagraphs(3),
                        textAfter: this.lorem.generateParagraphs(getRandomInt(3,1)),
                        directoryPath
                    };
                    break;
                case FileTypes.TypescriptDefinition:
                    ext = ".d.ts";
                    file = <TestFile> {
                        name,
                        ext,
                        kind: FileTypes.TypescriptDefinition,
                        text: this.lorem.generateParagraphs(getRandomInt(3,1)),
                        directoryPath
                    };
                    break;
                default:
                case FileTypes.File:
                    ext = ".js";
                    file = <TestFile>  {
                        name,
                        ext,
                        kind: FileTypes.File,
                        text: this.lorem.generateParagraphs(getRandomInt(3,1)),
                        directoryPath
                    };
                    break;
            }

            this.files.set(`${directoryPath}/${name}${ext}`, file );
        }

        // Don't go deeper than 5.
        if ( depth + (Math.random() * 5) < 5 ) {
            for( let i = getRandomInt(3,1); i--; ) {
                if ( Math.random() > 0.6 ) this.generateFiles( directoryPath, depth + 1 );
            }
        }
    }

    private generateContexts( path: string, file: TestFile )
    {
        let outDirectory = `/out${file.directoryPath}`;

        let keys = Array.from( this.files.keys() );

        this.contexts.push( [ GeneratorEvents.SourceAdded, path, path, <ContextSource>{ type: ContextType.Source, text: file.text }, file ] );

        if ( file.kind == FileTypes.Typescript ) {
            let declarationCount = getRandomInt( 5 );
            let used: string[] = [];
            for( let i = declarationCount; i--; ) {
                let declarationPath = keys[getRandomInt( keys.length - 1 )];
                let declarationFile = this.files.get( declarationPath );
                if ( used.includes(declarationPath) || !declarationFile || declarationFile == file ) continue;    // This is not really important, as it will make our data more random.
                used.push( declarationPath );

                this.contexts.push( [
                    GeneratorEvents.DeclarationsAdded,
                    path,
                    importReferences[ getRandomInt( importReferences.length - 1 ) ].replace( "{file}", declarationFile.name ),
                    <ContextDeclaration> {
                        type: ContextType.Declaration,
                        destPath: declarationPath,
                        external: Boolean(getRandomInt(1)),
                        extension: file.ext
                    },
                    file
                ]);
            }

            // Two results as typically the text will be set after the fact.
            this.contexts.push( [GeneratorEvents.DestinationPreAdded, path, `${outDirectory}/${file.name}.js`, <Context>{ type: ContextType.Destination }, file ] );
            this.contexts.push( [GeneratorEvents.DestinationPostAdded, path, `${outDirectory}/${file.name}.js`, <ContextDestination>{ type: ContextType.Destination, text: this.lorem.generateParagraphs(getRandomInt(3, 1) ) }, file ] );

            this.contexts.push( [GeneratorEvents.DefinitionPreAdded, path, `${outDirectory}/${file.name}.d.ts`, <Context>{ type: ContextType.Definition }, file ] );
            this.contexts.push( [GeneratorEvents.DefinitionPostAdded, path, `${outDirectory}/${file.name}.d.ts`, <ContextDefinition>{ type: ContextType.Definition, text: file.textAfter }, file ] );
        }
    }
}

export interface CodeDetails {
    code: OutputChunk['code'] | undefined;
    fileName: OutputChunk['fileName'] | OutputAsset['fileName'];
    source: OutputAsset['source'] | undefined;
}

/**
 * Taken from {@link https://github.com/rollup/plugins/blob/master/util/test.js}.
 * Maps out the results or returns the code of the first result from the generated bundle.
 *
 * @param bundle
 * @param outputOptions
 * @param allFiles
 */
export async function getCode(bundle: RollupBuild, outputOptions: OutputOptions | null | undefined, allFiles: false): Promise<string>;
export async function getCode(bundle: RollupBuild, outputOptions: OutputOptions | null | undefined, allFiles: true): Promise<CodeDetails[]>
export async function getCode(bundle: RollupBuild, outputOptions: OutputOptions | null | undefined, allFiles: boolean = true): Promise<CodeDetails[]|string>
{
    const { output } = await bundle.generate(outputOptions || { format: 'cjs', exports: 'auto' });

    if (allFiles) {
        // @ts-ignore
        return output.map( ( ( {code, fileName, source, map} ) => {
            return { code, fileName, source, map };
        }));
    }
    const [{ code }] = output;
    return code;
}

/**
 * Used to track each measure made in a file. Will trigger the countdown of endMs when
 * performance mark + measure is triggered.
 * @param endMs Number of ms between requests before the performance monitor resolves.
 */
export async function performanceMonitor( endMs: number = 500 ){
    return new Promise<{ [key: string]:any }>( async ( resolve ) => {
        let results: { [key: string]:any } = {};
        let markCount = 0;
        let measureCount = 0;
        let timeout:NodeJS.Timeout|undefined;

        let obs = new PerformanceObserver( (list) => {
            markCount += list.getEntriesByType( 'mark' ).length;

            list.getEntriesByType('measure').forEach( entry => { results[entry.name] = entry; measureCount++; } );

            if ( timeout ) clearTimeout( timeout );

            // Delay just to make sure no more mark() calls are made.
            timeout = setTimeout(() => {
                if ( measureCount >= markCount ) resolve( results );
            }, endMs);
        });

        obs.observe({ entryTypes: ['measure','mark'] } );
    });
}

/**
 * Can be used to sleep an async thread.
 * @param ms
 */
export async function timeout(ms:number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}