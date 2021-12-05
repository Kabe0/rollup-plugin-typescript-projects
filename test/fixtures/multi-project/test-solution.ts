import { rollup } from "rollup";
import configConsumed from "./rollup.consumed.config";
import configAll from "./rollup.all.config";
import { getCode } from "@test/resources/TestHelpers";

export default async function()
{
    let bundle = await rollup( configConsumed );
    let files = await getCode( bundle, { format: 'esm' }, true );

    expect( files ).toContainEqual( expect.objectContaining( { fileName: "src/index.d.ts" } ) );
    expect( files ).toEqual(  expect.arrayContaining([
        expect.objectContaining( { fileName: "src/index.d.ts" } ),
        expect.objectContaining( { fileName: "index.js" } ),
        expect.objectContaining( { fileName: "packages/package2/package2.d.ts" } )
    ] ) );
    expect( files ).not.toContainEqual( expect.objectContaining( { fileName: "packages/package1/index.d.ts" } ) );
    expect( files ).toContainEqual(expect.objectContaining( { code: expect.stringContaining("this is package 2") } ));
    expect( files ).not.toContainEqual(expect.objectContaining( { code:expect.stringContaining("Package 1 Function" ) } ));

    bundle = await rollup( configAll );
    files = await getCode( bundle, { format: 'es' }, true );

    expect( files ).toContainEqual( expect.objectContaining( { fileName: "src/index.d.ts" } ));
    expect( files ).toEqual( expect.arrayContaining( [
        expect.objectContaining({ fileName: "src/index.d.ts" }),
        expect.objectContaining({ fileName: "src/index.js" }),
        expect.objectContaining({ fileName: "packages/package2/package2.js" }),
        expect.objectContaining({ fileName: "packages/package2/package2.d.ts" }),
        expect.objectContaining({ fileName: "packages/package1/index.d.ts" }),
        expect.objectContaining({ fileName: "packages/package1/index.js" })
    ]));
    expect( files ).toContainEqual( expect.objectContaining( { code:expect.stringContaining("this is package 2") } ));
    expect( files ).toContainEqual( expect.objectContaining( { code:expect.stringContaining("Package 1 Function") } ));
}