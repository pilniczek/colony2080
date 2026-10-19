import { describe, expect, it } from "vitest";
import { assetList, ASSETS, isAssetId } from "./assets";

describe("ASSETS", () => {
  it("has every collected asset under its id and nothing else", () => {
    expect(Object.keys(ASSETS).sort()).toEqual(assetList.map((a) => a.id).sort());
    for (const a of assetList) expect(isAssetId(a.id)).toBe(true);
  });
  it("rejects unknown ids", () => {
    expect(isAssetId("nope")).toBe(false);
  });
});
