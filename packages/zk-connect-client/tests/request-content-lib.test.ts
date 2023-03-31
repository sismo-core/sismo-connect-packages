import { AuthType, ClaimType, RequestContentLib } from '../src'

describe('RequestContentLib', () => {
  it('should generate a request content', async () => {
    expect(
      RequestContentLib.build({
        claimRequest: {
          groupId: '1',
        },
      })
    ).toEqual({
      dataRequests: [
        {
          claimRequest: {
            groupId: '1',
            groupTimestamp: 'latest',
            value: 1,
            claimType: 1,
            extraData: '',
          },
        },
      ],
      operators: [],
    })
  })

  it('should generate a request content with a authRequest', async () => {
    expect(
      RequestContentLib.build({
        authRequest: {
          authType: AuthType.ANON,
        },
      })
    ).toEqual({
      dataRequests: [
        {
          authRequest: {
            authType: AuthType.ANON,
            anonMode: false,
            extraData: '',
            userId: '0',
          },
        },
      ],
      operators: [],
    })
  })

  it('should generate a request content with a messageSignatureRequest', async () => {
    expect(
      RequestContentLib.build({
        messageSignatureRequest: 'this is a message',
      })
    ).toEqual({
      dataRequests: [
        {
          messageSignatureRequest: 'this is a message',
        },
      ],
      operators: [],
    })
  })

  // it("should generate a request content with operators", async () => {
  //     expect(RequestContentLib.build({
  //         dataRequests: [
  //             {
  //                 claimRequest: {
  //                     groupId: "1"
  //                 }
  //             },
  //             {
  //                 claimRequest: {
  //                     groupId: "2"
  //                 }
  //             },
  //             {
  //                 claimRequest: {
  //                     groupId: "3"
  //                 }
  //             }
  //         ],
  //         operator: "OR"
  //     })).toEqual({
  //         dataRequests: [
  //             {
  //                 claimRequest: {
  //                     groupId: "1",
  //                     groupTimestamp: "latest",
  //                     value: 1,
  //                     claimType: 1,
  //                     extraData: ''
  //                 }
  //             },
  //             {
  //                 claimRequest: {
  //                     groupId: "2",
  //                     groupTimestamp: "latest",
  //                     value: 1,
  //                     claimType: 1,
  //                     extraData: ''
  //                 }
  //             },
  //             {
  //                 claimRequest: {
  //                     groupId: "3",
  //                     groupTimestamp: "latest",
  //                     value: 1,
  //                     claimType: 1,
  //                     extraData: ''
  //                 }
  //             }
  //         ],
  //         operators: ["OR", "OR"]
  //     })
  // });
})
