---
title: Interactive Model
---

```js
import * as Form from "./components/form.js"
import * as Ops from "./components/ops.js"
import * as Util from "./components/util.js"
```

<h1 id="interactive-model" class="u-center" tabindex="-1">
  <a class="observablehq-header-anchor" href="#interactive-model">Interactive
    Model</a>
</h1>
<div></div>

## Carbon Sale

|                   | Circulating **A**&nbsp;tokens | Present-value tonnes of class&nbsp;${tex`i`} in AAM |
| ----------------- | -----------------------------:| ---------------------------------------------------:|
| **Total**         | ${stringASupply}              | ${stringPresentTonnes}                              |
| **Variation**     | ${stringAEmitted}             | ${stringDeltaTonnes}                                |
| **Unit price**    | ${stringAPrice}               | ${stringBarCiPrice}                                 |

```js
const defaultAValue = 2e6;
const defaultASupply = 2e7;
const defaultPresentTonnes = 1e7;
const defaultDeltaTonnes = 1e2;
const defaultAi = 0.5;
const defaultGi = 0.5;

const viewAValue = Inputs.range([1e5, 1e9], {
  label: tex`\text{\textbf{A}~token USD market capitalization}`,
  step: 1,
  value: defaultAValue,
  transform: Math.log,
});
const viewASupply = Inputs.range([1e6, 1e10], {
  label: tex`\text{Circulating \textbf{A}~tokens}`,
  step: 1,
  value: defaultASupply,
  transform: Math.log,
});
const viewPresentTonnes = Inputs.range([0, 1e9], {
  label: tex`\bar C_i \text{ (present-value tonnes of class } i
    \text{ in AAM)}`,
  step: 1e-3,
  value: defaultPresentTonnes,
  transform: Ops.piecewiseLogTransform(1e-3),
  invert: Ops.piecewiseLogInvert(1e-3),
});
const viewDeltaTonnes = Inputs.range([1e-3, 1e7], {
  label: tex`\text{Present-value tonnes bought by AAM}`,
  step: 1e-3,
  value: defaultDeltaTonnes,
  transform: Math.log,
});
const viewAi = Inputs.range([0, 1], {
  label: tex`A_i \text{ (share of \textbf{A}~stake pricing class } i \text)`,
  step: 1e-6,
  value: defaultAi,
  transform: Ops.piecewiseLogTransform(1e-6),
  invert: Ops.piecewiseLogInvert(1e-6),
});
const viewGi = Inputs.range([0, 1], {
  label: tex`G_i \text{ (share of \textbf{G}~stake pricing class } i \text)`,
  step: 1e-6,
  value: defaultGi,
});
const viewZeroCarbon = Inputs.button(
  [["Zero Carbon Scenario", () => Util.setInput(viewPresentTonnes, 0)]],
);
const viewReset = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewAValue, defaultAValue);
    Util.setInput(viewASupply, defaultASupply);
    Util.setInput(viewPresentTonnes, defaultPresentTonnes);
    Util.setInput(viewDeltaTonnes, defaultDeltaTonnes);
    Util.setInput(viewAi, defaultAi);
    Util.setInput(viewGi, defaultGi);
  }]],
);
```

```js
const inputReset = view(viewReset);
const inputAValue = view(viewAValue);
const inputASupply = view(viewASupply);
const inputPresentTonnes = view(viewPresentTonnes);
const inputDeltaTonnes = view(viewDeltaTonnes);
const inputAi = view(viewAi);
const inputGi = view(viewGi);
display(viewZeroCarbon);
```

```js
if (inputAValue === defaultAValue && inputASupply === defaultASupply &&
        inputPresentTonnes === defaultPresentTonnes &&
        inputDeltaTonnes === defaultDeltaTonnes && inputAi === defaultAi &&
        inputGi === defaultGi) {
  viewReset.classList.add("u-hidden");
} else {
  viewReset.classList.remove("u-hidden");
}
if (inputPresentTonnes === 0) {
  viewZeroCarbon.classList.add("u-hidden");
} else {
  viewZeroCarbon.classList.remove("u-hidden");
}
```

