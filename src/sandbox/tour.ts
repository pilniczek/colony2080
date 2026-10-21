const NUMBER = String.raw`\s*(-?\d+(?:\.\d+)?)\s*`;
const STOP = new RegExp(`moveto\\(${NUMBER},${NUMBER}\\)`, "iy");
const GAP = /\s+/y;

const match = (re: RegExp, text: string, at: number): RegExpExecArray | null => {
  re.lastIndex = at;
  return re.exec(text);
};

export function tourStops(text: string): [number, number][] {
  const stops: [number, number][] = [];
  let at = match(GAP, text, 0) ? GAP.lastIndex : 0;
  for (let stop = match(STOP, text, at); stop; stop = match(STOP, text, at)) {
    stops.push([Number(stop[1]), Number(stop[2])]);
    if (!match(GAP, text, STOP.lastIndex)) break;
    at = GAP.lastIndex;
  }
  return stops;
}
