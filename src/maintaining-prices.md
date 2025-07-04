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

## Interactive Simulation

```js
const defaultDollarPriceRemoval = 1.0;
const defaultDollarPriceNatureBased = 10.0;
const defaultDollarPriceAvoidance = 100.0;
const defaultBarCRemoval = 1049.765;
const defaultBarCNatureBased = 1107984.42;
const defaultBarCAvoidance = 13556768.1;
const defaultARemoval = 7e-5;
const defaultANatureBased = 0.076;
const defaultAAvoidance = 0.924;
const defaultGRemoval = 0.333;
const defaultGNatureBased = 0.333;
const defaultGAvoidance = 0.333;
const defaultASupply = 2e7;

const viewDollarPrice = Inputs.range([0, 1e9], {
  label: tex`\text{Desired USD price}`,
  step: 1e-3,
  value: defaultDollarPriceRemoval,
  transform: Ops.piecewiseLogTransform(),
  invert: Ops.piecewiseLogInvert(),
});
const viewBarC = Inputs.range([0, 1e9], {
  label: tex`\bar C_i \text{ (present-value tonnes in portfolio)}`,
  step: 1e-3,
  value: defaultBarCRemoval,
  transform: Ops.piecewiseLogTransform(),
  invert: Ops.piecewiseLogInvert(),
});
const viewA = Inputs.range([0, 1], {
  label: tex`A_i^\text{max} \text{ (max allocated kVCM)}`,
  step: 1e-5,
  value: defaultARemoval,
});
const viewG = Inputs.range([0, 1], {
  label: tex`G_i \text{ (allocated K2)}`,
  step: 1e-3,
  value: defaultGRemoval,
});
const viewASupply = Inputs.range([1e6, 1e10], {
  label: tex`\text{Circulating \textbf{A}~tokens}`,
  step: 1,
  value: defaultASupply,
  transform: Math.log,
});

const viewSetRemoval = Inputs.button(
  [["Removal", () => {
    Util.setInput(viewDollarPrice, defaultDollarPriceRemoval);
    Util.setInput(viewBarC, defaultBarCRemoval);
    Util.setInput(viewA, defaultARemoval);
    Util.setInput(viewG, defaultGRemoval);
  }]],
);

const viewSetNatureBased = Inputs.button(
  [["Nature Based", () => {
    Util.setInput(viewDollarPrice, defaultDollarPriceNatureBased);
    Util.setInput(viewBarC, defaultBarCNatureBased);
    Util.setInput(viewA, defaultANatureBased);
    Util.setInput(viewG, defaultGNatureBased);
  }]],
);

const viewSetAvoidance = Inputs.button(
  [["Avoidance", () => {
    Util.setInput(viewDollarPrice, defaultDollarPriceAvoidance);
    Util.setInput(viewBarC, defaultBarCAvoidance);
    Util.setInput(viewA, defaultAAvoidance);
    Util.setInput(viewG, defaultGAvoidance);
  }]],
);
```

### Inputs

#### Input Parameters

```js
display(viewDollarPrice);
display(viewSetRemoval);
display(viewSetNatureBased);
display(viewSetAvoidance);
```

```js
const inputPrice = view(viewDollarPrice);
const inputBarC = view(viewBarC);
const inputA = view(viewA);
const inputG = view(viewG);

const inputASupply = view(viewASupply);
```

#### Results

1. Current USD price

2. Share kVCM that must be allocated to maintain price

3. "The protocol can maintain the desired price for transactions up to
___ tCO2eq by allocating __% more kVCM."
