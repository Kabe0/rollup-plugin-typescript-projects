import { ContextParam, GeneratorEvents, IpsumFileContextGenerator } from "@test/resources/TestHelpers";
import {
    ContextData,
    ContextDeclaration,
    ContextDefinition,
    ContextDestination,
    ContextPathData,
    ContextSource
} from "@plugin/File/Definitions";
import FileRepositoryCacheTest from "@test/resources/FileRepositoryCacheTest";
import { FileHelpers } from "@plugin/File/FileHelper";
import { dirname } from "path";

const generatorProject1 = new IpsumFileContextGenerator();
generatorProject1.start();

const generatorProject2 = new IpsumFileContextGenerator();
generatorProject2.start();

let projects = [
    { configPath: "/some/project/path/tsconfig.json", project: generatorProject1 },
    { configPath: "/some/other/project/path/tsconfig.json", project: generatorProject2 },
    { configPath: "/some/project/sub/path/tsconfig.json", project: generatorProject1 },     // Used to track what happens when files override existing files.
    { configPath: "/some/project/path/tsconfig.json", project: generatorProject1 },         // Similar behaviour to an update as the project will have to clear itself.
];

let cache = new FileRepositoryCacheTest();
let projectContextCount = 0;

describe.each( projects )( "Using the File Repository Cache", ( { configPath, project } ) => {
    let projectBuilt = false;
    let contextEventMap: Map<GeneratorEvents, ContextParam[]> = new Map<GeneratorEvents, ContextParam[]>();

    project.contexts.forEach( ( [ event, path, contextPath, context, file ] ) => {
        if ( !contextEventMap.has( event ) ) contextEventMap.set( event, [ [ event, path, contextPath, context, file ] ] );
        else contextEventMap.get( event )?.push( [ event, path, contextPath, context, file ] );
    } );

    function getContexts( event: GeneratorEvents ): ContextParam[]
    {
        let contexts = contextEventMap.get( event );
        if ( contexts ) return contexts;
        return [];
    }

    /**
     * Call's all the functions inside "Adding Context and Flagging files"
     */
    function quickGenerate()
    {
        if ( projectBuilt ) return;
        cache.setAndResetProject( configPath );
        for ( let [ , path, contextPath, context,  ] of getContexts( GeneratorEvents.DeclarationsAdded ) ) {
            cache.registerDeclaration( path, contextPath, <ContextDeclaration>context );
        }
        for ( let [ , path, , , file ] of getContexts( GeneratorEvents.SourceAdded ) ) {
            cache.registerSource( path, file.text, file );
        }
        for ( let [ , path, contextPath, context,  ] of getContexts( GeneratorEvents.DestinationPreAdded ) ) {
            cache.registerIncompleteContext( path, contextPath );
        }

        for ( let [ , path, contextPath, context,  ] of getContexts( GeneratorEvents.DefinitionPreAdded ) ) {
            cache.registerIncompleteContext( path, contextPath );
        }

        for ( let [ , , contextPath, context,  ] of getContexts( GeneratorEvents.DestinationPostAdded ) ) {
            cache.registerTextWithContextPath( contextPath, ( <ContextDestination>context ).text );
        }

        for ( let [ , , contextPath, context, ] of getContexts( GeneratorEvents.DefinitionPostAdded ) ) {
            cache.registerTextWithContextPath( contextPath, ( <ContextDefinition>context ).text );
        }
        projectBuilt = true;
    }

    describe( "Pre-Command Tests", () => {
        let testCache = new FileRepositoryCacheTest();
        beforeEach(() => {
            testCache = new FileRepositoryCacheTest();
        })

        /** {@see SolutionBuilderPlugin.registerSource} {@see SolutionBuilderPlugin.setAndResetProject} **/
        test.each(getContexts(GeneratorEvents.SourceAdded))( "Adding a file before the project is ready ignores the file",
            (event, path, contextPath, context, file) => {
                testCache.registerSource( path, file.text, file );
                testCache.setAndResetProject( configPath );
                expect( testCache.hasFile( path ) ).toBeDefined();
            });

        /** {@see SolutionBuilderPlugin.registerSource} {@see SolutionBuilderPlugin.setAndResetProject} **/
        test.each(getContexts(GeneratorEvents.SourceAdded))( "Adding a file after the project is set, then the same project initialized again clears it.",
            (event, path, contextPath, context, file) => {
                testCache.setAndResetProject( configPath );
                testCache.registerSource( path, file.text, file );
                testCache.setAndResetProject( configPath );
                expect( testCache.hasFile( path ) ).toEqual( false );
            });

        test("Calling activeProject() returns null before setAndResetProject() is called", () => {
            testCache.setAndResetProject( configPath )
            expect( testCache.activeProject ).toEqual(configPath);
        });

        test("Calling activeProject() returns null before setAndResetProject() is called", () => {
            expect( testCache.activeProject ).not.toEqual(configPath);
        });

    });

    describe( "Adding Context and Flagging files", () => {
        // Used to track if this describes ran.
        beforeAll( () => {
            cache.setAndResetProject( configPath );
            projectBuilt = true;
        } );

        /** {@see SolutionBuilderPlugin.resolveModuleNames} **/
        describe( "Trigger first file load as found with resolveModuleNames()", () => {
            for ( let [ , path, contextPath, context,  ] of getContexts( GeneratorEvents.DeclarationsAdded ) ) {
                /** {@see FileRepositoryCache.registerDeclaration} **/
                test( "Registering a new Declaration from file upload", () => {
                    cache.registerDeclaration( path, contextPath, <ContextDeclaration>context );
                } );
            }
        } );

        /** {@see SolutionBuilderPlugin.validateProjects} **/
        describe( "Run validateProjects() execution, setting all source files with initial definitions.", () => {
            for ( let [ , path, , , file ] of getContexts( GeneratorEvents.SourceAdded ) ) {
                /** {@see FileRepositoryCache.registerSource} **/
                test( "Registering a new Source Context", () => {
                    cache.registerSource( path, file.text, file );
                } );
            }

            for ( let [ , path, contextPath, context,  ] of getContexts( GeneratorEvents.DestinationPreAdded ) ) {
                /** {@see FileRepositoryCache.registerIncompleteContext} **/
                test( "Registering a new Destination without Data", () => {
                    cache.registerIncompleteContext( path, contextPath );
                } );
            }

            for ( let [ , path, contextPath, context,  ] of getContexts( GeneratorEvents.DefinitionPreAdded ) ) {
                /** {@see FileRepositoryCache.registerIncompleteContext} **/
                test( "Registering a new Definition without Data", () => {
                    cache.registerIncompleteContext( path, contextPath );
                } );
            }
        } );
        //
        /** {@see SolutionBuilderPlugin.writeFile} **/
        describe( "Run writeFile() to retrieve context text for existing incomplete context's.", () => {
            for ( let [ , , contextPath, context,  ] of getContexts( GeneratorEvents.DestinationPostAdded ) ) {
                /** {@see FileRepositoryCache.registerTextWithContextPath} **/
                test( "Registering to an existing Destination", () => {
                    cache.registerTextWithContextPath( contextPath, ( <ContextDestination>context ).text );
                } );
            }

            for ( let [ , , contextPath, context,  ] of getContexts( GeneratorEvents.DefinitionPostAdded ) ) {
                /** {@see FileRepositoryCache.registerTextWithContextPath} **/
                test( "Registering to an existing Destination", () => {
                    cache.registerTextWithContextPath( contextPath, ( <ContextDefinition>context ).text );
                } );
            }
        } );
    } );

    describe( "Post - Results Check", () => {
        beforeAll( () => {
            quickGenerate();
        } );

        test( "Check if the context path match the number of source files expected.", () => {
            let files = cache.projectFiles.get( configPath );

            expect( files ).toBeDefined();
            if ( files ) expect( project.files.size ).toEqual( Array.from( files ).length );
        } );
        test( "Check if the context count matches what was expected.", () => {
            expect( cache.contextCounter ).toEqual( projectContextCount += project.contexts.length );
        } );
    } );

    describe( "Validate Get Methods", () => {

        beforeAll( () => {
            quickGenerate();
        } );

        /** {@see FileRepositoryCache.hasFile} {@see FileRepositoryCache.getFile} **/
        test.each( getContexts( GeneratorEvents.SourceAdded ) )(
            "Can retrieve source contexts generated from project",
            ( event, path, contextPath, context, file ) => {
                expect( cache.hasFile( path ) ).toEqual( true );
                expect( cache.getFile( path ) ).toEqual( file );
            } );

        /** {@see FileRepositoryCache.getContextSources} **/
        test( "Retrieve the right ContextSources", () => {
            expect( cache.getContextSources() ).toEqual( expect.arrayContaining( project.contexts.filter( ( ( [ , , , context,  ] ) => {
                return FileHelpers.IsContextSource( context );
            } ) ).map( ( [ , path, contextPath, context, file ] ) => {
                return <ContextPathData<ContextSource>>{ path: path, contextPath: contextPath, context: <ContextSource>context, file };
            } ) ) );
        } );

        /** {@see FileRepositoryCache.getContextDestinations} **/
        test( "Retrieve the right ContextDestinations", () => {
            expect( cache.getContextDestinations() ).toEqual( expect.arrayContaining( project.contexts.filter( ( ( [ event, , , context,  ] ) => {
                return FileHelpers.IsContextDestination( context ) && event == GeneratorEvents.DestinationPostAdded;
            } ) ).map( ( [ , path, contextPath, context, file ] ) => {
                return <ContextPathData<ContextDestination>>{
                    path: path,
                    contextPath: contextPath,
                    context: <ContextDestination>context,
                    file
                };
            } ) ) );
        } );

        /** {@see FileRepositoryCache.getContextDefinitions} **/
        test( "Retrieve the right ContextDefinitions", () => {
            expect( cache.getContextDefinitions() ).toEqual( expect.arrayContaining( project.contexts.filter( ( ( [ event, , , context,  ] ) => {
                return FileHelpers.IsContextDefinition( context ) && event == GeneratorEvents.DefinitionPostAdded;
            } ) ).map( ( [ , path, contextPath, context, file ] ) => {
                return <ContextPathData<ContextDefinition>>{ path: path, contextPath: contextPath, context: <ContextDefinition>context, file };
            } ) ) );
        } );

        /** {@see FileRepositoryCache.getSourceContext} **/
        test.each( getContexts( GeneratorEvents.SourceAdded ) )(
            "Can grab Context Source based objects",
            ( event, path, contextPath, context,  ) => {
                expect( cache.getSourceContext( path )?.context ).toEqual( context );
            } );

        /** {@see FileRepositoryCache.getSourceContext} **/
        test.each( getContexts( GeneratorEvents.DefinitionPreAdded ).concat( getContexts( GeneratorEvents.DeclarationsAdded ) ).concat( getContexts( GeneratorEvents.DestinationPreAdded ) ) )(
            "Requesting non Context Source based objects results in an error",
            ( event, path, contextPath,  ) => {
                expect( cache.getSourceContext( contextPath ) ).not.toBeDefined();
            }
        );

        /** {@see FileRepositoryCache.getDestinationFromPath} **/
        test.each( getContexts( GeneratorEvents.DestinationPostAdded ) )(
            "Can grab Context Destination based objects",
            ( event, path, contextPath, context,  ) => {
                expect( cache.getDestinationFromPath( path )?.context.text ).toEqual( (<ContextData> context)?.text );
            } );

        /** {@see FileRepositoryCache.getDestinationFromPath} **/
        test.each( getContexts( GeneratorEvents.DefinitionPreAdded ).concat( getContexts( GeneratorEvents.DeclarationsAdded ) ).concat( getContexts( GeneratorEvents.SourceAdded ) ) )(
            "Requesting non Context Destination based objects results in an error unless the file is Typescript and is a Source file.",
            ( event, path, contextPath, context, file ) => {
                if ( path != contextPath || !FileHelpers.IsTypescriptFile( file )) {
                    expect( cache.getDestinationFromPath( contextPath ) ).not.toBeDefined();
                } else {
                    expect( cache.getDestinationFromPath( contextPath ) ).toBeDefined();
                }
            }
        );

        /** {@see FileRepositoryCache.getDefinitionFromPath} **/
        test.each( getContexts( GeneratorEvents.DefinitionPostAdded ) )(
            "Can grab Context Definition based objects",
            ( event, path, contextPath, context,  ) => {
                expect( cache.getDefinitionFromPath( path )?.context.text ).toEqual( (<ContextData> context)?.text );
            } );

        /** {@see FileRepositoryCache.getDestinationFromPath} **/
        test.each( getContexts( GeneratorEvents.DestinationPreAdded ).concat( getContexts( GeneratorEvents.DeclarationsAdded ) ).concat( getContexts( GeneratorEvents.SourceAdded ) ) )(
            "Requesting non Context Definition based objects results in an error unless the file is Typescript and is a Source file.",
            ( event, path, contextPath, context, file ) => {
                if ( path != contextPath || !FileHelpers.IsTypescriptFile( file )) {
                    expect( cache.getDefinitionFromPath( contextPath ) ).not.toBeDefined();
                } else {
                    expect( cache.getDefinitionFromPath( contextPath ) ).toBeDefined();
                }
            }
        );


        /** {@see FileRepositoryCache.getDeclarationContext} **/
        test.each( getContexts( GeneratorEvents.DeclarationsAdded ) )(
            "Can grab Context Declaration based objects",
            ( event, path, contextPath, context,  ) => {
                expect( cache.getDeclarationContext( path, contextPath )?.context ).toEqual( context );
            } );

        /** {@see FileRepositoryCache.getDeclarationContext} **/
        test.each( getContexts( GeneratorEvents.DefinitionPreAdded ).concat( getContexts( GeneratorEvents.DestinationPreAdded ) ).concat( getContexts( GeneratorEvents.SourceAdded ) ) )(
            "Requesting non Context Declaration based objects results in an error",
            ( event, path, contextPath, ) => {
                expect( cache.getDeclarationContext( path, contextPath ) ).not.toBeDefined();
            } );

        /** {@see FileRepositoryCache.getContextText} **/
        test.each( getContexts( GeneratorEvents.DefinitionPostAdded ).concat( getContexts( GeneratorEvents.DestinationPostAdded ) ).concat( getContexts( GeneratorEvents.SourceAdded ) ) )(
            "Can grab ContextData Text based contextPath",
            ( event, path, contextPath, context,  ) => {
                expect( cache.getContextText( contextPath ) ).toEqual( ( <ContextData>context ).text );
            } );

        /** {@see FileRepositoryCache.getContextText} **/
        test.each( getContexts( GeneratorEvents.DeclarationsAdded ) )(
            "Requesting from a non ContextData type will fail",
            ( event, path, contextPath,  ) => {
                expect( cache.getContextText( contextPath ) ).toBeUndefined();
            } );


        /** {@see FileRepositoryCache.hasDirectory} **/
        test.each( project.contexts )(
            "Can retrieve the folder from the path and contextPath",
            ( event, path, contextPath,  ) => {
                expect( cache.hasDirectory( dirname( path ) ) ).toEqual( true );
                expect( cache.hasDirectory( dirname( contextPath ) ) ).toEqual( true );
            } );

        /** {@see FileRepositoryCache.hasDirectory} **/
        test.each( project.contexts )(
            "Full file path's will fail",
            ( event, path, contextPath,  ) => {
                expect( cache.hasDirectory( path ) ).not.toEqual( true );
                expect( cache.hasDirectory( contextPath ) ).not.toEqual( true );
            } );

        /** {@see FileRepositoryCache.consume} {@see FileRepositoryCache.getConsumedPaths} **/
        test.each( project.contexts )(
            "Verify that consuming a file will result in that file being stored in the cache.",
            ( event, path, ) => {
                cache.consume( path );
                expect( cache.getConsumedPaths() ).toContainEqual( path );
            } );

        /** {@see FileRepositoryCache.resetConsumed} {@see FileRepositoryCache.getConsumedPaths} **/
        test.each( project.contexts )(
            "Verify that resting the consumed cache will actually clear it.",
            () => {
                for( let [path,] of project.files ) {
                    cache.consume( path );
                }

                expect( cache.getConsumedPaths().length ).toEqual( project.files.size );
                cache.resetConsumed();
                expect( cache.getConsumedPaths().length ).toEqual( 0 );
            } );
    } );
} );