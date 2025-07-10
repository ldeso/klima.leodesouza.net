---
title: Maintaining Prices
---

```js
import * as Form from "./components/form.js"
import * as Ops from "./components/ops.js"
import * as Util from "./components/util.js"
```

<h1 id="maintaining-prices" class="u-center" tabindex="-1">
  <a class="observablehq-header-anchor"
     href="#maintaining-prices">Maintaining Prices</a>
</h1>

_How easily can the Klima Foundation maintaining carbon prices after launch?_

## Interactive Simulation

```js
const defaultAPrice = 1.0;
const defaultCarbonPriceRemoval = 1.0;
const defaultCarbonPriceNatureBased = 10.0;
const defaultCarbonPriceAvoidance = 100.0;
const defaultBarCRemoval = 1049.765;
const defaultBarCNatureBased = 1107984.42;
const defaultBarCAvoidance = 13556768.1;
const defaultARemoval = 7e-5;
const defaultANatureBased = 0.076;
const defaultAAvoidance = 0.924;
const defaultGRemoval = 0.0;
const defaultGNatureBased = 0.0;
const defaultGAvoidance = 0.0;
const defaultASupply = 2e7;
const defaultTogglePriceRetirement = true;
const defaultTogglePriceSaleTx = false;
const defaultTogglePriceRetirementTx = false;

const viewASupply = Inputs.range([1e6, 1e10], {
  label: tex`\text{kVCM supply}`,
  step: 1,
  value: defaultASupply,
  transform: Math.log,
});
const viewAPrice = Inputs.range([1e-5, 1e3], {
  label: tex`\text{kVCM price (USD/kVCM)}`,
  step: 1e-5,
  value: defaultCarbonPriceRemoval,
  transform: Math.log,
});
const viewCarbonPrice = Inputs.range([1e-3, 1e9], {
  label: tex`\text{Desired carbon price (USD/tCO2eq)}`,
  step: 1e-3,
  value: defaultCarbonPriceRemoval,
  transform: Math.log,
});
const viewBarC = Inputs.range([1, 1e9], {
  label: tex`\text{Initial carbon supply } \bar C_i`,
  step: 1,
  value: defaultBarCRemoval,
  transform: Math.log,
});
const viewAi = Inputs.range([1e-5, 1], {
  label: tex`\text{Maximum kVCM allocation } A_i^\text{max}`,
  step: 1e-5,
  value: defaultARemoval,
});
const viewGi = Inputs.range([0, 1], {
  label: tex`\text{K2 allocation } G_i`,
  step: 1e-3,
  value: defaultGRemoval,
});

const viewSetRemoval = Inputs.button(
  [["Removal – BCHAR", () => {
    Util.setInput(viewCarbonPrice, defaultCarbonPriceRemoval);
    Util.setInput(viewBarC, defaultBarCRemoval);
    Util.setInput(viewAi, defaultARemoval);
    Util.setInput(viewGi, defaultGRemoval);
  }]],
);

const viewSetNatureBased = Inputs.button(
  [["Nature Based Solutions – REDD+", () => {
    Util.setInput(viewCarbonPrice, defaultCarbonPriceNatureBased);
    Util.setInput(viewBarC, defaultBarCNatureBased);
    Util.setInput(viewAi, defaultANatureBased);
    Util.setInput(viewGi, defaultGNatureBased);
  }]],
);

const viewSetAvoidance = Inputs.button(
  [["Renewables – Large Scale", () => {
    Util.setInput(viewCarbonPrice, defaultCarbonPriceAvoidance);
    Util.setInput(viewBarC, defaultBarCAvoidance);
    Util.setInput(viewAi, defaultAAvoidance);
    Util.setInput(viewGi, defaultGAvoidance);
  }]],
);

const viewReset = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewAPrice, defaultAPrice);
    Util.setInput(viewASupply, defaultASupply);
  }]],
);

const viewTogglePriceRetirement = Inputs.toggle(
  { label: "Show retirement price", value: defaultTogglePriceRetirement }
);
const viewTogglePriceSaleTx = Inputs.toggle({
  label: "Show sale price for various amounts",
  value: defaultTogglePriceSaleTx,
});
const viewTogglePriceRetirementTx = Inputs.toggle({
  label: "Show retirement price for various amounts",
  value: defaultTogglePriceRetirementTx,
});
```

