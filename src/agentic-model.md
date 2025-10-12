---
title: Agentic Model
---

```js
import * as Form from "./components/form.js"
import * as Ops from "./components/ops.js"
import * as Util from "./components/util.js"
```

<h1 id="agentic-model" class="u-center" tabindex="-1">
  <a class="observablehq-header-anchor"
     href="#agentic-model">Agentic Model</a>
</h1>

_?_

## Interactive Simulation

```js
const defaultSteps = 10;
const tokensPerTx = 100;
const carbonPerTx = 100;
const defaultAgentCount = 100;
```

```js
const viewSteps = Inputs.range([1, 1e5], {
  label: "Number of steps",
  step: 1,
  value: defaultSteps,
  transform: Math.log,
});
const viewAgentCount = Inputs.range([1, 1e3], {
  label: "Number of agents",
  step: 1,
  value: defaultAgentCount,
  transform: Math.log,
});
const viewReset = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewSteps, defaultSteps);
    Util.setInput(viewAgentCount, defaultAgentCount);
  }]],
);
```

```js
const inputSteps = view(viewSteps);
const inputAgentCount = view(viewAgentCount);
```

```js
display(viewReset);
```

```js
if (inputSteps === defaultSteps && inputAgentCount === defaultAgentCount) {
  viewReset.classList.add("u-hidden");
} else {
  viewReset.classList.remove("u-hidden");
}
```

Constants and initial state:

```js echo
const STEPS = inputSteps;
const AGENT_COUNT = inputAgentCount;
const INIT_STATE = {
  tokens: 100000,        // Total protocol tokens in circulation
  carbon: 50000,         // Total carbon tonnes in portfolio
  price: 1.00            // USD price per token
}
```

Functions to create/clone the current state as a typed array:

```js echo
function createState(tokens, carbon, price) {
  return new Float64Array([tokens, carbon, price]);
}

function cloneState(state) {
  return new Float64Array(state);
}
```


Simulation loop:

```js echo
function runSimulation(iterations, initialState, agents, shocks = []) {
  let state = createState(initialState.tokens, initialState.carbon, initialState.price);
  const history = [];

  for (let i = 0; i < iterations; i++) {
    history.push(cloneState(state));

    // Apply shock if any
    if (shocks[i]) {
      state = applyMarketShock(state, shocks[i]);
    }

    // Process transactions
    state = processTransactions(state, agents);
  }

  return history;
}
```
















```js echo
const agents = Array.from({ length: inputAgentCount }, (_, i) => [
  `Agent${i}`,  // name
  1000 + Math.floor(Math.random() * 500),  // initial kVCM
  500 + Math.floor(Math.random() * 500),  // initial carbon tonnes
  thresholdStrategy,  // strategy function
]);

const protocol = {
  tokenSupply: 1_000_000,
  carbonTonnes: 500_000,
  tokenPriceUSD: 1.0,
};
```

```js
function log(logs, name, action, carbon, tokens, price) {
  logs.push(`${name} ${action} | Carbon Tonnes: ${carbon} | Tokens: ${tokens} | Carbon Price: $${price.toFixed(2)}`);
}

function updatePrice(protocol, carbon, tokens) {
  return carbon === 0 ? 0 : protocol.tokenPriceUSD * (carbon / tokens);
}

function sell(logs, agent, protocol, tokens, rwas, price) {
  if (agent[2] < rwas) return false;

  agent[2] -= rwas;
  agent[1] += tokens;

  protocol.carbonTonnes += rwas;
  protocol.tokenSupply += tokens;

  log(logs, agent[0], "SELL", rwas, tokens, price);
  return true;
}

function retire(logs, agent, protocol, tokens, rwas, price) {
  if (agent[1] < tokens || protocol.carbonTonnes < rwas) return false;

  agent[1] -= tokens;
  protocol.tokenSupply -= tokens;
  protocol.carbonTonnes -= rwas;

  log(logs, agent[0], "RETIRE", rwas, tokens, price);
  return true;
}

function thresholdStrategy(logs, agent, protocol, tokens, rwas, price) {
  if (price > 1.2) {
    sell(logs, agent, protocol, tokens, rwas, price);
  } else if (price < 0.8) {
    retire(logs, agent, protocol, tokens, rwas, price);
  }
}

function marketEvent(logs, step, protocol) {
  if (step === 5) {
    protocol.tokenPriceUSD *= 0.8;
    logs.push("💥 Market shock: Token price -20%");
  }
  if (step === 8) {
    protocol.tokenPriceUSD *= 1.1;
    logs.push("📈 Market rally: Token price +10%");
  }
}

function simulate(steps, agents, protocol) {
  const logs = [];

  for (let step = 1; step <= steps; step++) {
    logs.push(`\n--- Step ${step} ---`);
    marketEvent(logs, step, protocol);

    const price = updatePrice(protocol, tokensPerTx, carbonPerTx);

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const strategyFn = agent[3];
      strategyFn(logs, agent, protocol, tokensPerTx, carbonPerTx, price);
    }

    logs.push(`Protocol state: Tokens=${protocol.tokenSupply}, RWAs=${protocol.carbonTonnes}, TokenPrice=$${protocol.tokenPriceUSD.toFixed(2)}`);
  }

  // Print all logs at once
  return logs.join('\n');
  // return logs;
}
```

