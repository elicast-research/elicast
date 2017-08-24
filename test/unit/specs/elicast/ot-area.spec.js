import OTArea, { OTAreaType, OTAreaSet } from '@/elicast/ot-area'

describe('OTArea', () => {
  it('invalid arguments', () => {
    const validType = 'text'
    const validFromPos = 1
    const validToPos = 2

    expect(() => new OTArea(1, validFromPos, validToPos)).to.throw()
    expect(() => new OTArea(validType, 'invalid', validToPos)).to.throw()
    expect(() => new OTArea(validType, validFromPos, 'invalid')).to.throw()
  })
})

describe('OTAreaSet', () => {
  it('invalid arguments', () => {
    const validType = new OTAreaType('text', false, false)

    expect(() => new OTAreaSet([validType])).to.not.throw()
    expect(() => new OTAreaSet()).to.throw()
    expect(() => new OTAreaSet([validType, null])).to.throw()
  })
})
