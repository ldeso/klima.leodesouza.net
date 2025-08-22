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
  { name: "Defores. (2008+)", supply: 750_000, price: 0.8 },
  { name: "Defores. (2017+)", supply: 25_000, price: 1.6 },
  { name: "IFM", supply: 180_000, price: 1 },
  { name: "Landfill Gas", supply: 90_000, price: 0.7 },
  // { name: "Renewables", supply: 13_000_000, price: 0.2 },
  // { name: "Deforestation (All)", supply: 775_000, price: 0.8 },
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
  });
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

Two observations can be made from the above table:

1. The kVCM allocated to a carbon class is is roughly proportional to its
proportion of the asset value.

2. The total kVCM allocation&nbsp;(here ${
  vecAi.some(x => x === -1) ? "N/A" : d3.sum(vecAi).toLocaleString("en-GB", {
    style: "percent",
    minimumSignificantDigits: 3,
    maximumSignificantDigits: 3,
  })
}) is always roughly equal to the ratio between the net asset value and the kVCM
market cap&nbsp;(here ${(1/ratioAMCapNav).toLocaleString("en-GB", {
  style: "percent",
  minimumSignificantDigits: 3,
  maximumSignificantDigits: 3,
})}).

The next section shows how to use the total kVCM allocation to set to set the
kVCM market cap.

### Setting the kVCM Market Cap in Practice

In practice, only up to roughly 20% of the kVCM can be allocated to carbon
classes by the Klima Foundation. In order to reach the desired carbon prices and
supply, the kVCM market cap must therefore be set to (at least):

<div id="equation-3">

```tex
\text{kVCM market cap} = ${computedRatioAMCapNav.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
)} \times \text{net asset value} \tag{3}
```

</div>

```js
const defaultATotal = 0.2;
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
  [["Reset", () => Util.setInput(viewATotal, defaultATotal)]],
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
const computedCarbonClasses = [];
for (let i = 0; i < inputCarbonClasses.length; i++) {
  computedCarbonClasses.push({
    name: inputCarbonClasses[i].name,
    nav: 100 * inputCarbonClasses[i].nav / navTotal,
    kvcm: 100 * computedVecAi[i],
  });
}
computedCarbonClasses.push({
  name: "Total",
  nav: 100,
  kvcm: 100 * computedATotal,
});
```

```js
Inputs.table(computedCarbonClasses, {
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

If the kVCM market cap is considered too high, reducing carbon supply can make
it smaller.

## Reducing Supply

Reducing the supply of the carbon class with the highest asset value not only
makes the market cap smaller, but it also reduces the difference between kVCM
allocations.

Here is an example where the supply of the carbon
class&nbsp;"${inputCarbonClasses[highestNavIdx].name}" is reduced
by&nbsp;${(1 - reduction).toLocaleString("en-GB", { style: "percent" })}.

<div id="equation-4">

```tex
\text{kVCM market cap} = ${reducedRatioAMCapNav.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
)} \times \text{net asset value} \tag{4}
```

</div>

```js
const highestNavIdx = d3.maxIndex(inputCarbonClasses, d => d.nav);
const highestNav = inputCarbonClasses[highestNavIdx].nav;

const minNavTotal = navTotal - highestNav;
const maxNavTotal = navTotal;
const defaultNav = Math.round(minNavTotal + 0.5 * (maxNavTotal - minNavTotal));
const stepNav = 1;
const viewNav = Inputs.range([minNavTotal, maxNavTotal], {
  label: "Net Asset Value (USD)",
  step: stepNav,
  value: defaultNav,
});
const inputNav = view(viewNav);
```

```js
Inputs.bind(Inputs.range([stepATotal, 1], {
  label: "Total kVCM Allocation",
  step: stepATotal,
  value: defaultATotal,
}), viewATotal)
```

```js
const viewResetNav = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewNav, defaultNav);
    Util.setInput(viewATotal, defaultATotal);
  }]],
);
display(viewResetNav);
```

```js
if (inputNav === defaultNav && inputATotal === defaultATotal) {
  viewResetNav.classList.add("u-hidden");
} else {
  viewResetNav.classList.remove("u-hidden");
}
```

```js
const reduction = (inputNav - minNavTotal) / (maxNavTotal - minNavTotal);

