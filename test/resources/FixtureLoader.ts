import { readdirSync } from "fs";

/**
 * Manages the state of a specific fixture. {@see test} can be called
 * to trigger it's test-solution.ts file which can be run inside a Jest test block.
 */
export class Fixture
{
    public readonly name: string;
    public readonly path: string;

    constructor( name: string, path: string )
    {
        this.name = name;
        this.path = path;
    }

    /**
     * Run the test-solution.ts file. Should be run inside a Jest test() block.
     */
    public async test()
    {
        let test = await import( `${this.path}/test-solution.ts`);
        await test.default();
    }
}

/**
 * Helps to read and parsing through the projects in the fixtures' folder.
 */
export class FixtureLoader implements Iterable<Fixture>
{
    private readonly _fixtures: Fixture[];

    constructor() {
        let cwd = process.cwd();

        // Retrieve the folder names inside the fixtures' folder.
        this._fixtures = readdirSync( `${cwd}/test/fixtures`, {
            withFileTypes: true
        } ).filter( value => value.isDirectory() ).map( value => new Fixture( value.name, `${cwd}/test/fixtures/${value.name}` ) );
    }

    public get( name: string ) {
        return this._fixtures.find( value => { return value.name == name } );
    }

    public [Symbol.iterator](): Iterator<Fixture>
    {
        return this._fixtures[Symbol.iterator]();
    }

    public get fixtures(): Fixture[]
    {
        return this._fixtures;
    }
}