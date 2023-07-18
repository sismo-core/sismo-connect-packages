import { describe, expect, it } from "@jest/globals";
import { RequestBuilder } from "../src";
import { resolveSismoIdentifier } from "../src/common-types";
import { AuthType } from "../src/common-types";

describe("RequestBuilder", () => {
  describe("resolveSismoIdentifier", () => {
    it("should resolve the right identifier", () => {
      const identifier = "0x00010000000000123";
      const sismoIdentifier = resolveSismoIdentifier(identifier, AuthType.GITHUB);
      expect(sismoIdentifier).toEqual(`123`);
    });

    it("should keep the same identifier", () => {
      const identifier = "123";
      const sismoIdentifier = resolveSismoIdentifier(identifier, AuthType.GITHUB);
      expect(sismoIdentifier).toEqual(`123`);
    });
  });

  describe("RequestBuilder", () => {
    it("should put EVM account userIds in lower case", async () => {
      const auths = RequestBuilder.buildAuths([
        {
          authType: AuthType.EVM_ACCOUNT,
          userId: "0xAa1BcC",
        },
        {
          authType: AuthType.EVM_ACCOUNT,
          userId: "0xDaDBcD",
        },
      ]);
      expect(auths[0].userId).toEqual("0xaa1bcc");
      expect(auths[1].userId).toEqual("0xdadbcd");
    });
  });
});
