```js
import * as Form from "./components/form.js"
import * as Ops from "./components/ops.js"
import * as Util from "./components/util.js"
```

<h1 id="carbon-selling-strategies" class="u-center" tabindex="-1">
  <a class="observablehq-header-anchor" href="#carbon-selling-strategies">Carbon
    Selling Strategies</a>
</h1>
<div></div>

## Initial parameters

```js
const defaultASupply = 2e7;
const defaultPresentTonnes = 1e7;
const defaultDeltaTonnes = 1e2;
const defaultAi = 0.5;
const defaultGi = 0.5;

const viewASupply = Inputs.range([1e6, 1e10], {
  label: tex`\text{Circulating \textbf{A}~tokens}`,
  step: 1,
  value: defaultASupply,
  transform: Math.log,
});
const viewPresentTonnes = Inputs.range([0, 1e9], {
  label: tex`\bar C_i \text{ (present-value tonnes of class } i
    \text{ in AAM)}`,
  step: 1,
  value: defaultPresentTonnes,
  transform: Ops.piecewiseLogTransform(),
  invert: Ops.piecewiseLogInvert(),
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
  transform: Ops.piecewiseLogTransform(1e-3),
  invert: Ops.piecewiseLogInvert(1e-3),
});
const viewGi = Inputs.range([0, 1], {
  label: tex`G_i \text{ (share of \textbf{G}~stake pricing class } i \text)`,
  step: 1e-3,
  value: defaultGi,
});
const viewReset = Inputs.button(
  [["Reset", () => {
    Util.setInput(viewASupply, defaultASupply);
    Util.setInput(viewPresentTonnes, defaultPresentTonnes);
    Util.setInput(viewDeltaTonnes, defaultDeltaTonnes);
    Util.setInput(viewAi, defaultAi);
    Util.setInput(viewGi, defaultGi);
  }]],
);
```

```js
const inputASupply = view(viewASupply);
const inputPresentTonnes = view(viewPresentTonnes);
const inputDeltaTonnes = view(viewDeltaTonnes);
const inputAi = view(viewAi);
const inputGi = view(viewGi);
display(viewReset);
```

```js
if (inputASupply === defaultASupply &&
        inputPresentTonnes === defaultPresentTonnes &&
        inputDeltaTonnes === defaultDeltaTonnes && inputAi === defaultAi &&
        inputGi === defaultGi) {
  viewReset.classList.add("u-hidden");
} else {
  viewReset.classList.remove("u-hidden");
}
```

## Strategy 1: Sell Carbon in Multiple Transactions

```js
const deltaTonnes = inputDeltaTonnes / inputNTimes;

let currentAi = inputAi;
let totalAEmitted1 = 0;
let currentASupply = inputASupply;
let currentPresentTonnes = inputPresentTonnes;

for (let i = 0; i < inputNTimes; i++) {
  const currentAiAbsolute = currentAi * currentASupply;
  const deltaA = Form.computeTrueDeltaA(
    currentAi,
    inputGi,
    currentPresentTonnes,
    deltaTonnes,
  );
  const AEmitted = deltaA * inputASupply;
  totalAEmitted1 += AEmitted;
  currentASupply += AEmitted;
  currentPresentTonnes += deltaTonnes;
  if (inputIsAStaked) {
    currentAi = (currentAiAbsolute + AEmitted) / currentASupply;
  } else {
    currentAi = currentAiAbsolute / currentASupply;
  }
}

const stringNTimes = inputNTimes.toLocaleString("en-GB");

const stringIsAStaked = inputIsAStaked ? html`and staking the emitted
  <strong>A</strong>&nbsp;tokens after each transaction` : "";

const stringAEmitted1 = totalAEmitted1.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(10, Util.numDigits(totalAEmitted1)),
    maximumSignificantDigits: Math.max(10, Util.numDigits(totalAEmitted1)),
  },
);
```

Selling carbon in ${stringNTimes} transactions ${stringIsAStaked} results in a
total emission of:

<p class = "u-tabular u-center">${stringAEmitted1}&nbsp;KLIMA</p>

```js
const defaultNTimes = 1e2;

const inputIsAStaked = view(Inputs.toggle({
  label: tex`\text{Stake \textbf{A}~tokens after each transaction?}`,
  value: true,
}));

const inputNTimes = view(Inputs.range([1, 1e4], {
  label: tex`\text{Number of transactions}`,
  step: 1,
  value: defaultNTimes,
  transform: Math.log,
}));
```

## Strategy 2: Sell Carbon in a Single Transaction

```js
const deltaA2 = Form.computeTrueDeltaA(
  inputAi,
  inputGi,
  inputPresentTonnes,
  inputDeltaTonnes,
);
const totalAEmitted2 = deltaA2 * inputASupply;

const stringAEmitted2 = totalAEmitted2.toLocaleString(
  "en-GB",
  {
    minimumSignificantDigits: Math.max(10, Util.numDigits(totalAEmitted2)),
    maximumSignificantDigits: Math.max(10, Util.numDigits(totalAEmitted2)),
  },
);
```

Selling carbon in a single transaction results in a total emission of:

<p class = "u-tabular u-center">${stringAEmitted2}&nbsp;KLIMA</p>
