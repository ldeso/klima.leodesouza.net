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

## Case Study

### Initial parameters

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

### Strategy 1: Sell Carbon in Multiple Transactions

```js
function computeMultiDeltaA(
  Ai,
  Gi,
  barCiTonnes,
  deltaBarCiTonnes,
  ASupply,
  NTimes,
  isAStaked,
) {
  const deltaTonnes = deltaBarCiTonnes / NTimes;

  let currentAi = Ai;
  let totalAEmitted = 0;
  let currentASupply = ASupply;
  let currentPresentTonnes = barCiTonnes;

  for (let i = 0; i < NTimes; i++) {
    const currentAiAbsolute = currentAi * currentASupply;
    const deltaA = Form.computeTrueDeltaA(
      currentAi,
      Gi,
      currentPresentTonnes,
      deltaTonnes,
    );
    const AEmitted = deltaA * ASupply;
    totalAEmitted += AEmitted;
    currentASupply += AEmitted;
    currentPresentTonnes += deltaTonnes;
    if (isAStaked) {
      currentAi = (currentAiAbsolute + AEmitted) / currentASupply;
    } else {
      currentAi = currentAiAbsolute / currentASupply;
    }
  }

  return totalAEmitted / ASupply;
}
```

```js
const totalAEmitted1 = inputASupply * computeMultiDeltaA(
  inputAi,
  inputGi,
  inputPresentTonnes,
  inputDeltaTonnes,
  inputASupply,
  inputNTimes,
  inputIsAStaked,
);

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
const defaultNTimes = 10;

const inputIsAStaked = view(Inputs.toggle({
  label: tex`\text{Stake \textbf{A}~tokens after each transaction?}`,
  value: true,
}));

const inputNTimes = view(Inputs.range([1, 100], {
  label: tex`\text{Number of transactions}`,
  step: 1,
  value: defaultNTimes,
  transform: Math.log,
}));
```

### Strategy 2: Sell Carbon in a Single Transaction

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

## Analysis

```js
const data = [];
for (let paramDeltaBarCi = 0; paramDeltaBarCi < 2.01; paramDeltaBarCi += 0.2) {
  data.push({
    key: "Strategy 1: Multiple Transactions",
    ai: 0,
    ci: paramDeltaBarCi,
    value: NaN,
  });
  data.push({
    key: "Strategy 2: Single Transaction",
    ai: 0,
    ci: paramDeltaBarCi,
    value: NaN,
  });
  for (let paramAi = 0.1; paramAi < 1.01; paramAi += 0.1) {
    data.push({
      key: "Strategy 1: Multiple Transactions",
      ai: paramAi,
      ci: paramDeltaBarCi,
      value: computeMultiDeltaA(
        paramAi,
        inputGi_,
        inputPresentTonnes,
        paramDeltaBarCi * inputPresentTonnes,
        inputASupply,
        inputNTimes_,
        inputIsAStaked_,
      ),
    });
    data.push({
      key: "Strategy 2: Single Transaction",
      ai: paramAi,
      ci: paramDeltaBarCi,
      value: Form.computeTrueDeltaA(
        paramAi,
        inputGi_,
        inputPresentTonnes,
        paramDeltaBarCi * inputPresentTonnes,
      ),
    });
  }
}

const deltaAMax = Math.max(
  computeMultiDeltaA(
    1,
    inputGi_,
    inputPresentTonnes,
    2 * inputPresentTonnes,
    inputASupply,
    inputNTimes_,
    inputIsAStaked_,
  ),
  Form.computeTrueDeltaA(
    1,
    inputGi_,
    inputPresentTonnes,
    2 * inputPresentTonnes,
  ),
);
```

<figure id="figure-1" class="u-center">
<figcaption>Figure&nbsp;1: ${tex`\Delta A`} as a function of ${tex`A_i`} and
  ${tex`\Delta \bar C_i`} when carbon is sold to the AAM in multiple
  transactions (left) or in a single transaction (right)</figcaption>

