const scores = [
  { value: "a", probability: 0.4 },
  { value: "b", probability: 0.3 },
  { value: "c", probability: 0.2 },
  { value: "d", probability: 0.1 },
];

function weightedRandom(scores) {
  const sum = scores.reduce((acc, cur) => acc + cur.probability, 0);
  const rand = Math.random() * sum;

  let acc = 0;
  for (const score of scores) {
    acc += score.probability;
    if (rand < acc) {
      return score.value;
    }
  }
}

let count = { a: 0, b: 0, c: 0, d: 0 };

for (let i = 0; i < 10000; i++) {
  count[weightedRandom(scores)] += 1;
}

console.log(count);