```js
simulate(inputSteps, agents, protocol)
```


```js
const TONNES_MIN = 1e-10;
const nDotsPerInterval = 100;

const defaultCInitial = 100;
const defaultASupply = 1e7;
const defaultAPrice = 0.15;
const defaultAi = 1e-3;
const defaultGi = 1e-3;
const defaultDeltaCRetired = 90;
const defaultDeltaCSold = 900;

const stringSaleNormal = "Normal Sale";
const stringRetirement = "Pre-Retirement";
const stringSaleBoosted = "Boosted Sale";
const stringProfitLoophole = "Pre-Retirement + Boosted Sale";
const stringPriceSupply = "Price-Supply Curve";
```

```js
const barCiMin = vecBarCiRetirement[0] / 10;
const barCiMax = vecBarCiSaleNormal.at(-1) * 10;
const priceMin = inputDeltaCRetired === 0 ? (
  vecPriceSaleNormal.at(-1) / 10
) : (
  Math.min(vecPriceRetirement[0], vecPriceSaleNormal.at(-1)) / 10
);
const priceMax = vecPriceSaleBoosted[0] * 10;
```

<!-- ```js
const viewSaleNormal = Inputs.button([[stringSaleNormal, () =>
  Util.setInput(viewDeltaCRetired, 0)
]]);
``` -->

<!-- ```js
const viewSaleBoosted = Inputs.button([[stringSaleBoosted, () =>
  Util.setInput(viewDeltaCRetired, inputCInitial * 0.9)
]]);
``` -->

```js
const viewCInitial = Inputs.range([1, 1e8], {
  label: "Carbon supply",
  step: 1,
  value: defaultCInitial,
  transform: Math.log,
});
const viewASupply = Inputs.range([1, 1e10], {
  label: "kVCM supply",
  step: 1,
  value: defaultASupply,
  transform: Math.log,
});
const viewAPrice = Inputs.range([1e-5, 1e3], {
  label: "kVCM price (USD/kVCM)",
  step: 1e-5,
  value: defaultAPrice,
  transform: Math.log,
});
const viewAi = Inputs.range([1e-5, 1], {
  label: "kVCM allocation",
  step: 1e-5,
  value: defaultAi,
  transform: Math.log,
});
const viewGi = Inputs.range([0, 1], {
  label: "K2 allocation",
  step: 1e-5,
  value: defaultGi,
});
```

```js
const viewDeltaCRetired = Inputs.range([0, inputCInitial - 1e-1], {
  label: "Carbon retired",
  step: 1e-1,
  value: inputCInitial * 0.9,
});
const viewDeltaCSold = Inputs.range([1, 9e8], {
  label: "Carbon sold after retirement",
  step: 1,
  value: inputCInitial * 9,
  transform: Math.log,
});
```

