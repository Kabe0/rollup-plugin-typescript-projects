import { FixtureLoader } from "@test/resources/FixtureLoader";
import BuildMode from "@plugin/BuildMode";
import {
    SemanticDiagnosticsBuilderProgram,
    SolutionBuilderWithWatchHost
} from "typescript";

let fixtureLoader = new FixtureLoader();
let mainCwd = process.cwd();

describe.each( fixtureLoader.fixtures )( "Test BuildMode in Watch Mode", ( fixture ) => {
    /** {@see BuildMode.constructor} **/
    test( "Watch Toggled On", () => {
        process.chdir( fixture.path );
        let watch = new BuildMode( true, () => {}, () => {} );
        expect( watch.host ).toBeDefined();
        expect( ( watch.host as SolutionBuilderWithWatchHost<SemanticDiagnosticsBuilderProgram> ).watchFile ).toBeDefined();
        expect( watch.solutionBuilder ).toBeDefined();
    } );
} );

describe.each( fixtureLoader.fixtures )( "Test BuildMode in Execute Mode", ( fixture ) => {
    /** {@see BuildMode.constructor} **/
    test( "Watch Toggled Off", () => {
        process.chdir( fixture.path );
        let watch = new BuildMode( false );
        expect( watch.host ).toBeDefined();
        expect( ( watch.host as SolutionBuilderWithWatchHost<SemanticDiagnosticsBuilderProgram> ).watchFile ).not.toBeDefined();
        expect( watch.solutionBuilder ).toBeDefined();
    } );
} );

process.chdir( mainCwd );