const reducedVecSupply = [];
let reducedNav = 0;
for (let i = 0; i < inputCarbonClasses.length; i++) {
  const { supply, price } = inputCarbonClasses[i];
  const reducedSupply = supply * (i === highestNavIdx ? reduction : 1);
  reducedVecSupply.push(reducedSupply);
  reducedNav += reducedSupply * price;
};
```

```js
let reducedAMarketCap = reducedNav;
let reducedATotal = NaN;
const reducedVecAi = vecAi.slice();
while (!(reducedATotal < inputATotal)) {
  reducedATotal = 0;
  for (let i = 0; i < inputCarbonClasses.length; i++) {
    const d = inputCarbonClasses[i];
    const deltaC = 1e-10;
    const deltaA = reducedVecSupply[i] * d.price * deltaC / reducedAMarketCap;
    reducedVecAi[i] = computeAi(deltaA, deltaC);
    if (reducedVecAi[i] === -1) {
      reducedATotal = NaN;
    }
    reducedATotal += reducedVecAi[i];
  }
  reducedAMarketCap *= 1.00001;
}
const reducedRatioAMCapNav = reducedAMarketCap / reducedNav;
```

This corresponds to a **kVCM market cap of ${reducedAMarketCap.toLocaleString(
  "en-GB",
  { maximumFractionDigits: 0 },
)}&nbsp;USD** and the following kVCM allocations:

```js
const reducedCarbonClasses = [];
for (let i = 0; i < inputCarbonClasses.length; i++) {
  reducedCarbonClasses.push({
    name: inputCarbonClasses[i].name,
    supply: reducedVecSupply[i],
    price: inputCarbonClasses[i].price,
    nav: reducedVecSupply[i] * inputCarbonClasses[i].price,
    kvcm: 100 * reducedVecAi[i],
  });
}
reducedCarbonClasses.push({
  name: "Total",
  supply: d3.sum(reducedVecSupply),
  nav: inputNav,
  kvcm: 100 * reducedATotal,
});
```

```js
Inputs.table(reducedCarbonClasses, {
  header: {
    name: "Carbon Class",
    supply: "Supply (tCO2eq)",
    price: "Price (USD)",
    nav: "NAV (USD)",
    kvcm: "kVCM (%)",
  },
  select: false,
})
```

This approach has the advantage of leaving carbon prices untouched.

<!-- The next section shows how the kVCM market cap can be further reduced by
voluntarily mispricing carbon at launch.

## Devaluating Carbon

To further reduce the kVCM market cap, carbon prices can be devaluated at
launch. This changes the total net asset value used by the model without
changing the "true total net asset value". Here is an example where prices are
devaluated by ${inputDeval.toLocaleString("en-GB", { style: "percent" })}:

<div id="equation-5">

```tex
\text{kVCM market cap} = ${devalRatioAMCapNav.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
)} \times \text{true net asset value} \tag{5}
```

</div>

```js
const defaultDeval = 0.2;
const stepDeval = 0.01;
const maxDeval = 1 - stepDeval;
const viewDeval = Inputs.range([0, maxDeval], {
  label: "Devaluation",
  step: stepDeval,
  value: defaultDeval,
});
const inputDeval = view(viewDeval);
```

```js
Inputs.bind(Inputs.range([stepATotal, 1], {
  label: "Total kVCM Allocation",
  step: stepATotal,
  value: defaultATotal,
}), viewATotal)
```

```js
const viewResetDeval = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewDeval, defaultDeval);
    Util.setInput(viewATotal, defaultATotal);
  }]],
);
display(viewResetDeval);
```

```js
if (inputDeval === defaultDeval && inputATotal === defaultATotal) {
  viewResetDeval.classList.add("u-hidden");
} else {
  viewResetDeval.classList.remove("u-hidden");
}
```

```js
const devalVecPrice = inputCarbonClasses.map(d => d.price * (1 - inputDeval));
const devalNav = navTotal * (1 - inputDeval);

