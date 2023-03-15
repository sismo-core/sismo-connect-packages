import { ZkConnect, ZkConnectClient, ZkConnectClientConfig, ZkConnectResponse } from "@sismo-core/zk-connect-client";
import { useEffect, useMemo, useState } from "react";

export type ZkConnect = {
    response: ZkConnectResponse | null,
    zkConnect: ZkConnectClient
};

export type ZkConnectProps = {
    appId: string,
    config?: Omit<ZkConnectClientConfig, "appId">
};

export const useZkConnect = ({ appId, config }: ZkConnectProps): ZkConnect => {
    const [response, setResponse] = useState(null);

    const zkConnect = useMemo(() => ZkConnect({
        appId,
        ...config
    }), [appId, config]);

    useEffect(() => {
        const zkConnectResponse = zkConnect.getResponse();
        if (zkConnectResponse) setResponse(zkConnectResponse);
    }, []);

    return {
        response,
        zkConnect
    };
};
