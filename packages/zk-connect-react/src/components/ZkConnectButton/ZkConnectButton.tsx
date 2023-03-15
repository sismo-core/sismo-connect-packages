import React, { useEffect } from "react";
import './ZkConnectButton.css';
import { Logo } from "../Logo/Logo";
import { Loader } from "../Loader";
import { DataRequest, ZkConnectResponse, DataRequestType, ZkConnectClientConfig, StatementRequest } from "@sismo-core/zk-connect-client";
import { useZkConnect } from "../../hooks/useZkConnect";

type ButtonProps = {
  appId: string;
  dataRequest?: Partial<DataRequestType> & Partial<StatementRequest>;
  onResponse?: (response: ZkConnectResponse) => void;
  config?: Omit<ZkConnectClientConfig, "appId">;
  callbackPath?: string;
  namespace?: string;
  verifying?: boolean;
  overrideStyle?: React.CSSProperties;
};

export const ZkConnectButton = ({
  appId,
  dataRequest,
  onResponse,
  config,
  callbackPath,
  namespace,
  verifying,
  overrideStyle,
}: ButtonProps) => {
  const { zkConnect, response } = useZkConnect({ 
    appId, 
    config 
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
          dataRequest: dataRequest && DataRequest(dataRequest),
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