### Inputs Parameters

```js
display(viewAPrice);
display(viewCarbonPrice);
display(viewSetRemoval);
display(viewSetNatureBased);
display(viewSetAvoidance);
```

```js
const inputASupply = view(viewASupply);
const inputAPrice = view(viewAPrice);
const inputCarbonPrice = view(viewCarbonPrice);
const inputBarC = view(viewBarC);
const inputAi = view(viewAi);
const inputGi = view(viewGi);
```

```js
display(viewReset);
```

### Results

1. Current USD price

2. Share kVCM that must be allocated to maintain price

3. "The protocol can maintain the desired price for transactions up to
___ tCO2eq by allocating __% more kVCM."

```js
const vecBarCi = d3.range(0, 9*16 + 1).map(i => Math.pow(10, i/16));

const vecCarbonPriceSale = vecBarCi.map(paramBarCi => {
  const paramDeltaTonnes = 1e-10;
  return inputAPrice * inputASupply * Form.computeTrueDeltaA(
    inputAi,
    inputGi,
    paramBarCi,
    paramDeltaTonnes,
  ) / paramDeltaTonnes;
});

const vecCarbonPriceRetirement = vecBarCi.map(paramBarCi => {
  if (inputTogglePriceRetirement) {
    const paramDeltaTonnes = 1e-10;
    return inputAPrice * inputASupply * Form.computeDeltaARetirement(
      inputAi,
      inputGi,
      -paramDeltaTonnes / paramBarCi,
    ) / paramDeltaTonnes;
  } else {
    return NaN;
  }
});

const vecCarbonPriceSaleTx = vecBarCi.map(paramBarCi => {
  const paramDeltaTonnes = paramBarCi - inputBarC;
  if (paramDeltaTonnes > 0 && inputTogglePriceSaleTx) {
    return inputAPrice * inputASupply * Form.computeTrueDeltaA(
      inputAi,
      inputGi,
      inputBarC,
      paramDeltaTonnes,
    ) / paramDeltaTonnes;
  } else {
    return NaN;
  }
});

const vecCarbonPriceRetirementTx = vecBarCi.map(paramBarCi => {
  const paramDeltaTonnes = paramBarCi - inputBarC;
  if (paramDeltaTonnes < 0 && inputTogglePriceRetirementTx) {
    return inputAPrice * inputASupply * Form.computeDeltaARetirement(
      inputAi,
      inputGi,
      -paramDeltaTonnes / inputBarC,
    ) / paramDeltaTonnes;
  } else {
    return NaN;
  }
});

const paramPriceSaleCurrent = inputAPrice * inputASupply * Form.computeTrueDeltaA(
  inputAi,
  inputGi,
  inputBarC,
  1e-10,
) / 1e-10;

const paramPriceRetirementCurrent = inputAPrice * inputASupply * Form.computeDeltaARetirement(
  inputAi,
  inputGi,
  -1e-10 / inputBarC,
) / 1e-10;

const stringPriceSaleCurrent = `Current Sale Price: ${
  paramPriceSaleCurrent.toLocaleString(
    "en-GB",
    { maximumSignificantDigits: 3 },
  )
} USD`;
const stringPriceRetirementCurrent = `Current Retirement Price: ${
  paramPriceRetirementCurrent.toLocaleString(
    "en-GB",
    { maximumSignificantDigits: 3 },
  )
} USD`;
const stringPriceDesired = `Desired Price: ${
  inputCarbonPrice.toLocaleString(
    "en-GB",
    { maximumSignificantDigits: 3 },
  )
} USD`;

const carbonPriceData2 = [
  { key: stringPriceSaleCurrent, price: paramPriceSaleCurrent, supply: inputBarC },
  // { key: stringPriceRetirementCurrent, price: paramPriceRetirementCurrent, supply: inputBarC },
];
if (inputTogglePriceRetirement || inputTogglePriceRetirementTx) {
  carbonPriceData2.push({
    key: stringPriceRetirementCurrent,
    price: paramPriceRetirementCurrent,
    supply: inputBarC,
  })
}

const priceDesiredData = [{ key: stringPriceDesired, price: inputCarbonPrice }];

const carbonPriceData = [];
for (let i = 0; i < vecBarCi.length; i++) {
  carbonPriceData.push({
    key: stringPriceSaleCurrent,
    price: vecCarbonPriceSaleTx[i],
    supply: vecBarCi[i],
  });
  carbonPriceData.push({
    key: stringPriceRetirementCurrent,
    price: vecCarbonPriceRetirementTx[i],
    supply: vecBarCi[i],
  });
}

for (let i = 0; i < vecBarCi.length; i++) {
  carbonPriceData.push({
    key: "Sale Price",
    price: vecCarbonPriceSale[i],
    supply: vecBarCi[i],
  });
  // if (inputTogglePriceRetirementTx) {
    carbonPriceData.push({
      key: "Retirement Price",
      price: vecCarbonPriceRetirement[i],
      supply: vecBarCi[i],
    });
  // }
}
```

