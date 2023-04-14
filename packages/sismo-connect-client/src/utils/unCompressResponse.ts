import { ungzip } from 'pako'
import { toUint8Array } from 'js-base64'

export const unCompressResponse = (data) => ungzip(toUint8Array(data), { to: 'string' });