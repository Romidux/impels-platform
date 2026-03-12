const optionTypes = [ {name:"Color", values:["Red", "Blue"]}, {name:"Size", values:["M", "L"]} ];
let matrix = [[]];
for (const ot of optionTypes) {
    if(!ot.name || ot.values.length === 0) continue;
    const nextMatrix = [];
    for (const row of matrix) {
        for (const val of ot.values) {
            nextMatrix.push([...row, { type: ot.name, val }]);
        }
    }
    matrix = nextMatrix;
}
console.log(matrix);

