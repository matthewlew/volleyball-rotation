const Solver = require('./solver');

const demoRoster = [
  { id: "p1", name: "Peter", pos: ["S", "O"], here: true },
  { id: "p2", name: "Apurva", pos: ["S", "O", "M"], here: true },
  { id: "p3", name: "Tommy", pos: ["S"], here: true },
  { id: "p4", name: "Saif", pos: ["M"], here: true },
  { id: "p5", name: "Kyle", pos: ["S"], here: true },
  { id: "p6", name: "DAngelo", pos: ["O", "M"], here: true },
  { id: "p7", name: "Nikola", pos: ["M"], here: false },
  { id: "p8", name: "Chris", pos: ["O"], here: true },
  { id: "p9", name: "JP", pos: ["M"], here: true },
  { id: "p10", name: "Matt", pos: ["S"], here: false }
];

console.log("Testing with demo roster:");
const result = Solver.solve(demoRoster);
console.log(JSON.stringify(result, null, 2));

// Test insufficient players
console.log("\nTesting < 6 players:");
const insufficient = demoRoster.slice(0, 5);
const result2 = Solver.solve(insufficient);
console.log(result2);

// Test insufficient setters
console.log("\nTesting < 2 setters:");
const insufficientSetters = demoRoster.filter(p => p.id !== "p1" && p.id !== "p2" && p.id !== "p3" && p.id !== "p5" && p.id !== "p10");
insufficientSetters.push({ id: "p11", name: "OnlySetter", pos: ["S"], here: true });
// ensure >= 6 players
insufficientSetters.push({ id: "p12", name: "Dummy", pos: ["O"], here: true });
insufficientSetters.push({ id: "p13", name: "Dummy2", pos: ["O"], here: true });
const result3 = Solver.solve(insufficientSetters);
console.log(result3);

// Test empty positions
console.log("\nTesting empty positions:");
const emptyPos = [...demoRoster.filter(p => p.here)];
emptyPos[0].pos = [];
const result4 = Solver.solve(emptyPos);
console.log(result4);