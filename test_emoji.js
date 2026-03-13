const Share = require('./share');

const demoRoster = [
  { id: "p1", name: "Peter", pos: ["S", "O"], here: true },
  { id: "p2", name: "Apurva", pos: ["S", "O", "M"], here: true },
  { id: "p3", name: "Tommy", pos: ["S"], here: true },
  { id: "p4", name: "Saif", pos: ["M"], here: true },
  { id: "p5", name: "Kyle", pos: ["S"], here: true },
  { id: "p6", name: "DAngelo", pos: ["O", "M"], here: true },
  { id: "p8", name: "Chris", pos: ["O"], here: true },
  { id: "p9", name: "JP", pos: ["M"], here: true },
];

const lineup = {
  1: "p2",
  2: "p6",
  3: "p4",
  4: "p1",
  5: "p8",
  6: "p9"
};
const bench = ["p3", "p5"];

console.log(Share.generateEmojiText("The Rebels", demoRoster, lineup, bench, "abc123hash"));
