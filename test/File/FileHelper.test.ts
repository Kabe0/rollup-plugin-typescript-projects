import { GeneratorEvents, IpsumFileContextGenerator } from "@test/resources/TestHelpers";
import { FileHelpers } from "@plugin/File/FileHelper";
import { ContextType, FileTypes } from "@plugin/File/Definitions";
import { win32 } from "path";

const generator = new IpsumFileContextGenerator();
generator.start();


/** {@see FileHelpers.IsContextDefinition} {@see FileHelpers.IsContextDestination} {@see FileHelpers.IsContextDeclaration} {@see FileHelpers.IsContextSource} {@see FileHelpers.IsContextData} */
describe.each(generator.contexts)(
    "IsContext...() validate original Context %s %s",
(event, path, contextPath, context) => {
    switch ( context.type ) {
        case ContextType.Declaration:
            test( "Declaration Test", () => {
                expect( FileHelpers.IsContextDefinition( context ) ).not.toEqual(true);
                expect( FileHelpers.IsContextDeclaration( context ) ).toEqual(true);
                expect( FileHelpers.IsContextDestination( context ) ).not.toEqual(true);
                expect( FileHelpers.IsContextSource( context ) ).not.toEqual(true);
                expect( FileHelpers.IsContextData( context ) ).not.toEqual(true);
            } )
            break;
        case ContextType.Definition:
            test( "Definition Test", () => {
                expect( FileHelpers.IsContextDefinition( context ) ).toEqual( true );
                expect( FileHelpers.IsContextDeclaration( context ) ).not.toEqual( true );
                expect( FileHelpers.IsContextDestination( context ) ).not.toEqual( true );
                expect( FileHelpers.IsContextSource( context ) ).not.toEqual( true );
                if ( event == GeneratorEvents.DefinitionPostAdded ) {
                    expect( FileHelpers.IsContextData( context ) ).toEqual( true );
                }
            });
            break;
        case ContextType.Destination:
            test( "Destination Test", () => {
                expect( FileHelpers.IsContextDefinition( context ) ).not.toEqual( true );
                expect( FileHelpers.IsContextDeclaration( context ) ).not.toEqual( true );
                expect( FileHelpers.IsContextDestination( context ) ).toEqual( true );
                expect( FileHelpers.IsContextSource( context ) ).not.toEqual( true );
                if ( event == GeneratorEvents.DestinationPostAdded ) {
                    expect( FileHelpers.IsContextData( context ) ).toEqual( true );
                }
            });
            break;
        case ContextType.Source:
            test( "Source Test", () => {
                expect( FileHelpers.IsContextDefinition( context ) ).not.toEqual( true );
                expect( FileHelpers.IsContextDeclaration( context ) ).not.toEqual( true );
                expect( FileHelpers.IsContextDestination( context ) ).not.toEqual( true );
                expect( FileHelpers.IsContextSource( context ) ).toEqual( true );
                expect( FileHelpers.IsContextData( context ) ).toEqual( true );
            });
            break;
    }
})

/** {@see FileHelpers.IsReadOnlyTypescriptDefinitionFile} {@see FileHelpers.IsTypescriptFile} */
test( "IsTypescriptFile() validate original Context", () => {
    for( let [, context] of generator.files ) {
        switch ( context.kind ) {
            case FileTypes.Typescript:
                expect( FileHelpers.IsTypescriptFile( context ) ).toEqual( true );
                expect( FileHelpers.IsReadOnlyTypescriptDefinitionFile( context ) ).toEqual( false );
                break;
            case FileTypes.TypescriptDefinition:
                expect( FileHelpers.IsTypescriptFile( context ) ).toEqual( false );
                expect( FileHelpers.IsReadOnlyTypescriptDefinitionFile( context ) ).toEqual( true );
                break;
            case FileTypes.File:
                expect( FileHelpers.IsTypescriptFile( context ) ).toEqual( false );
                expect( FileHelpers.IsReadOnlyTypescriptDefinitionFile( context ) ).toEqual( false );
                break;
        }
    }
})

/** {@see FileHelpers.Normalize} */
test( "Normalize() path", () => {
    let normalize = FileHelpers.Normalize("\\Program Files\\Custom Utilities\\StringFinder.ts");
    expect(normalize.includes(win32.sep)).toEqual(false);
});

/** {@see FileHelpers.ResolveNormalize} */
test( "ResolveNormalize() path to absolute", () => {

    process.chdir("test");
    
    let absolute = FileHelpers.ResolveNormalize("Custom Utilities\\StringFinder.ts");
    expect(absolute.includes(win32.sep)).toEqual(false);
    expect(absolute.includes("/test/")).toEqual(true);
    expect(absolute.startsWith("Custom Utilities")).toEqual(false);

    process.chdir("../");
});

test( "Caching ResolveNormalize Test", () => {
    expect(FileHelpers.ResolveNormalize("Custom Utilities\\StringFinder.ts")).toBeDefined();
});