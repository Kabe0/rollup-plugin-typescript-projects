import { FixtureLoader } from "@test/resources/FixtureLoader";

let mainCwd = process.cwd();
let fixtureLoader = new FixtureLoader();

//TODO describe a JSON style config that can be used to parse through and build out a unite test case for a fixture.
describe.each( fixtureLoader.fixtures )( "Test Basic Methods", ( fixture ) => {
    test( `Evaluate Fixture ${fixture.name}`, async () => {
        process.chdir( fixture.path );
        await fixture.test();
        process.chdir( mainCwd );
    }, 50000 * fixtureLoader.fixtures.length );
} );