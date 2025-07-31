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

_Is it worth it to pre-retire carbon before selling carbon to the protocol?_

## Selling Carbon at a Premium

When a users plans to sell carbon to the protocol, it is often very lucrative to
retire almost all the carbon that's already in the portfolio beforehand.

## How to Prevent this Scenario?

- Modify the model?
- Supervise the introduction of new carbon classes?
- Well-defined "open hours" when users can sell carbon, separate "open hours"
when people can retire carbon, and "closed hours" when people can only adjust
their allocations?

## Interactive Simulation

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
// if (inputDeltaCRetired === 0) {
//   viewSaleNormal.classList.add("u-disabled");
//   viewSaleBoosted.classList.remove("u-disabled");
// } else {
//   viewSaleBoosted.classList.add("u-disabled");
//   viewSaleNormal.classList.remove("u-disabled");
// }
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
  inputAPrice * inputASupply * Form.computeTrueDeltaA(
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
  { key: stringProfitLoophole, value: valueSaleLoophole + valueRetirement },
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
