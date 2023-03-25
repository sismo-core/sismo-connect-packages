import React, { useEffect } from "react";
import './ZkConnectButton.css';
import { Logo } from "../Logo/Logo";
import { Loader } from "../Loader";
import { ZkConnectResponse, ZkConnectClientConfig, ZkConnectRequestContent } from "@sismo-core/zk-connect-client";
import { useZkConnect } from "../../hooks/useZkConnect";

type ButtonProps = {
  appId?: string;
  requestContent: ZkConnectRequestContent;
  onResponse?: (response: ZkConnectResponse) => void;
  config?: ZkConnectClientConfig;
  callbackPath?: string;
  namespace?: string;
  verifying?: boolean;
  overrideStyle?: React.CSSProperties;
};

export const ZkConnectButton = ({
  appId,
  requestContent,
  onResponse,
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

  const { zkConnect, response } = useZkConnect({ 
    config: config || {
      appId
    }
  });

  useEffect(() => {
    if (!response || !onResponse) return;
    onResponse(response);
  }, [response]);

  return (
    <button
      className="zkConnectButton"
      style={{
        cursor: verifying ? "default" : "cursor",
        ...overrideStyle
      }}
      onClick={() => {
        if (verifying) return;
        zkConnect.request({
          requestContent,
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
          className="zkConnectButtonLogo"
        >
          <Logo/>
        </div>
      }
      <div
        className="zkConnectButtonText"
      >
        {
          verifying ? 
            "verifying..."
            :
            "zkConnect"
        }
      </div>
    </button>
  );
}
