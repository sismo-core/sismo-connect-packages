import { describe, it, expect } from "@jest/globals";
import { toSismoConnectResponseBytes } from "../src/utils/toSismoResponseBytes";
import {
  sismoConnectResponse1,
  sismoConnectResponse2,
  sismoConnectResponseBytes1,
  sismoConnectResponseBytes2,
} from "./sismo-connect-response";

describe("Conversion SismoResponseByte", () => {
  it("Should convert a SismoConnectResponse into bytes using hex signature message", () => {
    const bytes = toSismoConnectResponseBytes(sismoConnectResponse1);
    expect(bytes).toEqual(sismoConnectResponseBytes1);
  });

  it("Should convert a SismoConnectResponse into bytes using string signature message", () => {
    const bytes = toSismoConnectResponseBytes(sismoConnectResponse2);
    expect(bytes).toEqual(sismoConnectResponseBytes2);
  });
});
