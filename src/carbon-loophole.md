---
title: Carbon Loophole
---

```js
import * as Form from "./components/form.js"
import * as Ops from "./components/ops.js"
import * as Util from "./components/util.js"
```

<h1 id="carbon-loophole" class="u-center" tabindex="-1">
  <a class="observablehq-header-anchor"
     href="#carbon-loophole">Carbon Loophole</a>
</h1>

_When is it worth it to retire carbon before selling carbon to the protocol?_

## Interactive Simulation

```js
const defaultCInitial = 100;
const defaultASupply = 1e7;
const defaultAPrice = 0.15;
const defaultAi = 1e-3;
const defaultGi = 1e-3;
const defaultDeltaCRetired = 90;
const defaultDeltaCSold = 900;

const TONNES_MIN = 1e-10;

const barCiMin = 1;
const barCiMax = 1e4;
const priceMin = 1e-2;
const priceMax = 1e6;
const nDotsPerInterval = 100;

const stringSaleNormal = "Normal Sale";
const stringRetirement = "Pre-Retirement";
const stringSaleBoosted = "Boosted Sale";
const stringProfitLoophole = "Pre-Retirement + Boosted Sale";
const stringPriceSupply = "Price-Supply Curve";
```

```js
const viewCInitial = Inputs.range([1, 1e8], {
  label: "Carbon class supply",
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
const viewDeltaCRetired = Inputs.range([0, inputCInitial * (1 - 1e-4)], {
  label: "Carbon retired",
  step: 1e-1,
  value: inputCInitial * 0.9,
});
const viewDeltaCSold = Inputs.range([1, 1e8], {
  label: "Carbon sold after retirement",
  step: 1,
  value: inputCInitial * 9,
  transform: Math.log,
});
```

```js
const viewReset = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewCInitial, defaultCInitial);
    Util.setInput(viewASupply, defaultASupply);
    Util.setInput(viewAPrice, defaultAPrice);
    Util.setInput(viewAi, defaultAi);
    Util.setInput(viewGi, defaultGi);
    Util.setInput(viewDeltaCRetired, defaultDeltaCRetired);
    Util.setInput(viewDeltaCSold, defaultDeltaCSold);
  }]],
);
```

```js
if (inputCInitial === defaultCInitial && inputASupply === defaultASupply &&
        inputAPrice === defaultAPrice && inputAi === defaultAi &&
        inputGi === defaultGi && inputDeltaCRetired === defaultDeltaCRetired &&
        inputDeltaCSold === defaultDeltaCSold) {
  viewReset.classList.add("u-hidden");
} else {
  viewReset.classList.remove("u-hidden");
}
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

const linesData = [];
for (let i = 0; i < vecBarCi.length; i++) {
  linesData.push({
    key: stringPriceSupply,
    price: vecPrice[i],
    supply: vecBarCi[i],
  });
}

const vecBarCiRetirement = Util.logRange(
  inputCInitial - inputDeltaCRetired,
  inputCInitial,
  nDotsPerInterval,
);

const vecPriceRetirement = vecBarCiRetirement.map(paramBarCi =>
  inputAPrice * inputASupply * Form.computeDeltaARetirement(
    inputAi,
    inputGi,
    (inputCInitial - paramBarCi) / inputCInitial,
  ) / (paramBarCi - inputCInitial)
);

const vecBarCiSaleNormal = Util.logRange(
  inputCInitial,
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
  inputCInitial - inputDeltaCRetired,
  inputCInitial - inputDeltaCRetired + inputDeltaCSold,
  nDotsPerInterval,
);

const vecPriceSaleBoosted = vecBarCiSaleBoosted.map(paramBarCi =>
  inputAPrice * inputASupply * Form.computeTrueDeltaA(
    inputAi,
    inputGi,
    inputCInitial - inputDeltaCRetired,
    paramBarCi - inputCInitial + inputDeltaCRetired,
  ) / (paramBarCi - inputCInitial + inputDeltaCRetired)
);

const arrowsData = [];
for (let i = 0; i < vecBarCiSaleBoosted.length; i++) {
  arrowsData.push({
    key: stringSaleNormal,
    price: vecPriceSaleNormal[i],
    supply: vecBarCiSaleNormal[i],
  });
}
for (let i = 0; i < vecBarCiRetirement.length; i++) {
  arrowsData.push({
    key: stringRetirement,
    price: vecPriceRetirement[i],
    supply: vecBarCiRetirement[i],
  });
}
for (let i = 0; i < vecBarCiSaleBoosted.length; i++) {
  arrowsData.push({
    key: stringSaleBoosted,
    price: vecPriceSaleBoosted[i],
    supply: vecBarCiSaleBoosted[i],
  });
}

const dotsData = [
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

const valueRetirement = -vecPriceRetirement[0] * inputDeltaCRetired;
const valueSaleLoophole = vecPriceSaleBoosted.at(-1) * inputDeltaCSold;
const valueSaleDirect = inputAPrice * inputASupply * Form.computeTrueDeltaA(
  inputAi,
  inputGi,
  inputCInitial,
  inputDeltaCSold,
);

const barsData = [
  { key: stringSaleNormal, value: valueSaleDirect },
  { key: stringRetirement, value: valueRetirement },
  { key: stringSaleBoosted, value: valueSaleLoophole },
  {
    key: stringProfitLoophole,
    value: valueSaleLoophole + (Number.isNaN(valueRetirement) ? 0 : valueRetirement),
  },
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

```js
Inputs.button([[stringSaleNormal, () => Util.setInput(viewDeltaCRetired, 0)]])
```

```js
Inputs.button([[stringSaleBoosted, () => {
  if (inputDeltaCRetired === 0) {
    Util.setInput(viewDeltaCRetired, inputCInitial * 0.9);
  }
}]])
```

```js
const inputCInitial = view(viewCInitial);
const inputASupply = view(viewASupply);
const inputAPrice = view(viewAPrice);
const inputAi = view(viewAi);
const inputGi = view(viewGi);
```

```js
const inputDeltaCRetired = view(viewDeltaCRetired);
const inputDeltaCSold = view(viewDeltaCSold);
```

```js
display(viewReset);
```

```js
Plot.plot({
  caption: "Carbon Price vs. Carbon Supply",
  color: {
    legend: true,
    range: [0, 3, 2, 7].map(i => d3.schemeCategory10[i]),
    domain: [stringSaleNormal, stringRetirement, stringSaleBoosted, stringPriceSupply],
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
    Plot.lineY(arrowsData, {
      x: "supply",
      y: "price",
      stroke: "key",
      strokeWidth: 1,
    }),
    Plot.lineY(linesData, {
      x: "supply",
      y: "price",
      stroke: "key",
      strokeDasharray: 4,
    }),
    Plot.dot(dotsData, { x: "supply", y: "price", fill: "key" }),
  ],
})
```
