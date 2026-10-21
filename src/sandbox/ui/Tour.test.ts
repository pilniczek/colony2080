import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SandboxCommands } from "./Panel";
import { Tour } from "./Tour";

const noop = (): void => undefined;
const commands = { cheat: noop } as unknown as SandboxCommands;

describe("tour section", () => {
  const html = renderToStaticMarkup(createElement(Tour, { commands }));

  it("starts with an empty list, no stop and a 3 s delay", () => {
    expect(html).toContain("0/0");
    expect(html).toMatch(/<input[^>]*type="number"[^>]*value="3"/);
  });

  it("offers play, stop, previous and next", () => {
    for (const label of ["Play", "Stop", "Prev", "Next"]) expect(html).toContain(`>${label}</button>`);
  });
});
