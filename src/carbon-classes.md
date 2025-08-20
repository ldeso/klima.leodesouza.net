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
  { name: "Deforestation (All)", supply: 775_000, price: 0.8 },
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

If the kVCM market cap is considered too high, there are two possibilites to
make it smaller.

## Reducing Supply

Reducing the supply of carbon classes that have a higher asset value makes the
difference between carbon kVCM allocations smaller. When kVCM allocations are
closer to each other, the required kVCM market cap becomes slighly closer to the
total net asset value.

<div id="equation-4">

```tex
\text{kVCM market cap} = ${normRatioAMCapNav.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
)} \times \text{net asset value} \tag{4}
```

</div>

```js
const minNav = d3.min(inputCarbonClasses, d => d.nav);

const minNavTotal = minNav * inputCarbonClasses.length;
const maxNavTotal = navTotal;
const defaultNav = Math.round(minNavTotal + 0.2 * (maxNavTotal - minNavTotal));
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
const normalization = (inputNav - minNavTotal) / (maxNavTotal - minNavTotal);

const normVecSupply = [];
let normNav = 0;
for (let i = 0; i < inputCarbonClasses.length; i++) {
  const { supply, price } = inputCarbonClasses[i];
  const minSupply = minNav / price;
  const normSupply = minSupply + normalization * (supply - minSupply);
  normVecSupply.push(normSupply);
  normNav += normSupply * price;
};
```

```js
let normAMarketCap = normNav;
let normATotal = NaN;
const normVecAi = vecAi.slice();
while (!(normATotal < inputATotal)) {
  normATotal = 0;
  for (let i = 0; i < inputCarbonClasses.length; i++) {
    const d = inputCarbonClasses[i];
    const deltaC = 1e-10;
    const deltaA = normVecSupply[i] * d.price * deltaC / normAMarketCap;
    normVecAi[i] = computeAi(deltaA, deltaC);
    if (normVecAi[i] === -1) {
      normATotal = NaN;
    }
    normATotal += normVecAi[i];
  }
  normAMarketCap *= 1.00001;
}
const normRatioAMCapNav = normAMarketCap / normNav;
```

```js
const normCarbonClasses = [];
for (let i = 0; i < inputCarbonClasses.length; i++) {
  normCarbonClasses.push({
    name: inputCarbonClasses[i].name,
    supply: normVecSupply[i],
    price: inputCarbonClasses[i].price,
    nav: normVecSupply[i] * inputCarbonClasses[i].price,
    kvcm: 100 * normVecAi[i],
  });
}
normCarbonClasses.push({
  name: "Total",
  nav: inputNav,
  kvcm: 100 * normATotal,
});
```

```js
Inputs.table(normCarbonClasses, {
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

This approach has the advantage of leaving carbon prices untouched. Its
disadvantage, on the other hand, is that the total net asset value has to be
greatly reduced to have a significant effect.

The next section shows how the kVCM market cap can be further reduced by
voluntarily mispricing carbon at launch.

## Devaluating Carbon

To further reduce the kVCM market cap, allcarbon prices can be devaluated at
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
  devalCarbonClasses.push({
    name: inputCarbonClasses[i].name,
    supply: inputCarbonClasses[i].supply,
    price: devalVecPrice[i],
    nav: inputCarbonClasses[i].supply * devalVecPrice[i],
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
reduce its rate of adoption.

## Conclusion

My recommendation for carbon prices and kVCM allocations at launch are as
follows, in order of preference.

1. Do not devaluate carbon and assume 40% kVCM allocation at launch:

    ```js
    Inputs.table([
      {
        name: "OAE",
        supply: 12,
        price: 500,
        kvcm: 0.237,
      },
      {
        name: "BCHAR",
        supply: 500,
        price: 130,
        kvcm: 2.593,
      },
      {
        name: "Deforestation (2008–2016)",
        supply: 750_000,
        price: 0.8,
        kvcm: 27.371,
      },
      {
        name: "Deforestation (2017–2026)",
        supply: 25_000,
        price: 1.6,
        kvcm: 1.588,
      },
      {
        name: "IFM",
        supply: 200_000,
        price: 1,
        kvcm: 8.212,
      },
      {
        name: "Total",
        kvcm: 40,
      },
    ], {
      header: {
        name: "Carbon Class",
        supply: "Supply (tCO2eq)",
        price: "Price (USD)",
        kvcm: "kVCM (%)",
      },
      select: false,
    })
    ```

    This gives:

    <div id="equation-6">

    ```tex
    \text{kVCM market cap} = 2.79 \times \text{net asset value} \tag{6}
    ```

    </div>

2. Devaluate carbon prices by 30%:

    ```js
    Inputs.table([
      {
        name: "OAE",
        supply: 12,
        price: 350,
        kvcm: 0.237,
      },
      {
        name: "BCHAR",
        supply: 500,
        price: 91,
        kvcm: 2.593,
      },
      {
        name: "Deforestation (2008–2016)",
        supply: 750_000,
        price: 0.56,
        kvcm: 27.371,
      },
      {
        name: "Deforestation (2017–2026)",
        supply: 25_000,
        price: 1.12,
        kvcm: 1.588,
      },
      {
        name: "IFM",
        supply: 200_000,
        price: 0.7,
        kvcm: 8.212,
      },
      {
        name: "Total",
        kvcm: 40,
      },
    ], {
      header: {
        name: "Carbon Class",
        supply: "Supply (tCO2eq)",
        price: "Price (USD)",
        kvcm: "kVCM (%)",
      },
      select: false,
    })
    ```

    This gives:

    <div id="equation-7">

    ```tex
    \text{kVCM market cap} = 1.84 \times \text{true net asset value} \tag{7}
    ```

    </div>

    Note that devaluating carbon may reduce the rate of adoption as it
    discourages selling carbon to the protocol.
