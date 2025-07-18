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

## Context

- Net asset value: ${d3.sum(
  carbonClasses,
  d => d.price * d.liquidity,
).toLocaleString(
  "en-GB",
  { maximumFractionDigits: 0 },
)} USD

- Maximum allocated treasury-owned kVCM: ${(0.1 + 0.875 * 1337420.69 / 9839061.6).toLocaleString(
  "en-GB",
  { style: "percent", maximumSignificantDigits: 3 },
)}

<!-- - Allocatable treasury share of K2: https://app.klimaprotocol.com/ -->

## Results

### Proposition 1: Large Market Cap

- "Treasury kVCM allocations must be sufficient to price carbon classes"

- Token price: 3 USD/kVCM

- kVCM market cap: 45,184,704 USD

- Treasury allocations:

  | Carbon Class         | tCO2eq       | USD/tCO2eq | kVCM       | K2      |
  |:-------------------- | ------------:| ----------:| ----------:| -------:|
  | OAE                  |      700     |   700.00 $ |     0.022% |     0 % |
  | BCHAR                |     1050     |   150.00 $ |     0.349% |     0 % |
  | Mangrove Restoration |     1063     |    35.00 $ |     0.082% |     0 % |
  | REDD+                |  1107984     |     1.50 $ |     3.748% |     0 % |
  | IFM                  |   298455     |     1.20 $ |     0.796% |     0 % |
  | Landfill Gas         |    96234     |     0.90 $ |     0.192% |     0 % |
  | Renewables           | 13556768     |     0.15 $ |     4.607% |     0 % |
  | **TOTAL**            | **15061568** | **0.29 $** | **9.796%** | **0 %** |

### Proposition 2: Trust Users

- "Market cap must stay close to net asset value"

- Token price: 0.7 USD/kVCM

- Market cap: 10,543,098 USD

- Treasury allocations:

  | Carbon Class         | tCO2eq       | USD/tCO2eq | kVCM       | K2      |
  |:-------------------- | ------------:| ----------:| ----------:| -------:|
  | OAE                  |      700     |   165.66 $ |     0.022% |     0 % |
  | BCHAR                |     1050     |    34.98 $ |     0.349% |     0 % |
  | Mangrove Restoration |     1063     |     8.13 $ |     0.082% |     0 % |
  | REDD+                |  1107984     |     0.35 $ |     3.748% |     0 % |
  | IFM                  |   298455     |     0.28 $ |     0.796% |     0 % |
  | Landfill Gas         |    96234     |     0.21 $ |     0.192% |     0 % |
  | Renewables           | 13556768     |     0.15 $ |     4.607% |     0 % |
  | **TOTAL**            | **15061568** |            | **9.796%** | **0 %** |

- Treasury allocations + user allocations:

  | Carbon Class         | tCO2eq       | USD/tCO2eq | kVCM        | K2      |
  |:-------------------- | ------------:| ----------:| -----------:| -------:|
  | OAE                  |      700     |   700.00 $ |      0.093% |     0 % |
  | BCHAR                |     1050     |   150.00 $ |      1.505% |     0 % |
  | Mangrove Restoration |     1063     |    35.00 $ |      0.354% |     0 % |
  | REDD+                |  1107984     |     1.50 $ |     17.252% |     0 % |
  | IFM                  |   298455     |     1.20 $ |      3.457% |     0 % |
  | Landfill Gas         |    96234     |     0.90 $ |      0.825% |     0 % |
  | Renewables           | 13556768     |     0.04 $ |     21.626% |     0 % |
  | **TOTAL**            | **15061568** | **0.29 $** | **45.111%** | **0 %** |

## Interactive Simulation

```js
function computeAi(deltaA, deltaC, Gi) {
  // const Gm1squared = (1 - Gi)^2;
  const logRatio = Math.log1p(deltaA) / Math.log1p(deltaC);
  if (logRatio > 0.5) {
    return -1;
  } else {
    return 1 - Math.sqrt(1 - 2 * logRatio);
    // return (1 - Math.sqrt(1 - 2 * Gm1squared * logRatio)) / Gm1squared;
  }
}
```

