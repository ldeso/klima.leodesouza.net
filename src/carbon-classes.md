---
title: Maintaining Prices
---

```js
import * as Form from "./components/form.js"
import * as Ops from "./components/ops.js"
import * as Util from "./components/util.js"
```

<h1 id="carbon-classes" class="u-center" tabindex="-1">
  <a class="observablehq-header-anchor"
     href="#carbon-classes">Carbon Classes</a>
</h1>

_Which carbon class prices and allocations should we use at launch?_

## Context

The table below lists carbon classes potentially included at launch. The
checkbox at the left of each row determines whether the corresponding carbon
class is included.

```js
const defaultCarbonClasses = [
  { name: "OAE", supply: 12, price: 500 },
  { name: "BCHAR", supply: 500, price: 130 },
  { name: "Deforestation (2008–2016)", supply: 750_000, price: 0.8 },
  { name: "Deforestation (2017–2026)", supply: 25_000, price: 1.6 },
  { name: "IFM", supply: 200_000, price: 1 },
  { name: "Landfill Gas", supply: 90_000, price: 0.7 },
  { name: "Renewables", supply: 13_000_000, price: 0.2 },
];
for (const d of defaultCarbonClasses) {
  d.nav = d.supply * d.price;
}

const viewCarbonClasses = Inputs.table(defaultCarbonClasses, {
  value: defaultCarbonClasses.slice(0, 5),
  header: {
    name: "Carbon Class",
    supply: "Supply (tCO2eq)",
    price: "Price (USD)",
    nav: "Asset Value (USD)",
  },
});

const inputCarbonClasses = view(viewCarbonClasses);
```

```js
const vecCarbonClassesIndices = inputCarbonClasses.map(d =>
  defaultCarbonClasses.indexOf(d)
).sort((a, b) =>
  defaultCarbonClasses[a].supply - defaultCarbonClasses[b].supply
);

const totalSupply = d3.sum(inputCarbonClasses, d => d.supply);

const navTotal = d3.sum(inputCarbonClasses, d => d.nav);
```

The carbon classes selected above represent a **total supply of
${totalSupply.toLocaleString("en-GB")}&nbsp;tCO2eq** and a **net asset value of
${navTotal.toLocaleString("en-GB")}&nbsp;USD**. They are represented in the
figure below, where both axes are logarithmic: the vertical axis represents the
price of a carbon class and the horizontal axis represents how many tCO2eq are
in the protocol's portfolio.

```js
function computeAi(deltaA, deltaC) {
  const logRatio = Math.log1p(deltaA) / Math.log1p(deltaC);
  if (logRatio > 0.5) {
    return -1;
  }
  return 1 - Math.sqrt(1 - 2 * logRatio);
}
```

```js
const nDotsPerInterval = 10;
const supplyMin = 1e0;
const supplyMax = 1e8;
const priceMin = 1e-2;
const priceMax = 1e4;
const vecSupply = Util.logRange(supplyMin, supplyMax, nDotsPerInterval);
```

```js
const vecAi = inputCarbonClasses.map(d => {
    const deltaC = 1e-10;
    const deltaA = d.supply * d.price * deltaC / inputAMarketCap;
    return computeAi(deltaA, deltaC);
  }
);

const maxAi = d3.max(vecAi, Math.abs);
```

```js
const vecMinAiPrice = vecSupply.map(supply => {
  const paramDeltaTonnes = 1e-10;
  return Form.computeTrueDeltaA(
    inputAi,
    0,
    supply,
    paramDeltaTonnes,
  ) * inputAMarketCap / paramDeltaTonnes;
});

const dashedData = [];
for (let i = 0; i < vecSupply.length; i++) {
  dashedData.push({ supply: vecSupply[i], price: vecMinAiPrice[i] });
}
```

