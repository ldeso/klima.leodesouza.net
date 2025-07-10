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
const defaultASupply = 1.5e7;
const defaultAPrice = 10.0;
const defaultCarbonPriceRemoval = 140;
const defaultCarbonPriceNatureBased = 15.0;
const defaultCarbonPriceAvoidance = 0.16;
const defaultBarCRemoval = 1050.0;
const defaultBarCNatureBased = 1107984.0;
const defaultBarCAvoidance = 13556768.0;
const defaultARemoval = 0.00098;
const defaultANatureBased = 0.118;
const defaultAAvoidance = 0.0146;
const defaultGRemoval = 0.0;
const defaultGNatureBased = 0.0;
const defaultGAvoidance = 0.0;
const defaultTogglePriceRetirement = false;
const defaultTogglePriceSaleTx = false;
const defaultTogglePriceRetirementTx = false;

const viewASupply = Inputs.range([1e6, 1e10], {
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
const viewCarbonPrice = Inputs.range([1e-3, 1e5], {
  label: "Desired carbon price (USD/tCO2eq)",
  step: 1e-3,
  value: defaultCarbonPriceRemoval,
  transform: Math.log,
});
const viewBarC = Inputs.range([1, 1e9], {
  label: "Initial carbon supply",
  step: 1,
  value: defaultBarCRemoval,
  transform: Math.log,
});
const viewAi = Inputs.range([1e-5, 1], {
  label: "kVCM allocation",
  step: 1e-5,
  value: defaultARemoval,
  transform: Math.log,
});
const viewGi = Inputs.range([0, 1], {
  label: "K2 allocation",
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
  [["Avoidance – Large Scale Renewables", () => {
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
  label: "Show current price for various sales",
  value: defaultTogglePriceSaleTx,
});
const viewTogglePriceRetirementTx = Inputs.toggle({
  label: "Show current price for various retirements",
  value: defaultTogglePriceRetirementTx,
});
```

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

const vecCarbonPriceSaleMax = vecBarCi.map(paramBarCi => {
  const paramDeltaTonnes = 1e-10;
  return inputAPrice * inputASupply * Form.computeTrueDeltaA(
    1,
    inputGi,
    paramBarCi,
    paramDeltaTonnes,
  ) / paramDeltaTonnes;
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

const paramPriceSaleCurrent = Form.computeTrueDeltaA(
  inputAi,
  inputGi,
  inputBarC,
  1e-10,
) * inputAPrice * inputASupply / 1e-10;

const paramPriceRetirementCurrent = Form.computeDeltaARetirement(
  inputAi,
  inputGi,
  -1e-10 / inputBarC,
) * inputAPrice * inputASupply / 1e-10;

const paramPriceSaleCurrentMax = Form.computeTrueDeltaA(
  1,
  inputGi,
  inputBarC,
  1e-10,
) * inputAPrice * inputASupply / 1e-10;

// const stringPriceSaleCurrent = "Current Sale Price";
// const stringPriceRetirementCurrent = "Current Retirement Price";
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
const stringPriceReachable = `Reachable Price: ${
  paramPriceSaleCurrentMax.toLocaleString(
    "en-GB",
    { maximumSignificantDigits: 3 },
  )
} USD`;

const priceCurrentData = [
  { key: "Sales", price: paramPriceSaleCurrent, supply: inputBarC },
];
if (inputTogglePriceRetirement || inputTogglePriceRetirementTx) {
  priceCurrentData.push({
    key: "Retirements",
    price: paramPriceRetirementCurrent,
    supply: inputBarC,
  })
}

const priceSaleMaxData = [];
for (let i = 0; i < vecBarCi.length; i++) {
  priceSaleMaxData.push({
    key: "Max. Allocation",
    price: vecCarbonPriceSaleMax[i],
    supply: vecBarCi[i],
  });
}

const priceCurrentMinMaxData = [{
  key: stringPriceReachable,
  price: paramPriceSaleCurrentMax,
  current: paramPriceSaleCurrent,
  supply: inputBarC,
}];

const priceDesiredData = [{ key: stringPriceDesired, price: inputCarbonPrice }];

const priceData = [];
for (let i = 0; i < vecBarCi.length; i++) {
  priceData.push({
    key: stringPriceSaleCurrent,
    price: vecCarbonPriceSaleTx[i],
    supply: vecBarCi[i],
  });
  priceData.push({
    key: stringPriceRetirementCurrent,
    price: vecCarbonPriceRetirementTx[i],
    supply: vecBarCi[i],
  });
}

for (let i = 0; i < vecBarCi.length; i++) {
  priceData.push({
    key: "Sales",
    price: vecCarbonPriceSale[i],
    supply: vecBarCi[i],
  });
  // if (inputTogglePriceRetirementTx) {
    priceData.push({
      key: "Retirements",
      price: vecCarbonPriceRetirement[i],
      supply: vecBarCi[i],
    });
  // }
}
const legendStrings = ["Sales"];
const legendColors = [0];
if (inputTogglePriceRetirement || inputTogglePriceRetirementTx) {
  legendStrings.push("Retirements");
  legendColors.push(1);
}
if (inputTogglePriceSaleTx) {
  legendStrings.push(stringPriceSaleCurrent);
  legendColors.push(2);
}
if (inputTogglePriceRetirementTx) {
  legendStrings.push(stringPriceRetirementCurrent);
  legendColors.push(3);
}
legendStrings.push(stringPriceDesired);
legendColors.push(4);
legendStrings.push(stringPriceReachable);
legendColors.push(5);
// legendStrings.push("Max. Allocation");
// legendColors.push(6);
```

```js
Plot.plot({
  caption: "Carbon Price vs. Carbon Supply",
  color: {
    legend: true,
    range: legendColors.map(i => d3.schemeCategory10[i]),
    domain: legendStrings,
  },
  x: {
    type: "log",
    label: "Carbon Supply (tCO2eq)",
    domain: [10, 1e8],
    // domain: [1e4, 1e8],
  },
  y: {
    type: "log",
    label: "Carbon Price (USD/tCO2eq)",
    domain: [1e-3, 1e5],
    // domain: [1e-3, 1e2],
    grid: true,
  },
  insetTop: 16,
  clip: true,
  marks: [
    Plot.frame(),
    Plot.ruleY(priceDesiredData, {
      x1: 1e9,
      x2: 1,
      y: "price",
      stroke: "key",
      strokeDasharray: 4,
    }),
    Plot.lineY(priceData, { x: "supply", y: "price", stroke: "key" }),
    Plot.arrow(priceCurrentMinMaxData, {
      x: "supply",
      y1: "current",
      y2: "price",
      stroke: "key",
      // strokeDasharray: 4,
    }),
    Plot.dot(priceCurrentData, { x: "supply", y: "price", fill: "key" }),
    // Plot.ruleX(priceCurrentData, {
    //   x: "supply",
    //   y1: 1e-3,
    //   y2: "price",
    //   stroke: "key",
    //   strokeWidth : 2,
    //   strokeDasharray: 3,
    // }),
    // Plot.lineY(priceSaleMaxData, {
    //   x: "supply",
    //   y: "price",
    //   stroke: "key",
    //   strokeWidth : 1,
    //   // strokeDasharray: 3,
    // }),
  ],
})
```

```js
const inputTogglePriceRetirement = view(viewTogglePriceRetirement);
const inputTogglePriceSaleTx = view(viewTogglePriceSaleTx);
const inputTogglePriceRetirementTx = view(viewTogglePriceRetirementTx);
```

```js
function computeAi(deltaA, deltaC) {
  const logRatio = Math.log1p(deltaA) / Math.log1p(deltaC);
  if (logRatio > 0.5) {
    return -1;
  } else {
    return 1 - Math.sqrt(4 - 8 * logRatio) / 2;
  }
}
```

```js
const deltaC = 1e-10;
const deltaA = inputCarbonPrice * deltaC * inputBarC / (inputAPrice * inputASupply);
const requiredShare = computeAi(deltaA, deltaC);
const stringRequiredAi = (() => {
  if (requiredShare === -1) {
    return "Impossible!";
  } else {
    return requiredShare.toLocaleString(
      "en-GB",
      { maximumSignificantDigits: 3 },
    )
  }
})();
```

## Results

1. ${stringPriceSaleCurrent} / tCO2eq

2. Share of kVCM that must be allocated to reach desired price: ${stringRequiredAi}