```js
const vecBarCi = Util.logRange(barCiMin, barCiMax, nDotsPerInterval);

const vecPrice = vecBarCi.map(paramBarCi =>
  inputAPrice * inputASupply * Form.computeTrueDeltaA(
    inputAi,
    inputGi,
    paramBarCi,
    TONNES_MIN,
  ) / TONNES_MIN
);

const dashedData = [];
for (let i = 0; i < vecBarCi.length; i++) {
  dashedData.push({
    key: stringPriceSupply,
    price: vecPrice[i],
    supply: vecBarCi[i],
  });
}
```

```js
const vecBarCiRetirement = Util.logRange(
  inputCInitial - inputDeltaCRetired,
  inputCInitial * (1 - TONNES_MIN),
  nDotsPerInterval,
);

const vecPriceRetirement = vecBarCiRetirement.map(paramBarCi =>
  inputAPrice * inputASupply * Form.computeDeltaARetirement(
    inputAi,
    inputGi,
    (inputCInitial - paramBarCi) / inputCInitial,
  ) / (paramBarCi - inputCInitial)
);

const deltARetirement = Form.computeDeltaARetirement(
  inputAi,
  inputGi,
  inputDeltaCRetired / inputCInitial,
);

const vecBarCiSaleNormal = Util.logRange(
  inputCInitial * (1 + TONNES_MIN),
  inputCInitial + inputDeltaCSold,
  nDotsPerInterval,
);

const vecPriceSaleNormal = vecBarCiSaleNormal.map(paramBarCi =>
  inputAPrice * inputASupply * Form.computeTrueDeltaA(
    inputAi,
    inputGi,
    inputCInitial,
    paramBarCi - inputCInitial,
  ) / (paramBarCi - inputCInitial)
);

const vecBarCiSaleBoosted = Util.logRange(
  (inputCInitial - inputDeltaCRetired) * (1 + TONNES_MIN),
  inputCInitial - inputDeltaCRetired + inputDeltaCSold,
  nDotsPerInterval,
);

const vecPriceSaleBoosted = vecBarCiSaleBoosted.map(paramBarCi =>
  inputAPrice * inputASupply * (1 - deltARetirement) * Form.computeTrueDeltaA(
    inputAi,
    inputGi,
    inputCInitial - inputDeltaCRetired,
    paramBarCi - inputCInitial + inputDeltaCRetired,
  ) / (paramBarCi - inputCInitial + inputDeltaCRetired)
);

const linesData = [];
for (let i = 0; i < vecBarCiSaleBoosted.length; i++) {
  linesData.push({
    key: stringSaleNormal,
    price: vecPriceSaleNormal[i],
    supply: vecBarCiSaleNormal[i],
  });
}
for (let i = 0; i < vecBarCiRetirement.length; i++) {
  linesData.push({
    key: stringRetirement,
    price: vecPriceRetirement[i],
    supply: vecBarCiRetirement[i],
  });
}
for (let i = 0; i < vecBarCiSaleBoosted.length; i++) {
  linesData.push({
    key: stringSaleBoosted,
    price: vecPriceSaleBoosted[i],
    supply: vecBarCiSaleBoosted[i],
  });
}

const arrowsData = [
  {
    key: stringSaleNormal,
    price1: vecPriceSaleNormal.slice(-10)[0],
    price2: vecPriceSaleNormal.at(-1),
    supply1: vecBarCiSaleNormal.slice(-10)[0],
    supply2: vecBarCiSaleNormal.at(-1),
  },
  {
    key: stringPriceSupply,
    price1: vecPriceSaleNormal[0],
    price2: vecPriceRetirement.at(-1),
    supply1: vecBarCiRetirement.at(-1),
    supply2: vecBarCiRetirement.at(-1),
  },
  {
    key: stringRetirement,
    price1: vecPriceRetirement.slice(0, 9).at(-1),
    price2: vecPriceRetirement[0],
    supply1: vecBarCiRetirement.slice(0, 9).at(-1),
    supply2: vecBarCiRetirement[0],
  },
  {
    key: stringPriceSupply,
    price1: vecPriceRetirement[0],
    price2: vecPriceSaleBoosted[0],
    supply1: vecBarCiRetirement[0],
    supply2: vecBarCiRetirement[0],
  },
  {
    key: stringSaleBoosted,
    price1: vecPriceSaleBoosted.slice(-10)[0],
    price2: vecPriceSaleBoosted.at(-1),
    supply1: vecBarCiSaleBoosted.slice(-10)[0],
    supply2: vecBarCiSaleBoosted.at(-1),
  },
];

const dotsData = [
  {
    key: stringPriceSupply,
    price: vecPriceSaleNormal[0],
    supply: vecBarCiSaleNormal[0],
  },
  {
    key: stringPriceSupply,
    price: vecPriceRetirement.at(-1),
    supply: vecBarCiRetirement.at(-1),
  },
  {
    key: stringSaleNormal,
    price: vecPriceSaleNormal.at(-1),
    supply: vecBarCiSaleNormal.at(-1),
  },
  {
    key: stringRetirement,
    price: vecPriceRetirement[0],
    supply: vecBarCiRetirement[0],
  },
  {
    key: stringSaleBoosted,
    price: vecPriceSaleBoosted.at(-1),
    supply: vecBarCiSaleBoosted.at(-1),
  },
];

const valueRetirement = inputDeltaCRetired === 0 ? 0 : (
  -vecPriceRetirement[0] * inputDeltaCRetired
);
const valueSaleBoosted = vecPriceSaleBoosted.at(-1) * inputDeltaCSold;
const valueSaleDirect = inputAPrice * inputASupply * Form.computeTrueDeltaA(
  inputAi,
  inputGi,
  inputCInitial,
  inputDeltaCSold,
);

const barsData = [
  { key: stringSaleNormal, value: valueSaleDirect },
  { key: stringRetirement, value: valueRetirement },
  { key: stringSaleBoosted, value: valueSaleBoosted },
  { key: stringProfitLoophole, value: valueRetirement + valueSaleBoosted },
];
```

