import { rollup } from "rollup";
import config from "./rollup.config";
import { getCode } from "@test/resources/TestHelpers";

export default async function()
{
    let bundle = await rollup( config );
    let code = await getCode( bundle, { format: 'es' }, false );

    expect(code).toContain( "console.log(\"Simply Basic\");" );
}