```js
const paramDeltaA = Form.computeTrueDeltaA(
  inputAi,
  inputGi,
  inputPresentTonnes,
  inputDeltaTonnes,
);
const paramDeltaTonnes = paramDeltaA === 0 ? 0 : inputDeltaTonnes;
const paramAEmitted = paramDeltaA * inputASupply;
const paramAPrice = inputAValue / inputASupply;
const paramBarCiPrice = inputAValue * paramDeltaA / inputDeltaTonnes;

const stringASupply = inputASupply.toLocaleString(
  "en-GB",
  {
    minimumFractionDigits: Math.max(0, 2 - Util.numDigits(paramAEmitted)),
    maximumFractionDigits: Math.max(0, 2 - Util.numDigits(paramAEmitted)),
  },
) + " KLIMA";
const stringPresentTonnes = inputPresentTonnes.toLocaleString(
  "en-GB",
  {
    minimumFractionDigits: Math.max(0, 5 - Util.numDigits(paramDeltaTonnes)),
    maximumFractionDigits: Math.max(0, 5 - Util.numDigits(paramDeltaTonnes)),
  },
) + " tCO2eq";
const stringAEmitted = "+" + paramAEmitted.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(2, Util.numDigits(paramAEmitted)),
    maximumSignificantDigits: Math.max(2, Util.numDigits(paramAEmitted)),
  },
) + " KLIMA";
const stringDeltaTonnes = "+" + paramDeltaTonnes.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(5, Util.numDigits(paramDeltaTonnes)),
    maximumSignificantDigits: Math.max(5, Util.numDigits(paramDeltaTonnes)),
  },
) + " tCO2eq";
const stringAPrice = "$" + paramAPrice.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(2, 2 + Util.numDigits(paramAPrice)),
    maximumSignificantDigits: Math.max(2, 2 + Util.numDigits(paramAPrice)),
  },
);
const stringBarCiPrice = "$" + paramBarCiPrice.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(2, 2 + Util.numDigits(paramBarCiPrice)),
    maximumSignificantDigits: Math.max(2, 2 + Util.numDigits(paramBarCiPrice)),
  },
);
```

## Carbon Retirement

|                   | Circulating **A**&nbsp;tokens | Liquid tonnes of class&nbsp;${tex`i`} in AAM |
| ----------------- | -----------------------------:| --------------------------------------------:|
| **Total**         | ${stringASupply_}             | ${stringLiquidTonnes}                        |
| **Variation**     | ${stringABurnt}               | ${stringDeltaCiTonnes}                       |
| **Unit price**    | ${stringAPrice_}              | ${stringCiPrice}                             |

```js
const defaultLiquidTonnes = 1e7;
const defaultABurnt = 1e2;
const defaultGnull = 0.5;
const defaultA = 0.5;
const defaultS = 0.5;

const viewAValue_ = Inputs.range([1e5, 1e9], {
  label: tex`\text{\textbf{A}~token USD market capitalization}`,
  step: 1,
  value: defaultAValue,
  transform: Math.log,
});
const viewASupply_ = Inputs.range([1e6, 1e10], {
  label: tex`\text{Circulating \textbf{A}~tokens}`,
  step: 1,
  value: defaultASupply,
  transform: Math.log,
});
const viewLiquidTonnes = Inputs.range([1e-3, 1e9], {
  label: tex`\text{Liquid tonnes of class } i \text{ in AAM}`,
  step: 1e-3,
  value: defaultLiquidTonnes,
  transform: Math.log,
});
const viewABurnt = Inputs.range([1e-1, 1e6], {
  label: tex`\text{\textbf{A}~tokens burnt by AAM}`,
  step: 1e-1,
  value: defaultABurnt,
  transform: Math.log,
});
const viewAi_ = Inputs.range([0, 1], {
  label: tex`A_i \text{ (share of \textbf{A}~stake pricing class } i \text)`,
  step: 1e-6,
  value: defaultAi,
  transform: Ops.piecewiseLogTransform(1e-6),
  invert: Ops.piecewiseLogInvert(1e-6),
});
const viewGi_ = Inputs.range([0, 1], {
  label: tex`G_i \text{ (share of \textbf{G}~stake pricing class } i \text)`,
  step: 1e-6,
  value: defaultGi,
});
const viewUnweighed = Inputs.button(
  [["Unweighed Carbon Class", () => Util.setInput(viewAi, 0)]],
);
const viewReset_ = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewAValue_, defaultAValue);
    Util.setInput(viewASupply_, defaultASupply);
    Util.setInput(viewLiquidTonnes, defaultLiquidTonnes);
    Util.setInput(viewABurnt, defaultABurnt);
    Util.setInput(viewAi, defaultAi);
    Util.setInput(viewGi, defaultGi);
  }]],
);
```

