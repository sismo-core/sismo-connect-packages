import { ZkConnect, ZkConnectClient, ZkConnectClientConfig, ZkConnectResponse } from "@sismo-core/zk-connect-client";
import { useEffect, useMemo, useState } from "react";

export type ZkConnectHook = {
    response: ZkConnectResponse | null,
    responseBytes: string,
    zkConnect: ZkConnectClient
};

export type ZkConnectProps = {
    config: ZkConnectClientConfig
};

export const useZkConnect = ({ config }: ZkConnectProps): ZkConnectHook => {
    const [response, setResponse] = useState(null);
    const [responseBytes, setResponseBytes] = useState(null);
    
    const zkConnect = useMemo(() => {
        return ZkConnect(config)
    }, [config]);

    useEffect(() => {
        const zkConnectResponse = zkConnect.getResponse();
        const zkConnectResponseBytes = zkConnect.getResponseBytes();
        if (zkConnectResponse) setResponse(zkConnectResponse);
        if (zkConnectResponseBytes) setResponseBytes(zkConnectResponseBytes);
    }, []);

    return {
        response,
        responseBytes,
        zkConnect
    };
};
