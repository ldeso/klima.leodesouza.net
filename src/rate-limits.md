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
const timeMin = -4;
const timeMax = 32;

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

Edit state changes:

```js
const defaultChange = "Carbon Swap/Retirement";
const defaultDelta = 100;
const defaultTime = 0;
const defaultChanges = [
  { change: "Carbon Swap/Retirement", delta: -100, time: 0 },
  { change: "kVCM Allocation", delta: 50_000, time: 8 },
  { change: "kVCM Allocation", delta: 50_000, time: 16 },
  { change: "Carbon Swap/Retirement", delta: -100, time: 24 },
  { change: "Carbon Swap/Retirement", delta: 150, time: 25 },
];
const defaultId = 0;

const changeMutable = Mutable("Carbon Swap/Retirement");
const deltaMutable = Mutable(defaultDelta);
const timeMutable = Mutable(defaultTime);
const idMutable = Mutable(defaultId);
const changesMutable = Mutable(defaultChanges);

const setChange = change => changeMutable.value = change;
const setDelta = delta => deltaMutable.value = delta;
const setTime = time => timeMutable.value = time;
const setId = i => idMutable.value = i - 1;
const addChange = () => {
  const changesNewUnsorted = changesMutable.value.toSpliced(
    idMutable.value,
    0,
    {
      change: changeMutable.value,
      delta: deltaMutable.value,
      time: timeMutable.value,
    },
  );
  changesMutable.value = d3.sort(changesNewUnsorted, d => d.time);
};
const resetChange = () => changesMutable.value = [];
const deleteChange = () =>
  changesMutable.value = changesMutable.value.toSpliced(idMutable.value, 1);

const viewChange = Inputs.select([
  "Carbon Swap/Retirement",
  "kVCM Allocation",
  "K2 Allocation",
  "kVCM Supply",
  "K2 Supply",
]);
const viewDelta = Inputs.range([-1e8, 1e8], {
  label: "Delta",
  step: 1,
  value: defaultDelta,
  transform: Ops.piecewiseSymLogTransform(),
  invert: y => Math.round(Ops.piecewiseSymLogInvert()(y)),
});
const viewTime = Inputs.range([timeMin, timeMax], {
  label: "Time",
  step: 0.1,
  value: defaultTime,
});
const viewId = Inputs.number([1, null], { label: "#", value: defaultId + 1 });

const changeObs = Generators.observe(change => {
  const inputted = () => setChange(change(viewChange.value));
  viewChange.addEventListener("click", inputted);
  change(viewChange.value);
  return () => viewChange.removeEventListener("input", inputted);
});
const deltaObs = Generators.observe(change => {
  const inputted = () => setDelta(change(viewDelta.value));
  viewDelta.addEventListener("input", inputted);
  change(viewDelta.value);
  return () => viewDelta.removeEventListener("input", inputted);
});
const timeObs = Generators.observe(change => {
  const inputted = () => setTime(change(viewTime.value));
  viewTime.addEventListener("input", inputted);
  change(viewTime.value);
  return () => viewTime.removeEventListener("input", inputted);
});
const idObs = Generators.observe(change => {
  const inputted = () => setId(change(viewId.value));
  viewId.addEventListener("input", inputted);
  change(viewId.value);
  return () => viewId.removeEventListener("input", inputted);
});
```

```js
const viewAdd = Inputs.button(
  [["Add", addChange], ["Delete", deleteChange], ["Delete All", resetChange]],
);
display(viewChange);
display(viewId);
display(viewTime);
display(viewDelta);
```

