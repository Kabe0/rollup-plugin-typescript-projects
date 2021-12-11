import { Fixture, FixtureLoader } from "@test/resources/FixtureLoader";
import SolutionBuilderPlugin from "@plugin/SolutionBuilderPlugin";
import FileRepositoryCache from "@plugin/File/FileRepositoryCache";

let fixtureLoader = new FixtureLoader();
let mainCwd = process.cwd();

describe( "Test Basic Methods", () => {
    const multiProject:Fixture = fixtureLoader.get( "multi-project" ) as Fixture;

    describe( "Project Specific Config Loading", () => {

        test("Config Overloading Works as Expected", () => {
            process.chdir( multiProject.path );
            let solutionBuilderPlugin = new SolutionBuilderPlugin( new FileRepositoryCache(), {
                onBuilderEnded: () => {},
                onBuilderStarting: () => {},
                compilerOptions: {
                    allowJs: false
                },
                projects: {
                    "./tsconfig2.json": {
                        allowJs: true
                    }
                }
            } );

            expect( solutionBuilderPlugin ).toBeDefined();
            expect( solutionBuilderPlugin.options.projects ).not.toHaveProperty("./tsconfig2.json");

            process.chdir( mainCwd );
        })
    });

    describe( "Watch Mode", () => {
        /** {@see SolutionBuilderPlugin.watch} */
        test( "Constructs", () => {
            process.chdir( multiProject.path );
            let solutionBuilderPlugin = new SolutionBuilderPlugin( new FileRepositoryCache(), {
                onBuilderEnded: () => {},
                onBuilderStarting: () => {}
            } );

            expect( solutionBuilderPlugin ).toBeDefined();
            process.chdir( mainCwd );
        } );

        /** {@see SolutionBuilderPlugin.buildMode} {@see SolutionBuilderPlugin.buildMode} */
        test( "Calling properties before run throws exceptions", () => {
            process.chdir( multiProject.path );
            let solutionBuilderPlugin = new SolutionBuilderPlugin( new FileRepositoryCache(), {
                onBuilderEnded: () => {},
                onBuilderStarting: () => {}
            } );
            expect( () => { solutionBuilderPlugin.buildMode } ).toThrow();
            expect( () => { solutionBuilderPlugin.activeProject } ).toThrow();
            process.chdir( mainCwd );
        } );

        /** {@see SolutionBuilderPlugin.buildMode} {@see SolutionBuilderPlugin.buildMode} */
        test( "Calling buildMode property after setMode returns expected mode", () => {
            process.chdir( multiProject.path );
            let solutionBuilderPlugin = new SolutionBuilderPlugin( new FileRepositoryCache(), {
                onBuilderEnded: () => {},
                onBuilderStarting: () => {}
            } );

            solutionBuilderPlugin.setMode(true);

            expect( () => { solutionBuilderPlugin.buildMode } ).not.toThrow();
            process.chdir( mainCwd );
        } );
    });
});

describe.each( fixtureLoader.fixtures )( "Test BuildMode in Watch Mode", ( fixture ) => {

    let onBuilderEnded!: jest.Mock, onBuilderStarting!: jest.Mock;
    let solutionBuilderPlugin!: SolutionBuilderPlugin;

    beforeEach(() => {
        solutionBuilderPlugin = new SolutionBuilderPlugin( new FileRepositoryCache(), {
            onBuilderEnded: onBuilderEnded = jest.fn(),
            onBuilderStarting: onBuilderStarting = jest.fn()
        });
    })

    test( `Run Project ${fixture.name}`, () => {
        process.chdir( fixture.path )
        //TODO... Hook into the build process for Typescript and use the .tsbuildinfo to verify success.
        solutionBuilderPlugin.setMode(false);
        solutionBuilderPlugin.run();
        process.chdir( mainCwd );
    })
});