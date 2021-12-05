import ContextsMap from "@plugin/File/ContextsMap"
import { ContextType, FileTypes } from "@plugin/File/Definitions";

/** {@see ContextsMap.contexts} */
test( "Can add values to Contexts", () => {
    let contexts = new ContextsMap();
    contexts.contexts.set("example", {type:ContextType.Declaration});
    expect( contexts.contexts.size ).toEqual(1);
})

/** {@see ContextsMap.file} */
test( "Can modify the file" , () => {
    let contexts = new ContextsMap();
    contexts.file.kind = FileTypes.File;
    expect( contexts.file.kind ).toEqual( FileTypes.File );
});

/** {@see Contexts.[Symbol.iterator]} */
test( "Can Iterate", () => {
    let contexts = new ContextsMap();
    contexts.contexts.set("one", { type:ContextType.Declaration });
    contexts.contexts.set("two", { type:ContextType.Declaration });
    contexts.contexts.set("three", { type:ContextType.Declaration });
    contexts.contexts.set("four", { type:ContextType.Declaration });

    let count = 0;
    for( let val of contexts ){
        count++;
    }
    expect( count ).toEqual( 4 );
})