```js
const inputReset = view(viewReset_);
const inputAValue_ = view(viewAValue_);
const inputASupply_ = view(viewASupply_);
const inputLiquidTonnes = view(viewLiquidTonnes);
const inputABurnt = view(viewABurnt);
display(Inputs.bind(viewAi_, viewAi));
display(Inputs.bind(viewGi_, viewGi));
```

```js
if (inputAValue_ === defaultAValue && inputASupply_ === defaultASupply &&
        inputLiquidTonnes === defaultLiquidTonnes &&
        inputABurnt === defaultABurnt && inputAi === defaultAi &&
        inputGi === defaultGi) {
  viewReset_.classList.add("u-hidden");
} else {
  viewReset_.classList.remove("u-hidden");
}
```

```js
const paramABurnt = inputAi === 0 ? 0 : inputABurnt
const paramDeltaA_ = paramABurnt / inputASupply_;
const paramDeltaCi = inputAi === 0 ? -0 : Form.computeDeltaCi(
  inputAi,
  inputGi,
  paramDeltaA_,
);
const paramDeltaCiTonnes = -paramDeltaCi * inputLiquidTonnes;
const paramAPrice_ = inputAValue_ / inputASupply_;
const paramCiPrice = inputAi === 0 ? 0 : inputAValue_ * paramDeltaA_ / paramDeltaCiTonnes;

const stringASupply_ = inputASupply_.toLocaleString(
  "en-GB",
  {
    minimumFractionDigits: Math.max(0, 2 - Util.numDigits(paramABurnt)),
    maximumFractionDigits: Math.max(0, 2 - Util.numDigits(paramABurnt)),
  },
) + " KLIMA";
const stringLiquidTonnes = inputLiquidTonnes.toLocaleString(
  "en-GB",
  {
    minimumFractionDigits: Math.max(0, 5 - Util.numDigits(paramDeltaCiTonnes)),
    maximumFractionDigits: Math.max(0, 5 - Util.numDigits(paramDeltaCiTonnes)),
  },
) + " tCO2eq";
const stringABurnt = "−" + paramABurnt.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(2, Util.numDigits(paramABurnt)),
    maximumSignificantDigits: Math.max(2, Util.numDigits(paramABurnt)),
  },
) + " KLIMA";
const stringDeltaCiTonnes = "−" + paramDeltaCiTonnes.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(5, Util.numDigits(paramDeltaCiTonnes)),
    maximumSignificantDigits: Math.max(5, Util.numDigits(paramDeltaCiTonnes)),
  },
) + " tCO2eq";
const stringAPrice_ = "$" + paramAPrice_.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(2, 2 + Util.numDigits(paramAPrice_)),
    maximumSignificantDigits: Math.max(2, 2 + Util.numDigits(paramAPrice_)),
  },
);
const stringCiPrice = "$" + paramCiPrice.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(2, 2 + Util.numDigits(paramCiPrice)),
    maximumSignificantDigits: Math.max(2, 2 + Util.numDigits(paramCiPrice)),
  },
);
```
