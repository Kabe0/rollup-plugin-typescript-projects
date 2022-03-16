import { rollup } from "rollup";
import configConsumed from "./rollup.consumed.globalOpts.config";
import configAll from "./rollup.all.proj.config";
import configMaps from "./rollup.all.maps.config";
import configMapsBad from "./rollup.all.maps.bad.config";
import { getCode } from "@test/resources/TestHelpers";

export default async function() {
    let bundle = await rollup( configConsumed );
    let files = await getCode( bundle, { format: 'esm' }, true );

    expect( files ).not.toContainEqual( expect.objectContaining( { fileName: "Large comment" } ) );

    bundle = await rollup( configAll );
    files = await getCode( bundle, { format: 'es' }, true );

    expect( files ).not.toContainEqual( expect.objectContaining( { code: expect.stringContaining( "Large comment" ) } ) );


    bundle = await rollup( configMaps );
    files = await getCode( bundle, { sourcemap: true, format: 'esm' }, true );

    expect( files ).toEqual( expect.arrayContaining( [
        expect.objectContaining({ "map": expect.any(Object) } ) ] ) );

    bundle = await rollup( configMapsBad );
    files = await getCode( bundle, { sourcemap: false, format: 'esm' }, true );

    expect( files ).toEqual( expect.arrayContaining( [
        expect.not.objectContaining({ "map": expect.any(Object) } ) ] ) );

    let fi = files;
}