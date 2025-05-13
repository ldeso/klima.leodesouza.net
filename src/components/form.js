export function computeGamma(vecE, paramD, paramC) {
  const twoC = 2 * paramC;
  return vecE.map(e => Math.max(0, e/paramD - e*e/twoC));
}

export function computeZ(paramS, vecCumSumGamma, vecE) {
  return vecCumSumGamma.map((g, t) => (1 - paramS) * g / vecE[t]);
}

export function computeB(vecZ, vecE) {
  return vecZ.map((z, t) => Math.exp(-z * vecE[t]));
}

export function computeY(vecZ) {
  return vecZ.map(z => Math.expm1(z / 365));
}

export function computeApproxDeltaA(paramS, paramE) {
  return paramS * (1 - paramS) / paramE;
}

export function computeDeltaCi0(deltaCi, t) {
  return t === 0 ? deltaCi : 0;
}

export function computeVecDeltaCi(deltaCi, t) {
  const vecDeltaCi = Array(40).fill(0);
  if (t !== 0) {
    vecDeltaCi[t - 1] = deltaCi;
  }
  return vecDeltaCi;
}

export function computeDeltaA(Ai, Gi, deltaCi) {
  return Math.expm1((Ai - (Ai**2 * (1 - Gi)**2 / 2)) * Math.log1p(deltaCi));
}

export function computeZeroCDeltaA(Ai, Gi, deltaCnull) {
  return (deltaCnull / (1 + deltaCnull)) * (Ai - (Ai**2 * (1 - Gi)**2 / 2))**2;
}

export function computeTrueDeltaA(Ai, Gi, barCiTonnes, deltaBarCiTonnes) {
  if (barCiTonnes === 0) {
    return computeZeroCDeltaA(Ai, Gi, deltaBarCiTonnes);
  } else {
    const deltaBarCi = deltaBarCiTonnes / barCiTonnes;
    return computeDeltaA(Ai, Gi, deltaBarCi);
  }
}

export function computeDeltaCi(Ai, Gi, deltaA) {
  return Math.expm1(-Math.log1p(deltaA) / (Ai + (Ai**2 * (1 - Gi)**2 / 2)));
}

export function computeSpread(Ai, Gi, deltaCinitial) {
  const deltaA = computeDeltaA(Ai, Gi, deltaCinitial);
  const deltaCfinal = -computeDeltaCi(Ai, Gi, deltaA);
  return (deltaCinitial - deltaCfinal) / deltaCinitial;
}

export function computeBeta(vecAi, vecGi) {
  const beta2 = vecAi.reduce(
    (acc, Ai, i) => acc + Ai - Ai * (1 - vecGi[i])**2,
    0,
  );
  return Math.sqrt(beta2);
}

export function computeBetai(Ai, Gi) {
  return Math.sqrt(Ai - Ai * (1 - Gi)**2);
}

export function computeLambdaGG(AQ, Gi, GG) {
  return (1 - AQ) / (1 + (Gi / GG)**2);
}

export function computeLambdaG(AQ, AG) {
  return 2 * AG / (2 * AG + AQ * Math.sqrt(2));
}

export function computeLambdaQ(AQ, AG) {
  return 1 - computeLambdaG(AQ, AG);
}

export function computeP(t, P0, T) {
  const x0 = Math.log(P0 / (1 - P0));
  const xt = x0 * (1 - t / T);
  const exp = Math.exp(xt);
  return exp / (exp + 1);
}

export function computeDerivP(t, P0, T) {
  const x0 = Math.log(P0 / (1 - P0));
  const xt = x0 * (1 - t / T);
  const exp = Math.exp(xt);
  const P = exp / (1 + exp);
  return -(x0 / T) * P * (1 - P);
}

export function getVesting(vecVesting, t, tStart, tEnd) {
  if (t < tStart)
    return 0;
  else if (t < tEnd) {
    return vecVesting[t - tStart];
  } else {
    return vecVesting[tEnd - tStart - 1];
  }
}

export function computeUpsilon(G, L) {
  if (G === 0 && L === 0) {
    return 0;
  } else {
    return (2 * G * L / (G**2 + L**2))**2;
  }
}

export function computeEta(G, L) {
  if (G === 0 && L === 0) {
    return 0;
  } else {
    return 2 * G * L / (G * (1 - G) + L * (1 - L));
  }
}

export function computeTreasury(G, L) {
  return Math.max(0, 1 - computeUpsilon(G, L) * computeEta(G, L));
}

export function computeIBonds(G, L, S) {
  if (G === 0 && L === 0) {
    return 0;
  } else {
    return S * L**2 / (G**2 + L**2);
  }
}

export function computeIStaking(G, L, S) {
  if (G === 0 && L === 0) {
    return 0;
  } else {
    return (1 - S) * L**2 / (G**2 + L**2);
  }
}

export function computeIPool(G, L, weight) {
  if (G === 0 && L === 0) {
    return 0;
  } else {
    return weight * G**2 / (G**2 + L**2);
  }
}
