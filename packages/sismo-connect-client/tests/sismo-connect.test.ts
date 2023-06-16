import {
  ClaimRequest,
  SismoConnect, 
  SismoConnectClient,
  SismoConnectConfig,
} from '../src'

describe('Sismo Connect Client', () => {
  let appId: string
  let groupId: string
  let claim: ClaimRequest
  let config: SismoConnectConfig

  let sismoConnect: SismoConnectClient

  beforeAll(() => {
    appId = '0xf68985adfc209fafebfb1a956913e7fa'
    groupId = '0x682544d549b8a461d7fe3e589846bb7b'

    config = {
      appId,
    }
    claim = {
      groupId: '0x1',
    }

    sismoConnect = SismoConnect({config})
  })

  it('should generate a request link', async () => {
    expect(
      sismoConnect.getRequestLink({
        claims: [claim],
      })
    ).toEqual(
      `https://vault-beta.sismo.io/connect?version=sismo-connect-v1.1&appId=0xf68985adfc209fafebfb1a956913e7fa&claims=[{\"groupId\":\"0x1\",\"claimType\":0,\"extraData\":\"\",\"groupTimestamp\":\"latest\",\"value\":1}]&compressed=true`
    )
  })

  it('should generate a request link with a namespace', async () => {
    expect(
      sismoConnect.getRequestLink({
        claims: [claim],
        namespace: 'my-namespace',
      })
    ).toEqual(
      `https://vault-beta.sismo.io/connect?version=sismo-connect-v1.1&appId=0xf68985adfc209fafebfb1a956913e7fa&claims=[{\"groupId\":\"0x1\",\"claimType\":0,\"extraData\":\"\",\"groupTimestamp\":\"latest\",\"value\":1}]&namespace=my-namespace&compressed=true`
    )
  })

  it('should generate a request link with a callbackPath', async () => {
    expect(
      sismoConnect.getRequestLink({
        claims: [claim],
        callbackPath: '/my-callback-path',
      })
    ).toEqual(
      `https://vault-beta.sismo.io/connect?version=sismo-connect-v1.1&appId=0xf68985adfc209fafebfb1a956913e7fa&claims=[{\"groupId\":\"0x1\",\"claimType\":0,\"extraData\":\"\",\"groupTimestamp\":\"latest\",\"value\":1}]&callbackPath=/my-callback-path&compressed=true`
    )
  })

  it('should generate a request link with impersonated addresses', async () => {
    sismoConnect = SismoConnect({config: {appId, vault: {
      impersonate: ['0x123', '0x345']
    }}})
    expect(
      sismoConnect.getRequestLink({
        claims: [claim],
      })
    ).toEqual(
      `https://vault-beta.sismo.io/connect?version=sismo-connect-v1.1&appId=0xf68985adfc209fafebfb1a956913e7fa&claims=[{\"groupId\":\"0x1\",\"claimType\":0,\"extraData\":\"\",\"groupTimestamp\":\"latest\",\"value\":1}]&vault={\"impersonate\":[\"0x123\",\"0x345\"]}&compressed=true`
    )
  })
})
