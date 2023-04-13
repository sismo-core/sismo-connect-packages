import React, { useEffect } from "react";
import './SismoConnectButton.css';
import { Logo } from "../Logo/Logo";
import { Loader } from "../Loader";
import { SismoConnectResponse, SismoConnectClientConfig, ClaimRequest, AuthRequest, SignatureRequest } from "@sismo-core/sismo-connect-client";
import { useSismoConnect } from "../../hooks/useSismoConnect";

type ButtonProps = {
  appId?: string;
  claim?: ClaimRequest;
  claims?: ClaimRequest[];
  auth?: AuthRequest;
  auths?: AuthRequest[];
  signature?: SignatureRequest;
  onResponse?: (response: SismoConnectResponse) => void;
  onResponseBytes?: (responseBytes: string) => void;
  config?: SismoConnectClientConfig;
  callbackPath?: string;
  namespace?: string;
  verifying?: boolean;
  overrideStyle?: React.CSSProperties;
};

export const SismoConnectButton = ({
  appId,
  claims,
  claim,
  auths,
  auth,
  signature,
  onResponse,
  onResponseBytes,
  config,
  callbackPath,
  namespace,
  verifying,
  overrideStyle,
}: ButtonProps) => {
  if (!appId && !config) {
    throw new Error("please add at least one appId or a config props in ZkConnectButton")
  }
  if (appId && config && appId !== config.appId) {
    throw new Error("the 'appId' props of your ZkConnectButton is different from the 'appId' in your configuration. Please add the same 'appId' props as in your configuration or remove the 'appId' prop")
  }
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
    config: config || {
      appId
    }
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
      className="sismoConnectButton"
      style={{
        cursor: verifying ? "default" : "cursor",
        ...overrideStyle
      }}
      onClick={() => {
        if (verifying) return;
        sismoConnect.request({
          claims,
          auths,
          claim,
          auth,
          signature,
          callbackPath,
          namespace
        })
      }}
    >
      {
        verifying ? 
        <Loader />
        :
        <div 
          className="sismoConnectButtonLogo"
        >
          <Logo/>
        </div>
      }
      <div
        className="sismoConnectButtonText"
      >
        {
          verifying ? 
            "verifying..."
            :
            "Sign in with Sismo"
        }
      </div>
    </button>
  );
}
