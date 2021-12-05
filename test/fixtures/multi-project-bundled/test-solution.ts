import { rollup } from "rollup";
import configConsumed from "./rollup.consumed.config";
import configAll from "./rollup.all.config";
import { getCode } from "@test/resources/TestHelpers";

export default async function()
{
    let bundle = await rollup( configConsumed );
    let files = await getCode( bundle, { file: 'bundled.js', format: 'esm' }, true );

    expect( files ).toContainEqual(expect.objectContaining( { code: expect.stringContaining("this is package 2") } ));
    expect( files ).not.toContainEqual(expect.objectContaining( { code:expect.stringContaining("Package 1 Function" ) } ));

    // Currently, this fails.
    // let bundle = await rollup( configAll );
    // let files = await getCode( bundle, { file: 'bundled.js', inlineDynamicImports: true, format: 'esm' }, true );
    //
    // expect( files ).toContainEqual( expect.objectContaining( { code:expect.stringContaining("this is package 2") } ));
    // expect( files ).toContainEqual( expect.objectContaining( { code:expect.stringContaining("Package 1 Function") } ));
}