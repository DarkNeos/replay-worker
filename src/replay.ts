const STOC_GAME_MSG = 1
interface Package {
  func: number
  data: ArrayBuffer
}

export function getResponses (buffer: ArrayBuffer): ArrayBuffer[] {
  const responses = []
  let offset = 0
  const length = buffer.byteLength
  const dataview = new DataView(buffer)

  while (offset < length) {
    const func = dataview.getUint8(offset)
    offset += 1

    const num = dataview.getUint32(offset, true)
    offset += 4

    const data = buffer.slice(offset, offset + num)
    offset += num

    responses.push(package2buffer({ func, data }))
  }

  return responses
}

// ref: https://github.com/DarkNeos/neos-ts/blob/f15b790fa4f64551403445b2a8117bbdcb09b63f/src/api/ocgcore/ocgAdapter/packet.ts#L11
function package2buffer (pkg: Package): ArrayBuffer {
  const packetLen = 1 + 1 + pkg.data.byteLength
  const array = new Uint8Array(2 + 1 + 1 + pkg.data.byteLength)
  const dataview = new DataView(array.buffer)

  dataview.setUint16(0, packetLen, true)
  dataview.setUint8(2, STOC_GAME_MSG)
  array.set([pkg.func], 3)
  array.set(new Uint8Array(pkg.data), 4)

  return array.buffer
}
