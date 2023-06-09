import {
  SismoConnect,
  SismoConnectClient,
  SismoConnectConfig,
  SismoConnectResponse,
} from '@sismo-core/sismo-connect-client'
import { useEffect, useMemo, useState } from 'react'

export type SismoConnectHook = {
  response: SismoConnectResponse | null
  responseBytes: string
  sismoConnect: SismoConnectClient
}

export type SismoConnectProps = {
  config: SismoConnectConfig
}

export const useSismoConnect = ({
  config,
}: SismoConnectProps): SismoConnectHook => {
  const [response, setResponse] = useState(null)
  const [responseBytes, setResponseBytes] = useState(null)

  const sismoConnect = useMemo(() => SismoConnect({ config }), [config])

  useEffect(() => {
    if (!sismoConnect) return
    const sismoConnectResponse = sismoConnect.getResponse()
    const sismoConnectResponseBytes = sismoConnect.getResponseBytes()
    if (sismoConnectResponse) setResponse(sismoConnectResponse)
    if (sismoConnectResponseBytes) setResponseBytes(sismoConnectResponseBytes)
  }, [sismoConnect])

  return {
    response,
    responseBytes,
    sismoConnect,
  }
}
