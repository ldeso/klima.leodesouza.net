import * as d3 from "npm:d3";

export function changeTranslation(dx, dy) {
  return function () {
    const svgTransformList = this.transform.baseVal;
    if (svgTransformList.length > 1) {
      throw new Error("SVGTransformList must only contain one translation");
    }
    const {e, f} = svgTransformList.consolidate().matrix;
    return `translate(${e + dx},${f + dy})`;
  }
}

export function constAreaLinear(range, area, inputSlope, slopeFactor = 0.007) {
  if (range.length === 1) {
    return [area];
  }

  let y1 = 0;
  let y2 = range.length - 1;
  let slope = slopeFactor * Math.atanh(inputSlope);
  let intercept = area / range.length;

  if (Math.abs(slope) > 2 * intercept / (y2 - y1 - 1)) {
    const yExactShift = Math.sqrt(Math.abs(2 * area / slope));
    const yRoundShift = Math.max(1, Math.round(yExactShift));
    if (slope > 0) {
      y1 = y2 - yRoundShift;
    } else {
      y2 = y1 + yRoundShift;
    }
    slope = Math.sign(slope) * 2 * area / Math.pow((y2 - y1), 2);
    intercept = Math.abs(slope) * (y2 - y1 - 1) / 2;
  }

  const yConstArea = [];
  for (let i = 0; i < range.length; i++) {
    const y = i - (y1 + y2) / 2;
    yConstArea.push(Math.max(0, slope * y + intercept));
  }

  return yConstArea;
}

export function contrastingTextColor(backgroundColor) {
  if (d3.hsl(backgroundColor).l < 0.5) {
    return "white";
  } else {
    return "black";
  }
}

export function logRange(start, end, density) {
  const logStart = Math.log10(start);
  const logEnd = Math.log10(end);
  const logSpan = logEnd - logStart;
  const steps = Math.max(1, Math.round(density * logSpan));
  return d3.range(steps + 1).map(i => Math.pow(10, i*logSpan/steps + logStart));
}

export function numDigits(x) {
  return x === 0 ? 1 : (1 + Math.floor(Math.log10(x)));
}

export function setInput(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
