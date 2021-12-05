import ContextsCollection from "@plugin/File/ContextsCollection";
import { FileHelpers } from "@plugin/File/FileHelper";
import { dirname } from "path";
import { GeneratorEvents, IpsumFileContextGenerator, TestFile } from "@test/resources/TestHelpers";
import { ContextType } from "@plugin/File/Definitions";

const generator = new IpsumFileContextGenerator();
generator.start();

describe("Managing a ContextsCollection history", () =>{
    let contextsCollection = new ContextsCollection();

    describe.each( generator.contexts )(
        "Can Manage the Context after assign() %s - %s - %s",
    ( event, path, contextPath, context, file ) => {

            // Only add a file if it's a source request, as it's unlikely anything else will contain a file in it in Typescript.
            file = <TestFile> contextsCollection.assign( path, contextPath, context, event == GeneratorEvents.SourceAdded ? file : undefined );
            let expectedContextPathObject = { context, path, contextPath: contextPath, file };

            test( "File exists within assign()", () => {
                expect( file ).toBeDefined();
            });

            /** {@see ContextsCollection.getContext} */
            test( "getContext() retains proper details", () => {
                let contextPathObject = contextsCollection.getContext( contextPath );

                if ( FileHelpers.IsContextDeclaration( context ) ) {
                    expect( contextPathObject?.context ).not.toEqual( context );
                } else {
                    expect( contextPathObject?.context ).toEqual( context );
                    expect( contextPathObject?.contextPath ).toEqual( contextPath );
                    expect( contextPathObject?.file ).toBeDefined();
                }
            });

            /** {@see ContextsCollection.getFile} {@see ContextsCollection.hasFile} */
            test( "getFile() && hasFile() returns file with both paths", () => {
                if ( FileHelpers.IsContextDeclaration( context ) ) {
                    expect( contextsCollection.getFile( path ) ).toBe( file );
                    expect( contextsCollection.getFile( contextPath ) ).not.toEqual( file );

                    expect( contextsCollection.hasFile( path ) ).toEqual( true );
                    expect( contextsCollection.hasFile( contextPath ) ).not.toEqual( true );
                } else {
                    expect( contextsCollection.getFile( path ) ).toBe( file );
                    expect( contextsCollection.getFile( contextPath ) ).toEqual( file );

                    expect( contextsCollection.hasFile( path ) ).toEqual( true );
                    expect( contextsCollection.hasFile( contextPath ) ).toEqual( true );
                }
            });

            /** {@see ContextsCollection.getContexts} */
            test( "getContexts() returns the proper context collection path", () => {
                let contexts = contextsCollection.getContexts( path );
                expect( contexts ).toBeDefined();
                expect( contexts?.file ).toBe( file );
                expect( contexts?.contexts.get( contextPath ) ).toEqual( context );
            });

            /** {@see ContextsCollection.getContextsOfType} */
            test( "getContextsOfType() returns the context we expect", () => {
                if ( !FileHelpers.IsContextDeclaration( context ) ) {
                    expect( contextsCollection.getContextsOfType( context.type ) ).toContainEqual( expectedContextPathObject );
                }
            });

            /** {@see ContextsCollection.getContextsOfTypePath} */
            test( "getContextsOfTypePath() returns the context we expect", () => {
                expect( contextsCollection.getContextsOfTypePath( path, context.type ) ).toContainEqual( expectedContextPathObject );
            });

            /** {@see ContextsCollection.getFirstContextsOfTypePath} */
            test( "getFirstContextsOfTypePath() returns the context we expect", () => {
                if ( FileHelpers.IsContextDestination( context ) ) {
                    expect( contextsCollection.getFirstContextsOfTypePath( path, context.type ) ).toEqual( expectedContextPathObject );
                }
            });

            /** {@see ContextsCollection.getContextFromPath} */
            test( "getContextFromPath() is able to retrieve the correct file", () => {
                expect( contextsCollection.getContextFromPath( path, contextPath ) ).toEqual( expectedContextPathObject );
            });

            /** {@see ContextsCollection.directoryExists} */
            test( "directoryExists() exists when I ask for a files folder", () => {
                expect( contextsCollection.directoryExists( dirname(path) ) ).toEqual( true );
                expect( contextsCollection.directoryExists( dirname(contextPath) ) ).toEqual( true );
            });
    });

    describe( "Validate Generated Contexts", () => {
        let collection: ContextsCollection;
        beforeEach( () => {
            collection = generator.generateContextCollection();
        });

        /** {@see ContextsCollection.getContextFromPath} */
        test( "getContextFromPath() Cannot retrieve a malformed request", () => {
            expect( contextsCollection.getContextFromPath( "unknown", "unknown" ) ).toBeUndefined();
        });

        test.each( generator.contexts )(
            "Test where path is valid but context is wrong",
            (event, path, ) => {
            expect( contextsCollection.getContextFromPath(path, "unknown")).toBeUndefined();
        });

        /** {@see ContextsCollection.getContextsOfTypePath} */
        test( "getContextsOfTypePath() Cannot retrieve a malformed request, but returns an array to be graceful", () => {
            expect( contextsCollection.getContextsOfTypePath( "unknown", ContextType.Source ) ).toEqual([]);
        });

        /** {@see ContextsCollection.[Symbol.iterator]} */
        test( "[Symbol.iterator] functions as expected", () => {
            let count = 0;
            for ( let val of collection ) {
                count++;
            }
            expect( count ).toEqual( generator.files.size );
        })
        /** {@see ContextsCollection.files} */
        test( "Files match expected count from source", () => {
            expect( generator.files.size ).toEqual( collection.files.length );
        });
        /** {@see ContextsCollection.deleteByFile} */
        /** {@see ContextsCollection.deleteByPath} */
    });
});


describe( "Path Cleanup", () => {
    let collection: ContextsCollection;
    beforeEach( () => {
        collection = generator.generateContextCollection();
    });

    /** {@see ContextsCollection.deleteByFile} */
    test.each(Array.from(generator.files.entries()))( "Test deleting files directly", ( path, file ) => {
        collection.deleteByFile( file );
        expect( collection.getFile( path ) ).toBeUndefined();
    });

    /** {@see ContextsCollection.deleteByPath} */
    test.each(Array.from(generator.files.entries()))( "Test deleting files directly using path", ( path,  ) => {
        collection.deleteByPath( path );
        expect( collection.getFile( path ) ).toBeUndefined();
    });

    /** {@see ContextsCollection.deleteByPath} */
    test.each(generator.contexts)( "Test deleting files directly using contextPath",
        ( event, path, contextPath, ) => {
        collection.deleteByPath( contextPath );
        expect( collection.getFile( contextPath ) ).toBeUndefined();
    });
} );