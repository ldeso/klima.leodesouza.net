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

```js
const inputRateLimit = view(Inputs.range([1e-4, 1e2], {
  label: "Hourly rate limit",
  step: 1e-4,
  value: 1e-1,
  transform: Math.log,
}));

const inputRateLimitK2 = view(Inputs.range([1e-4, 1e2], {
  label: "Hourly rate limit (K2)",
  step: 1e-4,
  value: 1e-1,
  transform: Math.log,
}));

const inputName = view(Inputs.select(
  ["carbon", "kvcmAlloc", "k2Alloc", "kvcmTotal", "k2Total"],
));
```

```js
const states = [{
  valuesRaw: {
    carbon: 1100,
    kvcmAlloc: 200_000,
    k2Alloc: 200_000,
    kvcmTotal: 1_000_000,
    k2Total: 1_000_000,
  },
  snapshots: {
    carbon: { value: 1100, time: -4, rate: RATE_LIMIT },
    kvcmAlloc: { value: 200_000, time: -4, rate: RATE_LIMIT },
    k2Alloc: { value: 200_000, time: -4, rate: RATE_LIMIT_K2 },
    kvcmTotal: { value: 1_000_000, time: -4, rate: RATE_LIMIT },
    k2Total: { value: 1_000_000, time: -4, rate: RATE_LIMIT_K2 },
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
for (const { valuesRaw, snapshots } of states) {
  for (const name in snapshots) {
    const { value, time } = snapshots[name];
    data.push({ type: "Snapshot", name, value, time });
  }
}
for (let time = timeMin; time < timeMax + 0.001; time += 0.01) {
  const i = d3.maxIndex(states, state => state.time > time ? NaN : state.time);
  const { valuesRaw, snapshots } = states[i];
  for (const name in valuesRaw) {
    const value = valuesRaw[name];
    data.push({ type: "Raw", name, value, time });
    data.push({
      type: "Effective",
      name,
      value: computeEffectiveValue(name, { [name]: value }, snapshots, time),
      time,
    });
  }
}
```

```js
const name = inputName;
let caption;
let y;
if (name === "carbon") {
  caption = "Evolution of the Carbon Supply";
  y = { label: "Carbon Supply (tCO2eq)", domain: [0, 1400] };
} else if (name === "kvcmAlloc") {
  caption = "Evolution of the kVCM Allocation";
  y = { label: "kVCM Allocation (kVCM)", domain: [0, 400_000] };
} else if (name === "k2Alloc") {
  caption = "Evolution of the K2 Allocation";
  y = { label: "K2 Allocation (K2)", domain: [0, 400_000] };
} else if (name === "kvcmTotal") {
  caption = "Evolution of the kVCM Supply";
  y = { label: "kVCM Supply (kVCM)", domain: [0, 1_200_000] };
} else {  // name === "k2Total"
  caption = "Evolution of the K2 Supply";
  y = { label: "K2 Supply (K2)", domain: [0, 1_200_000] };
}

display(Plot.plot({
  caption,
  color: {
    legend: true,
    range: [0, 3, 2].map(i => d3.schemeCategory10[i]),
    domain: ["Raw", "Snapshot", "Effective"],
  },
  x: { label: "Time (hour)", domain: [timeMin, timeMax] },
  y,
  marginLeft: 50,
  clip: true,
  marks: [
    Plot.frame(),
    Plot.lineY(data, {
      filter: d => d.name === name && d.type === "Raw" ? d.value : null,
      x: "time",
      y: "value",
      stroke: "type",
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
const RATE_LIMIT = inputRateLimit;
const RATE_LIMIT_K2 = inputRateLimitK2;

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
