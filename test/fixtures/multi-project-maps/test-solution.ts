import { rollup } from "rollup";
import configConsumed from "./rollup.consumed.config";
import configAll from "./rollup.all.config";
import { getCode } from "@test/resources/TestHelpers";

export default async function()
{
    let bundle = await rollup( configConsumed );
    let files = await getCode( bundle, { format: 'esm' }, true );

    expect( files ).not.toContainEqual( expect.objectContaining( { fileName: "Large comment" } ) );

    bundle = await rollup( configAll );
    files = await getCode( bundle, { format: 'es' }, true );

    expect( files ).not.toContainEqual( expect.objectContaining( { code:expect.stringContaining("Large comment") } ));
}