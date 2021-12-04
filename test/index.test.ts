import {check} from "../src";


describe("This is a test", ()=>{
    test( "Should behave", () => {
        expect(check()).toBe("22");
    });
})
// test('Checking for something i need', () => {
//     expect(5).toBe(5);
// });