```js
Plot.plot({
  caption: "Carbon Price vs. Carbon Supply",
  color: {
    legend: true,
    range: [0, 1, 2, 3].map(i => d3.schemeCategory10[i]),
    domain: [
      "Sale Price",
      "Retirement Price",
      stringPriceSaleCurrent,
      stringPriceRetirementCurrent,
      stringPriceDesired,
    ],
  },
  x: {
    type: "log",
    label: "Carbon Supply (tCO2eq)",
    domain: [1, 1e9],
  },
  y: {
    type: "log",
    label: "Carbon Price (USD/tCO2eq)",
    domain: [1e-3, 1e5 * inputCarbonPrice],
  },
  insetTop: 16,
  clip: true,
  marks: [
    Plot.frame(),
    // Plot.ruleX(paramPresentTonnes, { x: "supply", stroke: "string", strokeDasharray: 4 }),
    // Plot.rectY(paramPresentTonnes, { x1: 1, x2: "supply", y1: 1e-2, y2: "price", fill: "string" }),
    // Plot.ruleY(paramPresentTonnes, { x1: 1, x2: "supply", y: "price", stroke: "string" }),
    Plot.lineY(carbonPriceData, { x: "supply", y: "price", stroke: "key" }),
    Plot.dot(carbonPriceData2, { x: "supply", y: "price", fill: "key" }),
    // Plot.ruleX(carbonPriceData2, {
    //   x: "supply",
    //   y1: 1e-3,
    //   y2: "price",
    //   stroke: "key",
    //   strokeWidth : 2,
    //   strokeDasharray: 3,
    // }),
    Plot.ruleY(carbonPriceData2, {
      x1: "supply",
      x2: 1,
      y: "price",
      stroke: "key",
      // strokeWidth : 2,
      strokeDasharray: 4,
    }),
    Plot.ruleY(priceDesiredData, {
      x1: 1e9,
      x2: 1,
      y: "price",
      stroke: "key",
      // strokeWidth : 2,
      strokeDasharray: 4,
    }),
  ],
})
```

```js
const inputTogglePriceRetirement = view(viewTogglePriceRetirement);
const inputTogglePriceSaleTx = view(viewTogglePriceSaleTx);
const inputTogglePriceRetirementTx = view(viewTogglePriceRetirementTx);
```