let devalAMarketCap = devalNav;
let devalATotal = NaN;
const devalVecAi = vecAi.slice();
while (!(devalATotal < inputATotal)) {
  devalATotal = 0;
  for (let i = 0; i < inputCarbonClasses.length; i++) {
    const d = inputCarbonClasses[i];
    const deltaC = 1e-10;
    const deltaA = d.supply * devalVecPrice[i] * deltaC / devalAMarketCap;
    devalVecAi[i] = computeAi(deltaA, deltaC);
    if (devalVecAi[i] === -1) {
      devalATotal = NaN;
    }
    devalATotal += devalVecAi[i];
  }
  devalAMarketCap *= 1.00001;
}
const devalRatioAMCapNav = devalAMarketCap / navTotal;
```

```js
const devalCarbonClasses = [];
for (let i = 0; i < inputCarbonClasses.length; i++) {
  const price = inputCarbonClasses[i].price * (inputCarbonClasses[i].name === "Renewables" ? (1 - inputDeval) : 1);
  devalCarbonClasses.push({
    name: inputCarbonClasses[i].name,
    supply: inputCarbonClasses[i].supply,
    price: price,
    nav: inputCarbonClasses[i].supply * price,
    kvcm: 100 * devalVecAi[i],
  });
}
devalCarbonClasses.push({
  name: "Total",
  nav: devalNav,
  kvcm: 100 * devalATotal,
});
```

```js
Inputs.table(devalCarbonClasses, {
  align: { kvcm: "right" },
  header: {
    name: "Carbon Class",
    supply: "Supply (tCO2eq)",
    price: "Price (USD)",
    nav: "NAV (USD)",
    kvcm: "kVCM (%)",
  },
  select: false,
})
```

The main disadvantage of this method is that if the protocol's carbon prices are
too low, nobody will be interested in selling carbon to the protocol, which will
reduce its rate of adoption. -->

## Conclusion

### Without the "Landfill Gas" Carbon Class

My recommendation for carbon prices and kVCM allocations at launch is to assume
that 20% of the total kVCM tokens will be allocated to carbon classes, and to
reduce the supply of the carbon class "Deforest. (2008+)" to
375,000&nbsp;tCO2eq:

```js
Inputs.table([
  {
    name: "OAE",
    supply: 12,
    price: 500,
    nav: 12 * 500,
    kvcm: 0.196,
  },
  {
    name: "BCHAR",
    supply: 500,
    price: 130,
    nav: 500 * 130,
    kvcm: 2.141,
  },
  {
    name: "Defores. (2008+)",
    supply: 375_000,
    price: 0.8,
    nav: 375_000 * 0.8,
    kvcm: 10.305,
  },
  {
    name: "Defores. (2017+)",
    supply: 25_000,
    price: 1.6,
    nav: 25_000 * 1.6,
    kvcm: 1.312,
  },
  {
    name: "IFM",
    supply: 180_000,
    price: 1,
    nav: 180_000 * 1,
    kvcm: 6.047,
  },
  {
    name: "Total",
    supply: 580_512,
    // price: "(avg.) 1.018",
    nav: 591_000,
    kvcm: 20,
  },
], {
  header: {
    name: "Carbon Class",
    supply: "Supply (tCO2eq)",
    price: "Price (USD)",
    nav: "NAV (USD)",
    kvcm: "kVCM (%)",
  },
  select: false,
})
```

This corresponds to a **market cap of 3,069,463&nbsp;USD**, or:

<div id="equation-5">

```tex
\text{kVCM market cap} = 5.19 \times \text{net asset value} \tag{5}
```

</div>

### With the "Landfill Gas" Carbon Class

If the "Landfill Gas" carbon class would be part of the carbon classes at
launch, I would recommend reducing the supply of the carbon class "Defores.
(2008+)" to 300,000&nbsp;tCO2eq:

```js
Inputs.table([
  {
    name: "OAE",
    supply: 12,
    price: 500,
    nav: 12 * 500,
    kvcm: 0.196,
  },
  {
    name: "BCHAR",
    supply: 500,
    price: 130,
    nav: 500 * 130,
    kvcm: 2.149,
  },
  {
    name: "Defores. (2008+)",
    supply: 300_000,
    price: 0.8,
    nav: 300_000 * 0.8,
    kvcm: 8.184,
  },
  {
    name: "Defores. (2017+)",
    supply: 25_000,
    price: 1.6,
    nav: 25_000 * 1.6,
    kvcm: 1.317,
  },
  {
    name: "IFM",
    supply: 180_000,
    price: 1,
    nav: 180_000 * 1,
    kvcm: 6.071,
  },
  {
    name: "Landfill Gas",
    supply: 90_000,
    price: 0.7,
    nav: 90_000 * 0.7,
    kvcm: 2.082,
  },
  {
    name: "Total",
    supply: 580_512,
    // price: "(avg.) 1.018",
    nav: 591_000,
    kvcm: 20,
  },
], {
  header: {
    name: "Carbon Class",
    supply: "Supply (tCO2eq)",
    price: "Price (USD)",
    nav: "NAV (USD)",
    kvcm: "kVCM (%)",
  },
  select: false,
})
```

This corresponds to a **market cap of 3,057,617&nbsp;USD**, which gives:

<div id="equation-6">

```tex
\text{kVCM market cap} = 5.15 \times \text{net asset value} \tag{6}
```
