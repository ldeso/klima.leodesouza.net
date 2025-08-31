---
title: Rate Limits
---

```js
import * as Form from "./components/form.js"
import * as Ops from "./components/ops.js"
import * as Util from "./components/util.js"
```

<h1 id="rate-limits" class="u-center" tabindex="-1">
  <a class="observablehq-header-anchor"
     href="#rate-limits">Rate Limits</a>
</h1>

_How to implement rate limits?_

## Interactive Simulation

Initial state:

```js
const defaultCInitial = 1100;
const defaultASupply = 1_000_000;
const defaultGSupply = 1_000_000;
const defaultAPrice = 0.1;
const defaultAi = 0.2;
const defaultGi = 0.2;

const viewCInitial = Inputs.range([1, 1e8], {
  label: "Carbon supply",
  step: 1,
  value: defaultCInitial,
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
const viewASupply = Inputs.range([1, 1e10], {
  label: "kVCM supply",
  step: 1,
  value: defaultASupply,
  transform: Math.log,
});
const viewGSupply = Inputs.range([1, 1e10], {
  label: "K2 supply",
  step: 1,
  value: defaultGSupply,
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
const inputAi = view(viewAi);
const inputGi = view(viewGi);
const inputASupply = view(viewASupply);
const inputGSupply = view(viewGSupply);
const inputAPrice = view(viewAPrice);
```

```js
const viewResetInitial = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewCInitial, defaultCInitial);
    Util.setInput(viewAi, defaultAi);
    Util.setInput(viewGi, defaultGi);
    Util.setInput(viewASupply, defaultASupply);
    Util.setInput(viewGSupply, defaultGSupply);
    Util.setInput(viewAPrice, defaultAPrice);
  }]],
);
```

```js
display(viewResetInitial);
```

```js
if (inputCInitial === defaultCInitial && inputAi === defaultAi &&
        inputGi === defaultGi && inputASupply === defaultASupply &&
        inputGSupply === defaultGSupply &&inputAPrice === defaultAPrice) {
  viewResetInitial.classList.add("u-hidden");
} else {
  viewResetInitial.classList.remove("u-hidden");
}
```

```js
const kvcmAllocInitial = inputAi * inputASupply;
const k2AllocInitial = inputGi * inputGSupply;
const states = [{
  valuesRaw: {
    carbon: inputCInitial,
    kvcmAlloc: kvcmAllocInitial,
    k2Alloc: k2AllocInitial,
    kvcmTotal: inputASupply,
    k2Total: inputGSupply,
  },
  snapshots: {
    carbon: { value: inputCInitial, time: -4, rate: RATE_LIMIT },
    kvcmAlloc: { value: kvcmAllocInitial, time: -4, rate: RATE_LIMIT },
    k2Alloc: { value: k2AllocInitial, time: -4, rate: RATE_LIMIT_K2 },
    kvcmTotal: { value: inputASupply, time: -4, rate: RATE_LIMIT },
    k2Total: { value: inputGSupply, time: -4, rate: RATE_LIMIT_K2 },
  },
  time: -4,
}];

states.push(executeRetire(states.at(-1), -100, 0));
states.push(executeChange(states.at(-1), "kvcmAlloc", +50_000, 8));
states.push(executeChange(states.at(-1), "kvcmAlloc", +50_000, 16));
states.push(executeRetire(states.at(-1), -100, 24));
states.push(executeSwap(states.at(-1), +150, 25));
states.push(executeChange(states.at(-1), "kvcmAlloc", 0, 48));

const timeMin = -4;
const timeMax = 32;

const data = [];
for (const { valuesRaw, snapshots, time } of states) {
  for (const name in valuesRaw) {
    const value = valuesRaw[name];
    data.push({ type: "Raw", name, value, time });
  }
  for (const name in snapshots) {
    const { value, time } = snapshots[name];
    data.push({ type: "Snapshot", name, value, time });
  }
}
for (let time = timeMin; time < timeMax + 0.001; time += 0.02) {
  const { valuesRaw, snapshots } = states.filter(d => d.time <= time).at(-1);
  const valuesEffective = computeEffectiveValues(valuesRaw, snapshots, time);
  for (const name in valuesEffective) {
    const value = valuesEffective[name];
    data.push({ type: "Effective", name, value, time });
  }
  const carbonDelta = 1e-10;
  const kvcmDeltaSwap = computePriceSwap(valuesEffective, carbonDelta);
  data.push({
    type: "Hypothetical Swap Price",
    name: "price",
    value: inputAPrice * kvcmDeltaSwap / carbonDelta,
    time,
  });
  const valuesRetirement = { ...valuesEffective, carbon: valuesRaw.carbon };
  const kvcmDeltaRetirement = computePriceRetire(valuesRetirement, carbonDelta);
  data.push({
    type: "Hypothetical Retirement Price",
    name: "price",
    value: inputAPrice * kvcmDeltaRetirement / carbonDelta,
    time,
  });
}
```

