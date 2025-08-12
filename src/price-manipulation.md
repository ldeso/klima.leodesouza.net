---
title: Price Manipulation
---

```js
import * as Form from "./components/form.js"
import * as Ops from "./components/ops.js"
import * as Util from "./components/util.js"
```

<h1 id="price-manipulation" class="u-center" tabindex="-1">
  <a class="observablehq-header-anchor"
     href="#price-manipulation">Price Manipulation</a>
</h1>

_How are users protected from price manipulation attacks?_

## Attack 1: Retirement Before Sale

### Context

- Attacker has carbon that can be sold to the protocol.
- Attacker is able to retire almost all of the carbon from this carbon class.

### Steps

1. Attacker retires almost all of the carbon from a carbon class, inflating its
price.
2. Attacker immediately sells carbon from this carbon class to the protocol at a
premium, offsetting the retirement cost and making a large profit.

For an in-depth explanation of this attack, see
[Carbon Loophole](./carbon-loophole).

### How Users are Protected

The protocol works in phases. There is always a phase between a retirement and a
consecutive sale where users are aware of the current supply and are able to
modify their allocations for that class.

Users can defend themselves by dropping their kVCM allocations between the
retirement and the consecutive sale: this which will correct the price before
the attacker is able to extract value.

## Attack 2: Price Drop Arbitrage

### Context

- Carbon price suddently drops outside of the protocol.
- Attacker is able to immediately buy carbon at this price.
- Attacker is able to immediately sell it to the protocol.

### Steps

1. Attacker monitors carbon prices outside of the protocol.
2. Attacker buys carbon immediately after a price drop.
3. Attacker immediately sells carbon from to the protocol at a premium, making a
profit.

### How Users are Protected

Two scenarios:

1. The price drop happens during the pricing phase and users know about it.

    Users can defend themselves by dropping their kVCM allocations before the
    attacker is able to sell carbon at a discounted price.

2. The price drop happens during the execution phase.

    1. Users who know about the price drop can use the Attacker's strategy.

    2. If some users don't know about the price drop:
    
        **It is expected that somebody with an information edge gets arbitrage
        opportunities: this is how markets are supposed to work.**
    
        The question is: how much value can be extracted?

        **Not so much.** The interactive simulation below shows that, in case of
        a 50% price drop:

        - When 100% of the kVCM and K2 are allocated to the carbon class,
        the Attacker can make "unlimited" profits.

        - When 50% of kVCM and K2 are allocated to the carbon class, the
        Attacker makes the highest profit by selling around 2.5 times the
        current carbon class supply: anything more is less profitable.

        - When 10% of kVCM and K2 are allocated to the carbon class, the
        Attacker makes the highest profit by selling around 1 time the current
        carbon class supply: anything more is less profitable.

### Interactive Simulation

```js
const TONNES_MIN = 1e-10;
const nDotsPerInterval = 100;

const defaultPriceDrop = 0.5;
const defaultCInitial = 100;
const defaultDeltaC = 0.5;
const defaultASupply = 1e7;
const defaultAPrice = 0.15;
const defaultAi = 0.1;
const defaultGi = 0.1;
const defaultDeltaCRetired = 90;

const stringAssetValue = "Net Asset Value";
const stringPurchase = "External Purchase";
const stringSale = "Internal Sale";
const stringProfit = "Arbitrage Profit";
const stringPriceSupply = "Price-Supply Curve";
```

```js
const barCiMin = vecBarCiSale[0] / 10;;
const barCiMax = vecBarCiSale.at(-1) * 10;
const priceMin = vecPriceSale.at(-1) / 10;
const priceMax = vecPriceSale[0] * 10;
```

```js
const viewPriceDrop = Inputs.range([0, 0.99], {
  label: "Relative price drop",
  step: 0.01,
  value: defaultPriceDrop,
  // transform: Math.log,
});
const viewDeltaC = Inputs.range([0.01, 1e3], {
  label: "Relative carbon purchased & sold",
  step: 0.01,
  value: defaultDeltaC,
  transform: Math.log,
});
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
const viewReset = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewPriceDrop, defaultPriceDrop);
    Util.setInput(viewDeltaC, defaultDeltaC);
    Util.setInput(viewCInitial, defaultCInitial);
    Util.setInput(viewASupply, defaultASupply);
    Util.setInput(viewAPrice, defaultAPrice);
    Util.setInput(viewAi, defaultAi);
    Util.setInput(viewGi, defaultGi);
  }]],
);
```