```js
const plotDeltaA = Plot.plot({
  color: {
    legend: true,
    scheme: "Spectral",
    domain: [0, deltaAMax],
    type: "sequential",
    label: "ΔA",
  },
  x: { ticks: d3.range(0, 1.01, 0.1), label: "Aᵢ" },
  y: { ticks: d3.range(0, 2.01, 0.2), domain: [2.1, -0.1], label: "ΔC̄ᵢ" },
  fx: { label: null },
  marks: [
    Plot.frame(),
    Plot.rect(data, {
      x1: d => d.ai - 0.05,
      x2: d => d.ai + 0.05,
      y1: d => d.ci - 0.1,
      y2: d => d.ci + 0.1,
      fx: "key",
      fill: "value",
    }),
    Plot.text(data, {
      x: "ai",
      y: "ci",
      fx: "key",
      text: d => Number.isNaN(d.value) ? "" : d.value.toLocaleString(
        "en-GB",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      ),
      fill: d => Util.contrastingTextColor(
        d3.scaleSequential([0, deltaAMax], d3.interpolateSpectral)(d.value),
      ),
    }),
  ],
});

d3.select(plotDeltaA)
  .select("g[aria-label='y-axis label']")
  .select("text")
    .attr("transform", Util.changeTranslation(0, 10));

display(plotDeltaA);
```

</figure>

```js
const inputIsAStaked_ = view(Inputs.toggle({
  label: tex`\text{Stake \textbf{A}~tokens after each transaction?}`,
  value: true,
}));
const inputNTimes_ = view(Inputs.range([1, 100], {
  label: tex`\text{Number of transactions}`,
  step: 1,
  value: defaultNTimes,
  transform: Math.log,
}));
const inputGi_ = view(Inputs.range([0, 1], {
  label: tex`G_i \text{ (share of \textbf{G}~stake pricing class } i \text)`,
  step: 1e-3,
  value: defaultGi,
}));
```

```js
const differenceData = [];
for (let paramAi = 0.1; paramAi < 1.01; paramAi += 0.1) {
  differenceData.push({
    ai: paramAi,
    ci: 0,
    value: 0,
  });
}
for (let paramDeltaBarCi = 0; paramDeltaBarCi < 2.01; paramDeltaBarCi += 0.2) {
  differenceData.push({
    ai: 0,
    ci: paramDeltaBarCi,
    value: NaN,
  });
  for (let paramAi = 0.1; paramAi < 1.01; paramAi += 0.1) {
    differenceData.push({
      ai: paramAi,
      ci: paramDeltaBarCi,
      value: Math.log(Form.computeTrueDeltaA(
        paramAi,
        inputGi_,
        inputPresentTonnes,
        paramDeltaBarCi * inputPresentTonnes,
      )) - Math.log(computeMultiDeltaA(
        paramAi,
        inputGi_,
        inputPresentTonnes,
        paramDeltaBarCi * inputPresentTonnes,
        inputASupply,
        inputNTimes_,
        inputIsAStaked_,
      )),
    });
  }
}

const differenceMax = Math.log(Form.computeTrueDeltaA(
  1,
  inputGi_,
  inputPresentTonnes,
  2 * inputPresentTonnes,
)) - Math.log(computeMultiDeltaA(
  1,
  inputGi_,
  inputPresentTonnes,
  2 * inputPresentTonnes,
  inputASupply,
  inputNTimes_,
  inputIsAStaked_,
));
```

<figure id="figure-2" class="u-center">
<figcaption>Figure&nbsp;2: Difference between the two strategies: a single
  transaction gives more Klima in the blue area, while multiple transactions
  give more Klima in the red area</figcaption>

```js
Plot.plot({
  color: {
    legend: true,
    scheme: "RdBu",
    domain: [-differenceMax, differenceMax],
    // type: "sequential",
    label: "log(ΔA₂) − log(ΔA₁)",
  },
  x: { ticks: d3.range(0, 1.01, 0.1), label: "Aᵢ" },
  y: { ticks: d3.range(0, 2.01, 0.2), domain: [2.1, -0.1], label: "ΔC̄ᵢ" },
  marks: [
    Plot.frame(),
    Plot.rect(differenceData, {
      x1: d => d.ai - 0.05,
      x2: d => d.ai + 0.05,
      y1: d => d.ci - 0.1,
      y2: d => d.ci + 0.1,
      fill: "value",
    }),
    Plot.text(differenceData, {
      x: "ai",
      y: "ci",
      text: d => Number.isNaN(d.value) ? "" : d.value.toLocaleString(
        "en-GB",
        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      ),
      fill: d => Util.contrastingTextColor(
        d3.scaleSequential(
          [-differenceMax, differenceMax],
          d3.interpolateRdBu,
        )(d.value),
      ),
    }),
  ],
})
```

</figure>
