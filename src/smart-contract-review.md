---
title: Smart Contract Review
---

```js
import * as Form from "./components/form.js";
import * as Ops from "./components/ops.js";
import * as Util from "./components/util.js";
```

<h1 id="smart-contract-review" class="u-center" tabindex="-1">
  <a class="observablehq-header-anchor" href="#smart-contract-review">Smart
    Contract Review</a>
</h1>

_Does the smart contract implement carbon transactions like the white paper?_

## Carbon Transaction

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
  label: tex`\text{Present-value tonnes sold/retired}`,
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
const viewZeroCarbon = Inputs.button(
  [["Zero Carbon Scenario", () => Util.setInput(viewPresentTonnes, 0)]],
);
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
display(viewReset);
const inputASupply = view(viewASupply);
const inputPresentTonnes = view(viewPresentTonnes);
const inputDeltaTonnes = view(viewDeltaTonnes);
const inputAi = view(viewAi);
const inputGi = view(viewGi);
display(viewZeroCarbon);
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
if (inputPresentTonnes === 0) {
  viewZeroCarbon.classList.add("u-hidden");
} else {
  viewZeroCarbon.classList.remove("u-hidden");
}
```

```ts
// klima-v2 @ 0ff531a
import Decimal from "npm:decimal.js";

Decimal.set({ precision: 60, rounding: Decimal.ROUND_DOWN });

function toBigDecimal(val: bigint): Decimal {
  return new Decimal(val.toString()).div(new Decimal("1e18"));
}

// @todo double check this for use. currently not being used as no classBalances are zero
function calculateZeroCarbonScenario(
  amount: Decimal,
  klimaStake: Decimal,
  klimaXStake: Decimal
): Decimal {
  const ONE = new Decimal(1);

  // Convert to Decimal
  const deltaC = amount;
  const Ai = klimaStake;
  const Gi = klimaXStake;

  // Calculate using Decimal
  const leftTerm = deltaC.div(ONE.plus(deltaC));
  const oneMinusG = ONE.minus(Gi);
  const oneMinusGSquared = oneMinusG.pow(2);
  const ASquared = Ai.pow(2);
  const denomTerm = ASquared.mul(oneMinusGSquared).div(2);
  const bracket = Ai.minus(denomTerm);
  const bracketSquared = bracket.pow(2);

  return leftTerm.mul(bracketSquared);
}

function calculateKlimaSwapPrice(
  amountBigInt: bigint,
  klimaCirculatingSupply: bigint,
  maturityData: MaturityData[],
  klimaStakeBigInt: bigint,
  klimaXStakeBigInt: bigint,
  targetMaturityId: number
): SwapTestCase["klimaPrice"] {
  const ONE = new Decimal(1);

  let discountedDelta = new Decimal(0);
  let discountFactor = new Decimal(1);
  if (targetMaturityId === 0) {
    discountedDelta = toBigDecimal(amountBigInt);
  } else {
    const maturity = maturityData.find(
      (m) => Number(m.maturityId) === targetMaturityId
    );
    if (maturity) {
      discountedDelta = toBigDecimal(amountBigInt).mul(
        toBigDecimal(BigInt(maturity.discountFactor))
      );
      discountFactor = toBigDecimal(BigInt(maturity.discountFactor));
    }
  }
  // 4. Apply discounting to AAM balances (Equation 16)
  let totalDiscountedBalance = new Decimal(0);
  for (const maturity of maturityData) {
    const maturityAmount = toBigDecimal(BigInt(maturity.maturityAmount));
    const discountFactor = toBigDecimal(BigInt(maturity.discountFactor));

    totalDiscountedBalance = totalDiscountedBalance.plus(
      maturityAmount.mul(discountFactor)
    );
  }
  const klimaSupplyDecimal = toBigDecimal(klimaCirculatingSupply);

  if (totalDiscountedBalance.equals(0)) {
    // Handle zero carbon scenario with Decimal
    const deltaA = calculateZeroCarbonScenario(
      toBigDecimal(amountBigInt).mul(discountFactor),
      toBigDecimal(klimaStakeBigInt),
      toBigDecimal(klimaXStakeBigInt)
    );
    return deltaA.mul(klimaSupplyDecimal).toFixed(18);
  }

  // Calculate class delta
  const classDelta = discountedDelta.div(totalDiscountedBalance);

  // Convert stake values to Decimal
  const aiDecimal = toBigDecimal(klimaStakeBigInt);
  const giDecimal = toBigDecimal(klimaXStakeBigInt);

  // Calculate coefficient using Decimal
  const oneMinusG = ONE.minus(giDecimal);

  const oneMinusGSquared = oneMinusG.pow(2);

  const aiSquared = aiDecimal.pow(2);

  const halfTerm = aiSquared.mul(oneMinusGSquared).div(2);
  const coefficient = aiDecimal.minus(halfTerm);
  // Calculate using ln and exp from Decimal
  const onePlusDeltaC = ONE.plus(classDelta);
  const logTerm = onePlusDeltaC.ln();
  const rhsTerm = coefficient.mul(logTerm);
  const expTerm = rhsTerm.exp();
  const deltaA = expTerm.minus(ONE);

  // Calculate final price

  const klimaPriceDecimal = deltaA.mul(klimaSupplyDecimal);
  // Return as string with appropriate precision
  return klimaPriceDecimal.toFixed(18);
}