```js
if (inputPriceDrop === defaultPriceDrop && inputCInitial === defaultCInitial &&
        inputDeltaC === defaultDeltaC && inputASupply === defaultASupply &&
        inputAPrice === defaultAPrice && inputAi === defaultAi &&
        inputGi === defaultGi) {
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

const dashedData = [];
for (let i = 0; i < vecBarCi.length; i++) {
  dashedData.push({
    key: stringPriceSupply,
    price: vecPrice[i],
    supply: vecBarCi[i],
  });
  dashedData.push({
    key: stringPurchase,
    price: valuePriceExternal,
    supply: vecBarCi[i],
  });
}
```

```js
const paramDeltaBarCiTonnes = inputCInitial * inputDeltaC;

const vecBarCiSale = Util.logRange(
  inputCInitial * (1 + TONNES_MIN),
  inputCInitial + paramDeltaBarCiTonnes,
  nDotsPerInterval,
);

const vecPriceSale = vecBarCiSale.map(paramBarCi =>
  inputAPrice * inputASupply * Form.computeTrueDeltaA(
    inputAi,
    inputGi,
    inputCInitial,
    paramBarCi - inputCInitial,
  ) / (paramBarCi - inputCInitial)
);

const linesData = [];
for (let i = 0; i < vecBarCiSale.length; i++) {
  linesData.push({
    key: stringSale,
    price: vecPriceSale[i],
    supply: vecBarCiSale[i],
  });
}

const arrowsData = [
  {
    key: stringSale,
    price1: vecPriceSale.slice(-10)[0],
    price2: vecPriceSale.at(-1),
    supply1: vecBarCiSale.slice(-10)[0],
    supply2: vecBarCiSale.at(-1),
  },
];

const dotsData = [
  {
    key: stringPriceSupply,
    price: vecPriceSale[0],
    supply: vecBarCiSale[0],
  },
  {
    key: stringSale,
    price: vecPriceSale.at(-1),
    supply: vecBarCiSale.at(-1),
  },
];
```

```js
const valueAssetValue = inputCInitial * vecPriceSale[0];

const valuePriceExternal = vecPriceSale[0] * (1 - inputPriceDrop);

const valuePurchase = -paramDeltaBarCiTonnes * valuePriceExternal;

const valueSale = inputAPrice * inputASupply * Form.computeTrueDeltaA(
  inputAi,
  inputGi,
  inputCInitial,
  paramDeltaBarCiTonnes,
);

const valueProfit = valueSale + valuePurchase;

const barsData = [
  { key: stringAssetValue, value: valueAssetValue },
  { key: stringPurchase, value: valuePurchase },
  { key: stringSale, value: valueSale },
  { key: stringProfit, value: valueProfit },
];
```

```js
Plot.plot({
  caption: "Arbitrage Profit vs. Net Asset Value",
  color: {
    range: [0, 3, 2, 4].map(i => d3.schemeCategory10[i]),
    domain: [
      stringAssetValue,
      stringPurchase,
      stringSale,
      stringProfit,
    ],
  },
  x: {
    label: "",
    domain: [
      stringAssetValue,
      stringPurchase,
      stringSale,
      stringProfit,
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
const inputPriceDrop = view(viewPriceDrop);
const inputDeltaC = view(viewDeltaC);
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
    range: [3, 2, 7].map(i => d3.schemeCategory10[i]),
    domain: [stringPurchase, stringSale, stringPriceSupply],
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
    Plot.lineY(dashedData, {
      x: "supply",
      y: "price",
      stroke: "key",
      strokeDasharray: 4,
    }),
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
    Plot.dot(dotsData, { x: "supply", y: "price", fill: "key" }),
  ],
})
```