```js
display(viewAdd);
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

Current state changes:

```js
html`<table>
  <thead><tr>
    <th>#</th>
    <th>Time</th>
    <th>State Change</th>
    <th>Delta</th>
    <th>Price</th>
  </tr></thead>
  <tbody>${changesMutable.map(({ change, delta, time }, i) => {
    const idString = (i + 1).toLocaleString("en-GB");
    const timeString = time.toLocaleString("en-GB");

    let deltaString;
    if (delta > 0) {
      deltaString = "+";
    } else if (delta < 0) {
      deltaString = "−";
    } else {
      deltaString = "";
    }
    deltaString += Math.abs(delta).toLocaleString("en-GB");

    let changeString;
    let priceString = "";
    if (change === "Carbon Swap/Retirement" && delta > 0) {
      changeString = "Carbon Swap";
      const carbonBefore = states[i].valuesRaw.carbon;
      const carbonAfter = states[i + 1].valuesRaw.carbon;
      const carbonDelta = carbonAfter - carbonBefore;
      const kvcmBefore = states[i].valuesRaw.kvcmTotal;
      const kvcmAfter = states[i + 1].valuesRaw.kvcmTotal;
      const kvcmDelta = kvcmAfter - kvcmBefore;
      const price = kvcmDelta / carbonDelta * inputAPrice;
      priceString = "$" + price.toLocaleString("en-GB");
    } else if (change === "Carbon Swap/Retirement" && delta < 0) {
      changeString = "Carbon Retirement";
      const carbonBefore = states[i].valuesRaw.carbon;
      const carbonAfter = states[i + 1].valuesRaw.carbon;
      const carbonDelta = carbonAfter - carbonBefore;
      const kvcmBefore = states[i].valuesRaw.kvcmTotal;
      const kvcmAfter = states[i + 1].valuesRaw.kvcmTotal;
      const kvcmDelta = kvcmAfter - kvcmBefore;
      const price = kvcmDelta / carbonDelta * inputAPrice;
      priceString = "$" + price.toLocaleString("en-GB");
    } else if (change === "kVCM Allocation" && delta < 0) {
      changeString = "kVCM Deallocation";
    } else if (change === "K2 Allocation" && delta < 0) {
      changeString = "K2 Deallocation";
    } else {
      changeString = change;
    }

    return html`<tr>
      <td>${idString}</td>
      <td>${timeString}</td>
      <td>${changeString}</td>
      <td>${deltaString}</td>
      <td>${priceString}</td>
    </tr>`
  })}</tbody>
</table>`
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

for (const { change, delta, time } of changesMutable) {
  if (change === "Carbon Swap") {
    states.push(executeSwap(states.at(-1), delta, time));
  } else if (change === "Carbon Swap/Retirement") {
    if (delta > 0) {
      states.push(executeSwap(states.at(-1), delta, time));
    } else {
      states.push(executeRetire(states.at(-1), delta, time));
    }
  } else if (change === "kVCM Allocation") {
    states.push(executeChange(states.at(-1), "kvcmAlloc", delta, time));
  } else if (change === "K2 Allocation") {
    states.push(executeChange(states.at(-1), "k2Alloc", delta, time));
  } else if (change === "kVCM Supply") {
    states.push(executeChange(states.at(-1), "kvcmTotal", delta, time));
  } else { // change === "K2 Supply"
    states.push(executeChange(states.at(-1), "k2Total", delta, time));
  }
}

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
for (const name in states.at(-1).valuesRaw) {
  const value = states.at(-1).valuesRaw[name];
  data.push({ type: "Raw", name, value, time: timeMax });
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
  const kvcmDeltaRetirement = computePriceRetire(valuesRaw, carbonDelta);
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
  grid: true,
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
  grid: true,
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
  const kvcmDelta = computePriceRetire(valuesRaw, carbonDelta);
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
  // Can use fast and inaccurate exp implementation here to reduce cost
  const valueLimit = snapshot.value / Math.exp(-snapshot.rate * timeDelta);
  const valueEffective = Math.min(valueRaw, valueLimit);
  return valueEffective;
}

function rateLimitedInv(valueRaw, snapshot, time) {
  const timeDelta = time - snapshot.time;
  // Can use fast and inaccurate exp implementation here to reduce cost
  const valueLimit = snapshot.value * Math.exp(-snapshot.rate * timeDelta);
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

function computePriceRetire(valuesRaw, carbonDelta) {
  const { carbon, kvcmAlloc, k2Alloc, kvcmTotal, k2Total } = valuesRaw;
  const Ai = kvcmAlloc / kvcmTotal;
  const Gi = k2Alloc / k2Total;
  const deltaCi = carbonDelta / carbon;
  const deltaA = -Form.computeDeltaARetirement(Ai, Gi, deltaCi);
  const kvcmDelta = deltaA * kvcmTotal;
  return kvcmDelta;
}
```
