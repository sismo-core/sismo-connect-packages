import React, { useEffect } from "react";
import "./SismoConnectButton.css";
import { LogoThemeDark, LogoThemeBlack, LogoThemeLight } from "../Logo";
import { Loader } from "../Loader";
import {
  SismoConnectResponse,
  SismoConnectConfig,
  ClaimRequest,
  AuthRequest,
  SignatureRequest,
} from "@sismo-core/sismo-connect-client";
import { useSismoConnect } from "../../hooks/useSismoConnect";

type ButtonProps = {
  claim?: ClaimRequest;
  claims?: ClaimRequest[];
  auth?: AuthRequest;
  auths?: AuthRequest[];
  signature?: SignatureRequest;
  onResponse?: (response: SismoConnectResponse) => void;
  onResponseBytes?: (responseBytes: string) => void;
  config: SismoConnectConfig;
  // [Deprecated]
  callbackPath?: string;
  callbackUrl?: string;
  namespace?: string;
  // [Deprecated]
  verifying?: boolean;
  loading?: boolean;
  text?: string;
  overrideStyle?: React.CSSProperties;
  disabled?: boolean;
  theme?: "light" | "dark" | "black";
};

export const SismoConnectButton = ({
  claims,
  claim,
  auths,
  auth,
  signature,
  onResponse,
  onResponseBytes,
  config,
  // [Deprecated]
  callbackPath,
  callbackUrl,
  namespace,
  // [Deprecated]
  verifying,
  text,
  loading,
  overrideStyle,
  disabled,
  theme = "dark",
}: ButtonProps) => {
  if (!claims && !auths && !signature && !claim && !auth) {
    throw new Error("Please specify at least one claimRequest or authRequest or signatureRequest");
  }

  if (claim && claims) {
    throw new Error("You can't use both claim and claims props");
  }
  if (auth && auths) {
    throw new Error("You can't use both auth and auths props");
  }

  const { sismoConnect, response, responseBytes } = useSismoConnect({
    config,
  });

  useEffect(() => {
    if (!response || !onResponse) return;
    onResponse(response);
  }, [response]);

  useEffect(() => {
    if (!responseBytes || !onResponseBytes) return;
    onResponseBytes(responseBytes);
  }, [responseBytes]);

  return (
    <button
      style={{
        borderRadius: "10px",
        padding: "0px 25px",
        height: "59px",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px",
        fontFamily: "Sarala-Regular, Arial, sans-serif",
        fontWeight: "400",
        fontSize: "18px",
        lineHeight: "normal",
        cursor: verifying || loading || disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        backgroundColor: theme === "light" ? "#FDFCF8" : theme === "black" ? "#000" : "#1c2847",
        border:
          theme === "light"
            ? "1px solid  #1C2847"
            : theme === "black"
            ? "1px solid #000"
            : "1px solid  #3f4973",
        color: theme === "light" ? "#0A101F" : theme === "black" ? "#ffffff" : "#ffffff",
        ...overrideStyle,
      }}
      disabled={disabled}
      onClick={() => {
        if (verifying || loading || disabled) return;
        sismoConnect.request({
          claims,
          auths,
          claim,
          auth,
          signature,
          callbackPath,
          callbackUrl,
          namespace,
        });
      }}
    >
      {verifying || loading ? (
        <Loader />
      ) : (
        <div
          style={{
            width: "18.66px",
            height: "24px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {theme === "light" ? (
            <LogoThemeLight />
          ) : theme === "black" ? (
            <LogoThemeBlack />
          ) : (
            <LogoThemeDark />
          )}
        </div>
      )}
      <div
        style={{
          fontFamily: "inherit",
          fontWeight: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
        }}
      >
        {text || "Sign in with Sismo"}
      </div>
    </button>
  );
};