```js
const carbonClasses = [
  {
    name: "OAE (Removal – High Durability)",
    price: 700,
    liquidity: 14,
    kvcm: 0.00022,
    k2: 0,
  },
  {
    name: "BCHAR (Removal – Biochar)",
    price: 150,
    liquidity: 1050,
    kvcm: 0.00349,
    k2: 0,
  },
  {
    name: "Mangrove Restoration (NBS – Removal)",
    price: 35,
    liquidity: 1063,
    kvcm: 0.00082,
    k2: 0,
  },
  {
    name: "REDD+ (NBS – Mitigation/Avoidance)",
    price: 1.5,
    liquidity: 1107984,
    kvcm: 0.03748,
    k2: 0,
  },
  {
    name: "IFM (NBS – Mitigation/Avoidance)",
    price: 1.2,
    liquidity: 298455,
    kvcm: 0.00796,
    k2: 0,
  },
  {
    name: "Landfill Gas (Avoidance – Other)",
    price: 0.9,
    liquidity: 96234,
    kvcm: 0.00192,
    k2: 0,
  },
  {
    name: "Renewables – Large Scale (Avoidance – Other)",
    price: 0.15,
    liquidity: 13556768,
    kvcm: 0.04607,
    k2: 0,
  },
]
const defaultASupply = d3.sum(carbonClasses, d => d.liquidity);
const defaultAPrice = 3;
const defaultTogglePriceRetirement = false;
const defaultTogglePriceSaleTx = false;
const defaultTogglePriceRetirementTx = false;
```

```js
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
  value: carbonClasses[6].price,
  transform: Math.log,
});
const viewBarC = Inputs.range([10, 1e9], {
  label: "Current carbon supply",
  step: 1,
  value: carbonClasses[6].liquidity,
  transform: Math.log,
});
const viewAi = Inputs.range([1e-5, 1], {
  label: "kVCM allocation",
  step: 1e-5,
  value: carbonClasses[6].kvcm,
  transform: Math.log,
});
const viewGi = Inputs.range([0, 1], {
  label: "K2 allocation",
  step: 1e-3,
  value: carbonClasses[6].k2,
});
```

```js
const viewButtons = carbonClasses.map(({ name, price, liquidity, kvcm, k2}) =>
  Inputs.button(
    [[name, () => {
      const deltaC = 1e-10;
      const deltaA = price * deltaC * liquidity / (inputAPrice * inputASupply);
      const paramAi = computeAi(deltaA, deltaC, inputGi);
      Util.setInput(viewCarbonPrice, price);
      Util.setInput(viewBarC, liquidity);
      if (paramAi == -1) {
        Util.setInput(viewAi, 1);
      } else {
        Util.setInput(viewAi, paramAi);
      }
      // Util.setInput(viewGi, k2);
    }]]
  )
)
```

```js
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
  label: "Show various sales price at current supply",
  value: defaultTogglePriceSaleTx,
});
const viewTogglePriceRetirementTx = Inputs.toggle({
  label: "Show various retirement prices at current supply",
  value: defaultTogglePriceRetirementTx,
});
```

```js
for (const viewButton of viewButtons) {
  display(viewButton);
}
```

```js
const inputCarbonPrice = view(viewCarbonPrice);
const inputBarC = view(viewBarC);
const inputAi = view(viewAi);
const inputGi = view(viewGi);
```