```js
Plot.plot({
  caption: "Evolution of the Price",
  color: {
    legend: true,
    range: [0, 3, 2].map(i => d3.schemeCategory10[i]),
    domain: ["Hypothetical Swap Price", "Hypothetical Retirement Price"],
  },
  x: { label: "Time (hour)", domain: [timeMin, timeMax] },
  y: {
    label: "Price (USD)",
    domain: [0, d3.max(data, d => d.name === "price" ? d.value : NaN)],
  },
  insetTop: 16,
  marginLeft: 50,
  clip: true,
  marks: [
    Plot.frame(),
    Plot.lineY(data, {
      x: "time",
      y: d => d.name === "price" ? d.value : null,
      stroke: "type",
    }),
  ],
})
```

```js
const defaultRateLimit = 0.0417;  // 1/24
const defaultRateLimitK2 = 1;
const defaultName = "carbon";

const viewRateLimit = Inputs.range([1e-4, 1e2], {
  label: "Hourly rate limit",
  step: 1e-4,
  value: defaultRateLimit,
  transform: Math.log,
});
const viewRateLimitK2 = Inputs.range([1e-4, 1e2], {
  label: "Hourly rate limit (K2)",
  step: 1e-4,
  value: defaultRateLimitK2,
  transform: Math.log,
});
const viewName = Inputs.select(
  ["carbon", "kvcmAlloc", "k2Alloc", "kvcmTotal", "k2Total"],
);
```

```js
const hourlyRateLimit = view(viewRateLimit);
const hourlyRateLimitK2 = view(viewRateLimitK2);
const inputName = view(viewName);
```

```js
const viewResetGeneral = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewRateLimit, defaultRateLimit);
    Util.setInput(viewRateLimitK2, defaultRateLimitK2);
  }]],
);
```

```js
display(viewResetGeneral);
```

```js
if (hourlyRateLimit === defaultRateLimit &&
        hourlyRateLimitK2 === defaultRateLimitK2) {
  viewResetGeneral.classList.add("u-hidden");
} else {
  viewResetGeneral.classList.remove("u-hidden");
}
```

```js
const name = inputName;
let caption;
let yLabel;
if (name === "carbon") {
  caption = "Evolution of the Carbon Supply";
  yLabel = "Carbon Supply (tCO2eq)";
} else if (name === "kvcmAlloc") {
  caption = "Evolution of the kVCM Allocation";
  yLabel = "kVCM Allocation (kVCM)";
} else if (name === "k2Alloc") {
  caption = "Evolution of the K2 Allocation";
  yLabel = "K2 Allocation (K2)";
} else if (name === "kvcmTotal") {
  caption = "Evolution of the kVCM Supply";
  yLabel = "kVCM Supply (kVCM)";
} else {  // name === "k2Total"
  caption = "Evolution of the K2 Supply";
  yLabel = "K2 Supply (K2)";
}

display(Plot.plot({
  caption,
  color: {
    legend: true,
    range: [0, 3, 2].map(i => d3.schemeCategory10[i]),
    domain: ["Raw", "Snapshot", "Effective"],
  },
  x: { label: "Time (hour)", domain: [timeMin, timeMax] },
  y: {
    label: yLabel,
    domain: [0, d3.max(data, d => d.name === name ? d.value : NaN)],
  },
  insetTop: 16,
  marginLeft: 50,
  clip: true,
  marks: [
    Plot.frame(),
    Plot.lineY(data, {
      filter: d => d.name === name && d.type === "Raw" ? d.value : null,
      x: "time",
      y: "value",
      stroke: "type",
      curve: "step-after",
    }),
    Plot.lineY(data, {
      filter: d => d.name === name && d.type === "Effective" ? d.value : null,
      x: "time",
      y: "value",
      stroke: "type",
      size: 1,
      strokeDasharray: 4,
    }),
    Plot.dotY(data, {
      filter: d => d.name === name && d.type === "Snapshot" ? d.value : null,
      x: "time",
      y: "value",
      fill: "type",
    }),
  ],
}));
```

## Implementation

```js echo
const RATE_LIMIT = hourlyRateLimit;
const RATE_LIMIT_K2 = hourlyRateLimitK2;

const state = {
  valuesRaw: {
    carbon:        1_100, // tCO2eq
    kvcmAlloc:   200_000, // kVCM
    k2Alloc:     200_000, // K2
    kvcmTotal: 1_000_000, // kVCM
    k2Total:   1_000_000, // K2
  },
  snapshots: {
    carbon:    { value:     1_100, time: 0, rate: RATE_LIMIT },
    kvcmAlloc: { value:   200_000, time: 0, rate: RATE_LIMIT },
    k2Alloc:   { value:   200_000, time: 0, rate: RATE_LIMIT_K2 },
    kvcmTotal: { value: 1_000_000, time: 0, rate: RATE_LIMIT },
    k2Total:   { value: 1_000_000, time: 0, rate: RATE_LIMIT_K2 },
  },
  time: 0,                // hours
};
const carbonDelta = +100; // tCO2eq
const time = 24;          // hours

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

function executeChange(state, name, delta, time) {
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

function computeEffectiveValues(valuesRaw, snapshots, time) {
  const valuesEffective = {};
  for (const name in valuesRaw) {
    valuesEffective[name] = computeEffectiveValue(
      name,
      valuesRaw,
      snapshots,
      time,
    );
  }
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

function maybeUpdatedSnapshot(snapshot, valueEffective, valueRaw, time) {
  if (valueEffective === valueRaw) {
    return { value: valueRaw, time: time, rate: snapshot.rate };
  }
  return snapshot;
}
```

```js
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