```js
Plot.plot({
  caption: "Profit form Normal Sale vs. Pre-Retirement + Boosted Sale",
  color: {
    range: [0, 3, 2, 4].map(i => d3.schemeCategory10[i]),
    domain: [
      stringSaleNormal,
      stringRetirement,
      stringSaleBoosted,
      stringProfitLoophole,
    ],
  },
  x: {
    label: "",
    domain: [
      stringSaleNormal,
      stringRetirement,
      stringSaleBoosted,
      stringProfitLoophole,
    ],
  },
  y: { label: "Profit (USD)", grid: true },
  insetTop: 16,
  insetBottom: 16,
  marks: [
    Plot.frame(),
    Plot.ruleY([0]),
    Plot.barY(barsData, { x: "key", y: "value", fill: "key" }),
  ],
})
```

<!-- ```js
display(viewSaleNormal);
display(viewSaleBoosted);
``` -->

```js
const inputDeltaCRetired = view(viewDeltaCRetired);
const inputDeltaCSold = view(viewDeltaCSold);
```

```js
const inputCInitial = view(viewCInitial);
const inputASupply = view(viewASupply);
const inputAPrice = view(viewAPrice);
const inputAi = view(viewAi);
const inputGi = view(viewGi);
```

```js
Plot.plot({
  caption: "Carbon Price vs. Carbon Supply",
  color: {
    legend: true,
    range: [0, 3, 2, 7].map(i => d3.schemeCategory10[i]),
    domain: [
      stringSaleNormal,
      stringRetirement,
      stringSaleBoosted,
      stringPriceSupply,
    ],
  },
  x: {
    type: "log",
    label: "Carbon Supply (tCO2eq)",
    domain: [barCiMin, barCiMax],
  },
  y: {
    type: "log",
    label: "Carbon Price (USD/tCO2eq)",
    domain: [priceMin, priceMax],
    grid: true,
  },
  insetTop: 16,
  clip: true,
  marks: [
    Plot.frame(),
    Plot.arrow(arrowsData, {
      x1: "supply1",
      x2: "supply2",
      y1: "price1",
      y2: "price2",
      inset: 4,
      stroke: "key",
      strokeWidth: 1,
    }),
    Plot.lineY(linesData, {
      x: "supply",
      y: "price",
      stroke: "key",
      strokeWidth: 1,
    }),
    Plot.lineY(dashedData, {
      x: "supply",
      y: "price",
      stroke: "key",
      strokeDasharray: 4,
    }),
    Plot.dot(dotsData, { x: "supply", y: "price", fill: "key" }),
  ],
})
```
