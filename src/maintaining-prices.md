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
const defaultBarC1 = 1049.765;
const defaultBarC2 = 1107984.42;
const defaultBarC3 = 13556768.1;
const defaultA1 = 7e-5;
const defaultA2 = 0.076;
const defaultA3 = 0.924;
const defaultG1 = 0.333;
const defaultG2 = 0.333;
const defaultG3 = 0.333;

const viewBarC1 = Inputs.range([0, 1e9], {
  label: tex`\bar C_\text{rem} \text{ (present-value tonnes)}`,
  step: 1e-3,
  value: defaultBarC1,
  transform: Ops.piecewiseLogTransform(),
  invert: Ops.piecewiseLogInvert(),
});
const viewA1 = Inputs.range([0, 1], {
  label: tex`A_\text{rem} \text{ (relative share)}`,
  step: 1e-5,
  value: defaultA1,
});
const viewG1 = Inputs.range([0, 1], {
  label: tex`G_\text{rem} \text{ (relative share)}`,
  step: 1e-3,
  value: defaultG1,
});

const viewBarC2 = Inputs.range([0, 1e9], {
  label: tex`\bar C_\text{NBS} \text{ (present-value tonnes)}`,
  step: 1e-3,
  value: defaultBarC2,
  transform: Ops.piecewiseLogTransform(),
  invert: Ops.piecewiseLogInvert(),
});
const viewA2 = Inputs.range([0, 1], {
  label: tex`A_\text{NBS} \text{ (relative share)}`,
  step: 1e-5,
  value: defaultA2,
});
const viewG2 = Inputs.range([0, 1], {
  label: tex`G_\text{NBS} \text{ (relative share)}`,
  step: 1e-3,
  value: defaultG2,
});

const viewBarC3 = Inputs.range([0, 1e9], {
  label: tex`\bar C_\text{avoid} \text{ (present-value tonnes)}`,
  step: 1e-3,
  value: defaultBarC3,
  transform: Ops.piecewiseLogTransform(),
  invert: Ops.piecewiseLogInvert(),
});
const viewA3 = Inputs.range([0, 1], {
  label: tex`A_\text{avoid} \text{ (relative share)}`,
  step: 1e-5,
  value: defaultA3,
});
const viewG3 = Inputs.range([0, 1], {
  label: tex`G_\text{avoid} \text{ (relative share)}`,
  step: 1e-3,
  value: defaultG3,
});

const viewReset1 = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewBarC1, defaultBarC1);
    Util.setInput(viewA1, defaultA1);
    Util.setInput(viewG1, defaultG1);
    Util.setInput(viewBarC2, defaultBarC2);
    Util.setInput(viewA2, defaultA2);
    Util.setInput(viewG2, defaultG2);
    Util.setInput(viewBarC3, defaultBarC3);
    Util.setInput(viewA3, defaultA3);
    Util.setInput(viewG3, defaultG3);
  }]],
);
```

```js
const inputBarC1 = view(viewBarC1);
const inputA1 = view(viewA1);
const inputG1 = view(viewG1);
```

```js
const inputBarC2 = view(viewBarC2);
const inputA2 = view(viewA2);
const inputG2 = view(viewG2);
```

```js
const inputBarC3 = view(viewBarC3);
const inputA3 = view(viewA3);
const inputG3 = view(viewG3);
```

```js
display(viewReset1);
```

```js
if (inputBarC1 === defaultBarC1 && inputA1 === defaultA1 &&
        inputG1 === defaultG1 && inputBarC2 === defaultBarC2 &&
        inputA2 === defaultA2 && inputG2 === defaultG2 &&
        inputBarC3 === defaultBarC3 && inputA3 === defaultA3 &&
        inputG3 === defaultG3) {
  viewReset1.classList.add("u-hidden");
} else {
  viewReset1.classList.remove("u-hidden");
}
```

<hr>

```js
const defaultASupply = 2e7;
const defaultDeltaTonnes = 1e2;
const defaultAi = 0.5;
const defaultGi = 0.5;

const viewASupply = Inputs.range([1e6, 1e10], {
  label: tex`\text{Circulating \textbf{A}~tokens}`,
  step: 1,
  value: defaultASupply,
  transform: Math.log,
});
const viewDeltaTonnes = Inputs.range([1e-1, 1e7], {
  label: tex`\text{Present-value tonnes bought by AAM}`,
  step: 1e-1,
  value: defaultDeltaTonnes,
  transform: Math.log,
});
const viewAi = Inputs.range([0, 1], {
  label: tex`A_i \text{ (share of \textbf{A}~stake pricing class } i \text)`,
  step: 1e-3,
  value: defaultAi,
});
const viewGi = Inputs.range([0, 1], {
  label: tex`G_i \text{ (share of \textbf{G}~stake pricing class } i \text)`,
  step: 1e-3,
  value: defaultGi,
});
const viewReset = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewASupply, defaultASupply);
    Util.setInput(viewDeltaTonnes, defaultDeltaTonnes);
    Util.setInput(viewAi, defaultAi);
    Util.setInput(viewGi, defaultGi);
  }]],
);
```

```js
const inputASupply = view(viewASupply);
const inputDeltaTonnes = view(viewDeltaTonnes);
const inputAi = view(viewAi);
const inputGi = view(viewGi);
display(viewReset);
```

```js
if (inputASupply === defaultASupply &&
        inputDeltaTonnes === defaultDeltaTonnes && inputAi === defaultAi &&
        inputGi === defaultGi) {
  viewReset.classList.add("u-hidden");
} else {
  viewReset.classList.remove("u-hidden");
}
```