```js
const inputAPrice = view(viewAPrice);
const inputASupply = view(viewASupply);
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
const stringPriceSaleCurrent = `Current price: ${
  paramPriceSaleCurrent.toLocaleString(
    "en-GB",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  )
} USD`;
const stringPriceRetirementCurrent = `Current retirement price: ${
  paramPriceRetirementCurrent.toLocaleString(
    "en-GB",
    { maximumSignificantDigits: 3 },
  )
} USD`;
const stringPriceDesired = `Desired price: ${
  inputCarbonPrice.toLocaleString(
    "en-GB",
    { maximumSignificantDigits: 3 },
  )
} USD`;
const stringPriceReachable = `Maximum price: ${
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
    domain: [1e-2, 1e7],
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
const deltaC = 1e-10;
const deltaA = inputCarbonPrice * deltaC * inputBarC /
        (inputAPrice * inputASupply);
const requiredShare = computeAi(deltaA, deltaC, inputGi);
const stringRequiredAi = (() => {
  if (requiredShare === -1) {
    return "Impossible!";
  } else {
    return requiredShare.toLocaleString(
      "en-GB",
      { style: "percent", minimumFractionDigits: 3, maximumFractionDigits: 3 },
    )
  }
})();
```

## Result

1. ${stringPriceDesired}/tCO2eq (${stringPriceSaleCurrent}/tCO2eq)

2. kVCM allocation needed to reach the desired price: ${stringRequiredAi}

3. Mean carbon price: ${(d3.sum(
  carbonClasses,
  d => d.price * d.liquidity,
) / d3.sum(carbonClasses, d => d.liquidity)).toLocaleString(
  "en-GB",
  { maximumSignificantDigits: 3 },
)} USD/tCO2eq

4. Total carbon value: ${d3.sum(
  carbonClasses,
  d => d.price * d.liquidity,
).toLocaleString(
  "en-GB",
  { maximumFractionDigits: 0 },
)} USD

5. kVCM market cap: ${(inputAPrice * inputASupply).toLocaleString(
  "en-GB",
  { maximumFractionDigits: 0 },
)} USD

5. Total kVCM allocated: ${(() => {
  const totalRequiredShare = d3.sum(carbonClasses, d => {
    const deltaC = 1e-10;
    const deltaA = d.price * deltaC * d.liquidity / (inputAPrice * inputASupply);
    const requiredShare = computeAi(deltaA, deltaC, inputGi);
    if (requiredShare === -1) {
      return -1000000;
    } else {
      return requiredShare;
    }
  });
  if (0 < totalRequiredShare && totalRequiredShare <= 1) {
    return totalRequiredShare.toLocaleString(
      "en-GB",
      { style: "percent", minimumFractionDigits: 3, maximumFractionDigits: 3 },
    );
  } else {
    return "Impossible!";
  }
})()}

6. Treasury-owned kVCM: ${(0.1 + 0.875 * 1337420.69 / 9839061.6).toLocaleString(
  "en-GB",
  { style: "percent", maximumSignificantDigits: 3 },
)}

## Analysis

The protocol prices a carbon class based on how many tonnes of this class are
held in the portfolio. Looking at three carbon classes, we observe the
following:

1. To reach a desired price, each carbon class requires a different amount of
kVCM allocated. The REDD+ class requires roughly 10 times more kVCM allocations
than the large scale renewable class, which requires roughly 10 times more than
the BCHAR class.

2. **Overpriced carbon scenario:** If the kVCM token price increases, the price
of all carbon classes will increase. This is expected to lead to higher volumes
of carbon sold to the protocol, and therefore to an increase in the total kVCM
supply.

    - In an ideal scenario where the foundation would control all kVCM tokens,
    it would always be able to reduce the price of carbon classes by lowering
    its kVCM allocations.

    - If too many kVCM tokens remain allocated to an overpriced carbon class,
    arbitrages will cause carbon prices to slowly come back to an equilibrium
    as the number of tonnes in the portfolio increases.

3. **Underpriced carbon scenario:** If the kVCM token price decreases, the price
of all carbon classes will decrease, which is expected to reduce the volume of
cabon sold to the protocol, and therefore reduce the creation of new kVCM
tokens.

    - Increasing kVCM allocations to underpriced carbon classes is not always
    possible; there is even a theoretical maximum price reached when
    100% of kVCM tokens are allocated to a carbon class.

    - If not enough kVCM tokens are allocated to an underpriced carbon class,
    its price is only able to come back to an equilibrium if the number of
    tonnes in the portfolio decreases. This can happen with carbon retirements
    or very slowly with liquid carbon yield.

4. **kVCM mint & burn cycle:** If the kVCM token price oscillates, the price of
all carbon classes will increase and decrease regularly.

    - If kVCM token holders are able to modify their allocations fast enough to
    maintain accurate carbon prices, arbitrages will be avoided.

    - If carbon is regularly overpriced, there will be a regularly creation of
    new kVCM tokens. **This may dilute the share of kVCM tokens owned by the Klima
    Foundation.**

## Questions

1. How are carbon prices affected by the fact that the supply of kVCM tokens
changes after a carbon sale and retirements?

2. How many carbon sales have to take place to significantly dilute the share of
kVCM tokens owned by the Klima Foundation?
