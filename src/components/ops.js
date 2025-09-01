import * as d3 from "npm:d3";

export function dotProduct(v, w) {
  if (v.length !== w.length) {
    throw new Error("Vectors must have the same length");
  }
  return v.reduce((acc, val, i) => acc + val * w[i], 0);
}

export function normalize(v) {
  const sum = d3.sum(v);
  return v.map(val => val / sum);
}

export function weightedArithmeticMean(v, weights) {
  return dotProduct(v, weights) / d3.sum(weights);
}

export function piecewiseLogTransform(xTran = 1) {
  return x => x > xTran ? Math.log(x) : x - xTran + Math.log(xTran);
}

export function piecewiseLogInvert(xTran = 1) {
  return y => y > Math.log(xTran) ? Math.exp(y) : y - Math.log10(xTran) + xTran;
}

export function piecewiseSymLogTransform(xTran = 1) {
  return x => {
    const absX = Math.abs(x);
    if (absX > xTran) {
      return Math.sign(x) * (Math.log(absX) + xTran - Math.log(xTran));
    } else {
      return x;
    }
  };
}

export function piecewiseSymLogInvert(xTran = 1) {
  return y => {
    const absY = Math.abs(y);
    if (absY > xTran) {
      return Math.sign(y) * Math.exp(absY - xTran + Math.log(xTran));
    } else {
      return y;
    }
  };
}