function calculateKlimaRetirementPrice(
  amountBigInt: bigint,
  klimaStakeBigInt: bigint,
  klimaXStakeBigInt: bigint,
  liquidClassBalance: bigint,
  klimaCirculatingSupply: bigint
): RetirementTestCase["klimaRetirementPrice"] {
  const ONE = new Decimal(1);
  // solve whitepaper equation for ΔA
  // ΔA = 1 − exp( −ln(1 + ΔC) · (A + ½·A²·(1 − G)²) )

  const liquidClassBalanceDec = new Decimal(liquidClassBalance.toString()).div(
    "1e18"
  );
  const amountDec = new Decimal(amountBigInt.toString()).div("1e18");
  const Ai = new Decimal(klimaStakeBigInt.toString()).div("1e18");
  const Gi = new Decimal(klimaXStakeBigInt.toString()).div("1e18");
  const supply = new Decimal(klimaCirculatingSupply.toString()).div("1e18");

  // ------------------------------------------------------------------------

  // @note what to do in this situation?
  if (amountDec.greaterThanOrEqualTo(liquidClassBalanceDec)) {
    // trying to retire the entire balance ⇒ quote full supply
    return supply.toFixed(18);
  }

  const deltaC = amountDec.div(liquidClassBalanceDec); // ΔC / Ci
  const exponent = Ai.plus(
    // A + ½A²(1−G)² (always > 0)
    Ai.pow(2).mul(ONE.minus(Gi).pow(2)).div(2)
  );

  // match sol impl with no negative logs
  const deltaA = ONE.minus(ONE.minus(deltaC).pow(exponent));

  return deltaA.mul(supply).toFixed(18); // price with 18 decimals
}
```

```js
function computeDeltaARetirement(Ai, Gi, deltaCi) {
  return Math.expm1(-(Ai + (Ai**2 * (1 - Gi)**2 / 2)) * Math.log1p(deltaCi));
}
```

```js
const deltaAEmittedWhitePaper = Form.computeTrueDeltaA(
  inputAi,
  inputGi,
  inputPresentTonnes,
  inputDeltaTonnes,
);
const deltaABurntWhitePaper = inputPresentTonnes === 0 ? 0 :
        -computeDeltaARetirement(
          inputAi,
          inputGi,
          inputDeltaTonnes / inputPresentTonnes,
        );

const totalAEmittedWhitePaper = deltaAEmittedWhitePaper * inputASupply;
const totalABurntWhitePaper = deltaABurntWhitePaper * inputASupply;

const totalAEmittedSmartContract = parseFloat(calculateKlimaSwapPrice(
  BigInt(1e18 * inputDeltaTonnes),
  BigInt(1e18 * inputASupply),
  [{
    discountFactor: BigInt(1e18),
    maturityAmount: BigInt(1e18 * inputPresentTonnes),
    maturityId: 0,
  }],
  BigInt(1e18 * inputAi),
  BigInt(1e18 * inputGi),
  0,
));

const totalABurntSmartContract = inputPresentTonnes === 0 ? 0 :
        parseFloat(calculateKlimaRetirementPrice(
          BigInt(1e18 * inputDeltaTonnes),
          BigInt(1e18 * inputAi),
          BigInt(1e18 * inputGi),
          BigInt(1e18 * inputPresentTonnes),
          BigInt(1e18 * inputASupply),
        ));

const diffAEmitted = Math.abs(totalAEmittedWhitePaper -
        totalAEmittedSmartContract);
const diffABurnt = Math.abs(totalABurntWhitePaper - totalABurntSmartContract);

const stringAEmittedWhitePaper = "+"+ totalAEmittedWhitePaper.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 18, maximumSignificantDigits: 18 },
) + " KLIMA";
const stringABurntWhitePaper = "−" + totalABurntWhitePaper.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 18, maximumSignificantDigits: 18 },
) + " KLIMA";
const stringAEmittedSmartContract = "+"+ totalAEmittedSmartContract.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 18, maximumSignificantDigits: 18 },
) + " KLIMA";
const stringABurntSmartContract = "−" + totalABurntSmartContract.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 18, maximumSignificantDigits: 18 },
) + " KLIMA";
const stringAEmittedDiff = "~" + diffAEmitted.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
) + " KLIMA";
const stringABurntDiff = "~" + diffABurnt.toLocaleString(
  "en-GB",
  { minimumSignificantDigits: 3, maximumSignificantDigits: 3 },
) + " KLIMA";
```

## KLIMA Variation

The above carbon transaction results in the following amounts of KLIMA emitted
or burnt by the protocol:

| Implementation | Carbon Sale                    | Carbon Retirement            |
| -------------- | ------------------------------ | ---------------------------- |
| White Paper    | ${stringAEmittedWhitePaper}    | ${stringABurntWhitePaper}    |
| Smart Contract | ${stringAEmittedSmartContract} | ${stringABurntSmartContract} |
| **Difference** | ${stringAEmittedDiff}          | ${stringABurntDiff}          |

## Conclusion

The current smart contract implementation results:

1. Are _identical_ to the white paper implementation results for **carbon
sales** (with an expected error caused by the use of floating point
arithmetics).
2. Are _significantly different_ to the white paper implementation results for
**carbon retirements**.
