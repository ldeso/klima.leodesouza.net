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

<!-- ## Attack 1: Retirement Before Sale

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
3. Attacker immediately sells carbon to the protocol at a premium, making a
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
const inputDeltaC = inputCInitial * inputDeltaC;

const vecBarCiSale = Util.logRange(
  inputCInitial * (1 + TONNES_MIN),
  inputCInitial + inputDeltaC,
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

const valuePurchase = -inputDeltaC * valuePriceExternal;

const valueSale = inputAPrice * inputASupply * Form.computeTrueDeltaA(
  inputAi,
  inputGi,
  inputCInitial,
  inputDeltaC,
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

## Attack 3: Flash Allocation

### Context

- Attacker has carbon that can be sold to the protocol.
- Attacker owns a significant share of the locked kVCM tokens.

### Steps

1. Attacker allocates all of its kVCM to a carbon class.
2. Attacker immediately sells carbon to the protocol at a premium, making a
profit.

### How Users are Protected

The protocol works in phases. Even if the attacker allocates all of its kVCM to
a carbon class, users can defend themselves by dropping their K2 allocations to
this class before the sale, which will correct the price before the attacker is
able to extract value.

-->

### Interactive Simulation

```js
const RATE_LIMIT = 0.005;
const RATE_LIMIT_K2 = 0.1;

const states = [{
  valuesRaw: {
    carbon: 1100,
    kvcmAlloc: 250_000,
    k2Alloc: 250_000,
    kvcmTotal: 1_000_000,
    k2Total: 1_000_000,
  },
  snapshots: {
    carbon: { value: 1100, time: 0, rate: RATE_LIMIT },
    kvcmAlloc: { value: 250_000, time: 0, rate: RATE_LIMIT },
    k2Alloc: { value: 250_000, time: 0, rate: RATE_LIMIT_K2 },
    kvcmTotal: { value: 1_000_000, time: 0, rate: RATE_LIMIT },
    k2Total: { value: 1_000_000, time: 0, rate: RATE_LIMIT_K2 },
  },
  time: -4,
}];

states.push(executeRetire(states.at(-1), -100, 0));
states.push(executeRetire(states.at(-1), -100, 24));
states.push(executeSwap(states.at(-1), +150, 25));
states.push(changeValue(states.at(-1), "kvcmAlloc", -100, 32));

const timeMin = -4;
const timeMax = 32;

const data = [];
for (const state of states) {
  const { valuesRaw, snapshots, time } = state;
  for (const name in valuesRaw) {
    const value = valuesRaw[name];
    data.push({ type: "Raw", name, value, time });
  }
  for (const name in snapshots) {
    const { value, time } = snapshots[name];
    if (data.every(d => d.type !== "Snapshot" || d.name !== name || d.time !== time)) {
      data.push({ type: "Snapshot", name, value, time });
      for (let t = time; t < timeMax + 0.01; t += 0.1) {
        data.push({
          type: "Effective",
          name,
          value: computeEffectiveValue(name, { [name]: 0 }, snapshots, t),
          time,
          snapTime: t,
        });
      }
    }
  }
}
```

```js
Plot.plot({
  caption: "Carbon Supply",
  color: {
    legend: true,
    range: [0, 3, 2].map(i => d3.schemeCategory10[i]),
    domain: ["Raw", "Snapshot", "Effective"],
  },
  x: { label: "Time (hour)" },
  y: { label: "Value", domain: [0, 1500] },
  // insetTop: 16,
  // clip: true,
  marks: [
    Plot.frame(),
    Plot.lineY(data, {
      filter: d => d.name === "carbon" && d.type === "Raw" ? d.value : 0,
      x: "time",
      y: "value",
      stroke: "type",
      curve: "step-after",
    }),
    Plot.lineY(data, {
      filter: d => d.name === "carbon" && d.type === "Effective" ? d.value : 0,
      x: "snapTime",
      y: "value",
      z: "time",
      stroke: "type",
      size: 1,
      strokeDasharray: 4,
    }),
    Plot.dotY(data, {
      filter: d => d.name === "carbon" && d.type === "Snapshot" ? d.value : 0,
      x: "time",
      y: "value",
      fill: "type",
    }),
  ],
})
```

```js echo
function executeSwap(state, carbonDelta, time) {
  const { valuesRaw, snapshots } = state;
  const valuesEffective = computeEffectiveValues(valuesRaw, snapshots, time);
  const kvcmDelta = computePriceSwap(valuesEffective, carbonDelta);
  const stateNew = {
    valuesRaw: {
      ...valuesRaw,
      carbon: valuesRaw.carbon + carbonDelta,
      kvcmTotal: valuesRaw.kvcmTotal + kvcmDelta,
    },
    snapshots,
    time,
  };
  return stateNew;
}

function executeRetire(state, carbonDelta, time) {
  const { valuesRaw, snapshots } = state;
  const valuesEffective = computeEffectiveValues(valuesRaw, snapshots, time);
  const valuesRetirement = { ...valuesEffective, carbon: valuesRaw.carbon };
  const kvcmDelta = computePriceRetire(valuesRetirement, carbonDelta);
  const stateNew = {
    valuesRaw: {
      ...valuesRaw,
      carbon: valuesRaw.carbon + carbonDelta,
      kvcmTotal: valuesRaw.kvcmTotal + kvcmDelta,
    },
    snapshots: {
      ...snapshots,
      carbon: maybeUpdatedSnapshot(
        snapshots.carbon,
        valuesEffective.carbon,
        valuesRaw.carbon,
        time,
      ),
      kvcmTotal: maybeUpdatedSnapshot(
        snapshots.kvcmTotal,
        valuesEffective.kvcmTotal,
        valuesRaw.kvcmTotal,
        time,
      ),
    },
    time,
  };
  return stateNew;
}

function changeValue(state, name, delta, time) {
  if (name === "carbon") {
    throw new Error("Use `executeSwap` or `executeRetire` to change `carbon`");
  }
  const { valuesRaw, snapshots } = state;
  const valueEffective = computeEffectiveValue(
    name,
    valuesRaw,
    snapshots,
    time,
  );
  const stateNew = {
    valuesRaw: { ...valuesRaw, [name]: valuesRaw[name] + delta },
    snapshots: {
      ...snapshots,
      [name]: maybeUpdatedSnapshot(
        snapshots[name],
        valueEffective,
        valuesRaw[name],
        time,
      ),
    },
    time,
  };
  return stateNew;
}
```

```js
function computeEffectiveValues(valuesRaw, snapshots, time) {
  const valuesEffective = {
    carbon: computeEffectiveValue("carbon", valuesRaw, snapshots, time),
    kvcmAlloc: computeEffectiveValue("kvcmAlloc", valuesRaw, snapshots, time),
    k2Alloc: computeEffectiveValue("k2Alloc", valuesRaw, snapshots, time),
    kvcmTotal: computeEffectiveValue("kvcmTotal", valuesRaw, snapshots, time),
    k2Total: computeEffectiveValue("k2Total", valuesRaw, snapshots, time),
  };
  return valuesEffective;
}

function computeEffectiveValue(name, valuesRaw, snapshots, time) {
  let valueEffective;
  if (name === "carbon" || name === "kvcmTotal" || name === "k2Total") {
    valueEffective = rateLimitedInv(valuesRaw[name], snapshots[name], time);
  } else {
    valueEffective = rateLimited(valuesRaw[name], snapshots[name], time);
  }
  return valueEffective;
}

function maybeUpdatedSnapshot(snapshot, valueEffective, valueRaw, time) {
  if (valueEffective === valueRaw) {
    return { value: valueRaw, time: time, rate: snapshot.rate };
  }
  return snapshot;
}

function rateLimited(valueRaw, snapshot, time) {
  const timeDelta = time - snapshot.time;
  const valueLimit = snapshot.value * (1 + snapshot.rate * timeDelta);
  const valueEffective = Math.min(valueRaw, valueLimit);
  return valueEffective;
}

function rateLimitedInv(valueRaw, snapshot, time) {
  const timeDelta = time - snapshot.time;
  const valueLimit = snapshot.value / (1 + snapshot.rate * timeDelta);
  const valueEffective = Math.max(valueRaw, valueLimit);
  return valueEffective;
}

function computePriceSwap(valuesEffective, carbonDelta) {
  const { carbon, kvcmAlloc, k2Alloc, kvcmTotal, k2Total } = valuesEffective;
  const Ai = kvcmAlloc / kvcmTotal;
  const Gi = k2Alloc / k2Total;
  const deltaA = Form.computeTrueDeltaA(Ai, Gi, carbon, carbonDelta);
  const kvcmDelta = deltaA * kvcmTotal;
  return kvcmDelta;
}

function computePriceRetire(valuesEffective, carbonDelta) {
  const { carbon, kvcmAlloc, k2Alloc, kvcmTotal, k2Total } = valuesEffective;
  const Ai = kvcmAlloc / kvcmTotal;
  const Gi = k2Alloc / k2Total;
  const deltaCi = carbonDelta / carbon;
  const deltaA = -Form.computeDeltaARetirement(Ai, Gi, deltaCi);
  const kvcmDelta = deltaA * kvcmTotal;
  return kvcmDelta;
}
```

```js
// // function to compute how state is updated because of a swap or retirement
// function executeTx(supplyDelta, timestamp, rawState, effectiveState, futureEffectiveState) {
//   // compute kVCM price based on swap math (supplyDelta > 0) or retirement math (supplyDelta < 0)
//   kvcmDelta = quoteSwapOrRetirement(supplyDelta, effectiveState)

//   // update raw state
//   rawState.kvcm += kvcmDelta
//   rawState.Ci += supplyDelta

//   // update effectiveState if first tx in block
//   if (effectiveState.timestamp !== timestamp) {
//     effectiveState.timestamp = timestamp
//     effectiveState.Ci = futureEffectiveState.Ci
//     effectiveState.Ai = futureEffectiveState.Ai
//     effectiveState.Gi = futureEffectiveState.Gi
//   }

//   // update futureEffectiveState
//   timeDelta = timestamp - effectiveState.timeStamp
//   futureEffectiveState.Ci = rateLimitIfDecrease(effectiveState.Ci, rawState.Ci, timeDelta)

//   return { rawState, effectiveState, futureEffectiveState }
// }

// // generic function to compute rate limited decrease
// function rateLimitIfIncreased(previousValue, rawNewValue, timeDelta, rateLimit = RATE_LIMIT) {
//   minAllowedValue = previousValue * (1 - rateLimit * timeDelta)
//   rateLimitedValue = max(minAllowedValue, rawNewValue)
//   return rateLimitedValue
// }

```

Summary:
- Use the current smart contract implementation to calculate a "raw supply", a "raw kVCM allocation" and a "raw K2 allocation" for each carbon class
- Store an additional "stored timestamp", "stored supply", "stored kVCM allocation" and "stored K2 allocation" for each carbon class 

At each retirement:
- Calculate an "effective kVCM allocation" and "effective K2 allocation" from their respective stored values and from the "stored timestamp"
- Use the "raw supply", the "effective kVCM allocation" and the "effective K2 allocation" to calculate the carbon price in kVCM
- Update the "raw supply"

At each swap:
- Calculate an "effective supply", "effective kVCM allocation" and "effective K2 allocation" from their respective stored values and from the "stored timestamp"
- If "effective supply" is equal to "raw supply", overwrite "stored supply", "stored kVCM allocation" and "stored K2 allocation" with their effective values, and overwrite the "stored timestamp" with the current timestamp
- Use the "effective supply", the "effective kVCM allocation" and the "effective K2 allocation" to calculate the carbon price in kVCM
- Update the "raw supply"

At each kVCM allocation:
- Calculate an "effective supply", "effective kVCM allocation" and "effective K2 allocation" from their respective stored values and from the "stored timestamp"
- If "effective kVCM allocation" is equal to "raw kVCM allocation", overwrite "stored kVCM allocation", "stored kVCM allocation" and "stored K2 allocation" with their effective values, and overwrite the "stored timestamp" with the current timestamp
- Use the "effective supply", the "effective kVCM allocation" and the "effective K2 allocation" to calculate the carbon price in kVCM
- Update the "raw supply"





The effective supply is max("raw supply", "stored supply")
- Use the "effective supply", the "raw kVCM allocation" and the "raw K2 allocation" to calculate the carbon price in kVCM
- Update "raw supply". If "raw supply" falls above "effective supply", update "effective supply"

- Whenever an allocation or a retirement cause the kVCM/tCO2eq price of a carbon class to decrease below the current "effective"


```js
const TONNES_MIN = 1e-10;
const nDotsPerInterval = 100;

const defaultPriceDrop = 0.5;
const defaultCInitial = 100;
const defaultDeltaC = 10;
const defaultASupply = 1e7;
const defaultAPrice = 0.15;
const defaultAiInitial = 0.1;
const defaultAiAttack = 0.2;
const defaultGiInitial = 0.1;
const defaultGiDefense = 0.0;
const defaultDeltaCRetired = 90;

const stringSaleInitial = "Normal Sale";
const stringSaleAttack = "Sale after kVCM Allocation";
const stringSaleDefense = "Sale after K2 Deallocation";
const stringProfit = "Profit";
const stringPriceSupply = "Price-Supply Curve";
```

Initial state:

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
```

```js
const inputCInitial = view(viewCInitial);
const inputASupply = view(viewASupply);
const inputAPrice = view(viewAPrice);
```

<!-- ```js
const viewAiInitial = Inputs.range([1e-5, 1], {
  label: "kVCM allocation before attack",
  step: 1e-5,
  value: defaultAiInitial,
  transform: Math.log,
});
const viewAiAttack = Inputs.range([1e-5, 1], {
  label: "kVCM allocation after attack",
  step: 1e-5,
  value: defaultAiAttack,
  transform: Math.log,
});
const viewGiInitial = Inputs.range([0, 1], {
  label: "K2 allocation before defense",
  step: 1e-5,
  value: defaultGiInitial,
});
const viewGiDefense = Inputs.range([0, 1], {
  label: "K2 allocation after defense",
  step: 1e-5,
  value: defaultGiDefense,
});
const viewDeltaC = Inputs.range([1, 1e8], {
  label: "Carbon sold",
  step: 1,
  value: defaultDeltaC,
  transform: Math.log,
});
```

```js
const inputAiInitial = view(viewAiInitial);
const inputAiAttack = view(viewAiAttack);
const inputGiInitial = view(viewGiInitial);
const inputGiDefense = view(viewGiDefense);
const inputDeltaC = view(viewDeltaC);
``` -->

<!-- ```js
display(viewReset);
```

```js
const viewReset = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewAiInitial, defaultAiInitial);
    Util.setInput(viewAiAttack, defaultAiAttack);
    Util.setInput(viewGiInitial, defaultGiInitial);
    Util.setInput(viewGiDefense, defaultGiDefense);
    Util.setInput(viewDeltaC, defaultDeltaC);
    Util.setInput(viewCInitial, defaultCInitial);
    Util.setInput(viewASupply, defaultASupply);
    Util.setInput(viewAPrice, defaultAPrice);
  }]],
);
```

```js
if (inputAiInitial === defaultAiInitial && inputAiAttack === defaultAiAttack &&
        inputGiInitial === defaultGiInitial &&
        inputGiDefense === defaultGiDefense && inputDeltaC === defaultDeltaC &&
        inputCInitial === defaultCInitial && inputASupply === defaultASupply &&
        inputAPrice === defaultAPrice) {
  viewReset.classList.add("u-hidden");
} else {
  viewReset.classList.remove("u-hidden");
}
``` -->



Initial Parameters

- kVCM supply
- K2 supply
- number of carbon classes
- tCO2eq in each carbon class

Allocation

- Timestamp
- Carbon Class Index i
- Number of kVCM (de-)allocated
- Number of K2 (de-)allocated

Swap

- Timestamp
- Carbon Class Index i
- Number of tCO2eq sold

Add Retirement

- Timestamp
- Carbon Class Index i
- Number of tCO2eq retired

Copy Event
