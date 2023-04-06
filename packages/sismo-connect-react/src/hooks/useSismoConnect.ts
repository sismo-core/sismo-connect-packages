import { SismoConnect, SismoConnectClient, SismoConnectClientConfig, SismoConnectResponse } from "@sismo-core/sismo-connect-client";
import { useEffect, useMemo, useState } from "react";

export type SismoConnectHook = {
    response: SismoConnectResponse | null,
    responseBytes: string,
    sismoConnect: SismoConnectClient
};

export type SismoConnectProps = {
    config: SismoConnectClientConfig
};

export const useSismoConnect = ({ config }: SismoConnectProps): SismoConnectHook => {
    const [response, setResponse] = useState(null);
    const [responseBytes, setResponseBytes] = useState(null);
    
    const sismoConnect = useMemo(() => {
        return SismoConnect(config)
    }, [config]);

    useEffect(() => {
        const sismoConnectResponse = sismoConnect.getResponse();
        const sismoConnectResponseBytes = sismoConnect.getResponseBytes();
        if (sismoConnectResponse) setResponse(sismoConnectResponse);
        if (sismoConnectResponseBytes) setResponseBytes(sismoConnectResponseBytes);
    }, []);

    return {
        response,
        responseBytes,
        sismoConnect
    };
};