```js
Plot.plot({
  caption: "Price vs. Supply",
  color: {
    legend: true,
    range: vecCarbonClassesIndices.map(i => d3.schemeCategory10[i]),
    domain: vecCarbonClassesIndices.map(i => defaultCarbonClasses[i].name),
  },
  x: { type: "log", label: "Supply (tCO2eq)", domain: [1, 1e8] },
  y: { type: "log", label: "Price (USD)", domain: [1e-2, 1e4], grid: true },
  clip: true,
  marks: [
    Plot.frame(),
    Plot.lineY(dashedData, {
      x: "supply",
      y: "price",
      strokeWidth : 1,
      strokeDasharray: 4,
    }),
    Plot.dot(inputCarbonClasses, { x: "supply", y: "price", fill: "name" }),
  ],
})
```

In the above figure, the dashed line represents the price at which a user can
sell carbon to the protocol as a function of the number of tonnes of the
respective cabon class in the portfolio,
**with the kVCM allocation and market cap kept constant**.[^1]

In other words, for a given kVCM market cap, the correct kVCM allocation for a
carbon class is reached when the dot representing the carbon class falls on the
dashed line.

[^1]: For small transactions, and with the K2 allocation equal to zero.

```js
const defaultAi = maxAi;
const stepAi = 1e-5;
const viewAi = Inputs.range([stepAi, 1], {
  label: "kVCM allocation",
  step: stepAi,
  value: defaultAi,
  transform: Math.log,
});
const inputAi = view(viewAi);
```

```js
const defaultAMarketCap = 3 * navTotal;
const stepAMarketCap = 1e3;
const maxAMarketCap = 1e8;
const viewAMarketCap = Inputs.range([stepAMarketCap, maxAMarketCap], {
  label: "kVCM market cap (USD)",
  step: stepAMarketCap,
  value: defaultAMarketCap,
  transform: Math.log,
});
const inputAMarketCap = view(viewAMarketCap);
```

```js
const viewResetAi = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewAi, defaultAi);
    Util.setInput(viewAMarketCap, defaultAMarketCap);
  }]],
);
display(viewResetAi);
```

```js
if (Math.round(inputAi / stepAi) === Math.round(defaultAi / stepAi) &&
        inputAMarketCap === defaultAMarketCap) {
  viewResetAi.classList.add("u-hidden");
} else {
  viewResetAi.classList.remove("u-hidden");
}
```

Decreasing the kVCM market cap above shows that if the market cap is too small,
the protocol can become unable to price a carbon class accurately, even if 100%
of the kVCM tokens are allocated to this carbon class.

The next section describes how to set the kVCM market cap.

## kVCM Market Cap

### Relationship Between kVCM Market Cap and Net Asset Value

```js
const ratioAMCapNav = inputAMarketCap / navTotal;
```

In the figure above, the kVCM market cap is set to:

<div id="equation-1">

```tex
\text{kVCM market cap} = ${ratioAMCapNav.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
)} \times \text{net asset value} \tag{1}
```

</div>

This equation is equivalent to:

<div id="equation-2">

```tex
\text{Net asset value} = ${(100/ratioAMCapNav).toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
)} \, \% \text{ of kVCM market cap} \tag{2}
```

</div>

In order to price carbon classes accurately with this market cap, kVCM
allocations have to be set as follows:

```js
const allocatedCarbonClasses = [];
for (let i = 0; i < inputCarbonClasses.length; i++) {
  allocatedCarbonClasses.push({
    name: inputCarbonClasses[i].name,
    nav: 100 * inputCarbonClasses[i].nav / navTotal,
    kvcm: vecAi[i] === -1 ? "Not possible!" : 100 * vecAi[i],
  })
}
allocatedCarbonClasses.push({
  name: "Total",
  nav: 100,
  kvcm: vecAi.some(x => x === -1) ? "N/A" : 100 * d3.sum(vecAi),
});
```

```js
Inputs.table(allocatedCarbonClasses, {
  align: { kvcm: "right" },
  header: {
    name: "Carbon Class",
    supply: "Supply (tCO2eq)",
    price: "Price (USD)",
    nav: "Asset Value (%)",
    kvcm: "kVCM Allocation (%)",
  },
  select: false,
})
```

