import OTArea, { OTAreaSet } from '@/elicast/ot-area'

mocha.fullTrace()

describe('OTArea', () => {
  it('merge adjacent text areas', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('text', 15, 20, true)
      .toArray()

    const expected = [new OTArea('text', 10, 20)]

    expect(actual).to.deep.equal(expected)
  })

  it('distinct text areas', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('text', 20, 25, true)
      .toArray()

    const expected = [
      new OTArea('text', 10, 15),
      new OTArea('text', 20, 25)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('adjacent text and exercise areas', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('exercise', 15, 20, false)
      .toArray()

    const expected = [
      new OTArea('text', 10, 15),
      new OTArea('exercise', 15, 20)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('distinct text and exercise areas', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('exercise', 20, 25, false)
      .toArray()

    const expected = [
      new OTArea('text', 10, 15),
      new OTArea('exercise', 20, 25)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('insert exercise inside text area', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('exercise', 12, 13, false)
      .toArray()

    const expected = [
      new OTArea('text', 10, 12),
      new OTArea('exercise', 12, 13),
      new OTArea('text', 13, 16)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('insert exercise inside text area, insert another exercise adjacent to' +
    'the exercise', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('exercise', 12, 13, false)
      .insert('exercise', 13, 14, false)
      .toArray()

    const expected = [
      new OTArea('text', 10, 12),
      new OTArea('exercise', 12, 13),
      new OTArea('exercise', 13, 14),
      new OTArea('text', 14, 17)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('remove preceding text area', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .remove('text', 0, 5)
      .toArray()

    const expected = [new OTArea('text', 5, 10)]

    expect(actual).to.deep.equal(expected)
  })

  it('remove text adjacent (left) to text area', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('text', 20, 25, true)
      .remove('text', 5, 10)
      .toArray()

    const expected = [
      new OTArea('text', 5, 10),
      new OTArea('text', 15, 20)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('remove text inside text area', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('text', 20, 25, true)
      .remove('text', 11, 12)
      .toArray()

    const expected = [
      new OTArea('text', 10, 14),
      new OTArea('text', 19, 24)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('remove whole text area', () => {
    const actual = new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('text', 20, 25, true)
      .remove('text', 10, 15)
      .toArray()

    const expected = [new OTArea('text', 15, 20)]

    expect(actual).to.deep.equal(expected)
  })

  it('remove whole text between two exercise areas', () => {
    const actual = new OTAreaSet()
      .insert('exercise', 10, 15, false)
      .insert('text', 15, 20, true)
      .insert('exercise', 20, 25, false)
      .remove('text', 15, 20)
      .toArray()

    const expected = [
      new OTArea('exercise', 10, 15),
      new OTArea('exercise', 15, 20)
    ]

    expect(actual).to.deep.equal(expected)
  })

  // FIXME implement empty exercise
  it('remove whole exercise area', () => {
    const actual = new OTAreaSet()
      .insert('exercise', 10, 15, false)
      .remove('exercise', 10, 15)
      .toArray()

    const expected = [new OTArea('exercise', 10, 10)]

    expect(actual).to.deep.equal(expected)
  })

  it('remove adjacent areas with different types', () => {
    expect(() => new OTAreaSet()
      .insert('text', 10, 15, true)
      .insert('exercise', 15, 20, false)
      .remove('text', 12, 17)
      .toArray()).to.throw('mixed')
  })

  it('remove area type mismatch', () => {
    expect(() => new OTAreaSet()
      .insert('text', 10, 15, true)
      .remove('exercise', 12, 13)
      .toArray()).to.throw('mismatch')
  })
})
