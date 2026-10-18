import { expect, it } from "vitest";
import controls from "@config/controls.json";

it("reads controls from config", () => {
  expect(controls.keyboard.inventory).toEqual(["KeyI"]);
});