There are two observations to make from the above table:

1. The kVCM allocated to a carbon class is is roughly proportional to its
proportion of the asset value.

2. The total kVCM allocation&nbsp;(${
  vecAi.some(x => x === -1) ? "N/A" : d3.sum(vecAi).toLocaleString("en-GB", {
    style: "percent",
    minimumSignificantDigits: 3,
    maximumSignificantDigits: 3,
  })
}) is always roughly equal to the ratio between the net asset value and the kVCM
market cap&nbsp;(${(1/ratioAMCapNav).toLocaleString("en-GB", {
  style: "percent",
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 3,
})}).

The next section shows how to use the total kVCM allocation to set to set the
kVCM market cap.

### Setting the kVCM Market Cap in Practice

In practice, only up to 50% of the kVCM can be allocated to carbon classes as
the other 50% are required for liquidity. In order to reach the desired carbon
prices and supply, the kVCM market cap must therefore be set to:

<div id="equation-3">

```tex
\text{kVCM market cap} = ${computedRatioAMCapNav.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
)} \times \text{net asset value} \tag{3}
```

</div>

```js
const defaultATotal = 0.5;
const stepATotal = 0.01;
const viewATotal = Inputs.range([stepATotal, 1], {
  label: "Total kVCM Allocation",
  step: stepATotal,
  value: defaultATotal,
});
const inputATotal = view(viewATotal);
```

```js
const viewResetATotal = Inputs.button(
  [["Reset", () => Util.setInput(viewATotal, defaultATotal) ]],
);
display(viewResetATotal);
```

```js
if (inputATotal === defaultATotal) {
  viewResetATotal.classList.add("u-hidden");
} else {
  viewResetATotal.classList.remove("u-hidden");
}
```

```js
let computedAMarketCap = navTotal;
let computedATotal = NaN;
const computedVecAi = vecAi.slice();
while (!(computedATotal < inputATotal)) {
  computedATotal = 0;
  for (let i = 0; i < inputCarbonClasses.length; i++) {
    const d = inputCarbonClasses[i];
    const deltaC = 1e-10;
    const deltaA = d.supply * d.price * deltaC / computedAMarketCap;
    computedVecAi[i] = computeAi(deltaA, deltaC);
    if (computedVecAi[i] === -1) {
      computedATotal = NaN;
    }
    computedATotal += computedVecAi[i];
  }
  computedAMarketCap *= 1.00001;
}
const computedRatioAMCapNav = computedAMarketCap / navTotal;
```

This corresponds to a **kVCM market cap of ${computedAMarketCap.toLocaleString(
  "en-GB",
  { maximumFractionDigits: 0 },
)}&nbsp;USD** and the following kVCM allocations:

```js
const allocatedCarbonClasses2 = [];
for (let i = 0; i < inputCarbonClasses.length; i++) {
  allocatedCarbonClasses2.push({
    name: inputCarbonClasses[i].name,
    nav: 100 * inputCarbonClasses[i].nav / navTotal,
    kvcm: vecAi[i] === -1 ? "Not possible!" : 100 * computedVecAi[i],
  })
}
allocatedCarbonClasses2.push({
  name: "Total",
  nav: 100,
  kvcm: computedVecAi.some(x => x === -1) ? "N/A" : 100 * computedATotal,
});
```

```js
Inputs.table(allocatedCarbonClasses2, {
  align: { kvcm: "right" },
  header: {
    name: "Carbon Class",
    supply: "Supply (tCO2eq)",
    price: "Price (USD)",
    nav: "Asset Value (%)",
    kvcm: "kVCM Allocation (%)",
  },
  select: false,
})
```

If the kVCM market cap is considered too high, there are two possibilites to
make it smaller.

## Reducing Supply



## Devaluating Carbon


