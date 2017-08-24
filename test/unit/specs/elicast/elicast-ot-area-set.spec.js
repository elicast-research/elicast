import OTArea from '@/elicast/ot-area'
import ElicastOTAreaSet from '@/elicast/elicast-ot-area-set'

describe('ElicastOTAreaSet', () => {
  it('insert text inside text area (prepend)', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 20)
      .insert('text', 10, 15)
      .toArray()

    const expected = [new OTArea('text', 10, 25)]

    expect(actual).to.deep.equal(expected)
  })

  it('insert text inside text area (middle)', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 20)
      .insert('text', 12, 17)
      .toArray()

    const expected = [new OTArea('text', 10, 25)]

    expect(actual).to.deep.equal(expected)
  })

  it('insert text inside text area (append)', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 20)
      .insert('text', 20, 25)
      .toArray()

    const expected = [new OTArea('text', 10, 25)]

    expect(actual).to.deep.equal(expected)
  })

  it('distinct text areas', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('text', 20, 25)
      .toArray()

    const expected = [
      new OTArea('text', 10, 15),
      new OTArea('text', 20, 25)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('insert between distinct text areas', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('text', 20, 25)
      .insert('text', 17, 20)
      .toArray()

    const expected = [
      new OTArea('text', 10, 15),
      new OTArea('text', 17, 20),
      new OTArea('text', 23, 28)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('adjacent text and exercise areas', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('exercise', 15, 20, false)
      .toArray()

    const expected = [
      new OTArea('text', 10, 15),
      new OTArea('exercise', 15, 20)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('distinct text and exercise areas', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('exercise', 20, 25, false)
      .toArray()

    const expected = [
      new OTArea('text', 10, 15),
      new OTArea('exercise', 20, 25)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('insert exercise inside text area', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('exercise', 12, 13, false)
      .toArray()

    const expected = [
      new OTArea('text', 10, 12),
      new OTArea('exercise', 12, 13),
      new OTArea('text', 13, 16)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('insert exercise inside text area on the left', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('exercise', 10, 12, false)
      .toArray()

    const expected = [
      new OTArea('exercise', 10, 12),
      new OTArea('text', 12, 17)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('insert exercise inside text area, insert another exercise adjacent to' +
    'the exercise', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
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
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .remove('text', 0, 5)
      .toArray()

    const expected = [new OTArea('text', 5, 10)]

    expect(actual).to.deep.equal(expected)
  })

  it('remove text adjacent (left) to text area', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('text', 20, 25)
      .remove('text', 5, 10)
      .toArray()

    const expected = [
      new OTArea('text', 5, 10),
      new OTArea('text', 15, 20)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('remove text adjacent (right) to text area', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('text', 20, 25)
      .remove('text', 15, 18)
      .toArray()

    const expected = [
      new OTArea('text', 10, 15),
      new OTArea('text', 17, 22)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('remove text inside text area', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('text', 20, 25)
      .remove('text', 11, 12)
      .toArray()

    const expected = [
      new OTArea('text', 10, 14),
      new OTArea('text', 19, 24)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('remove whole text area', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('text', 20, 25)
      .remove('text', 10, 15)
      .toArray()

    const expected = [new OTArea('text', 15, 20)]

    expect(actual).to.deep.equal(expected)
  })

  it('remove whole blank area between two distinct text areas', () => {
    const actual = new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('text', 20, 25)
      .remove('text', 15, 20)
      .toArray()

    const expected = [new OTArea('text', 10, 20)]

    expect(actual).to.deep.equal(expected)
  })

  it('remove whole text between two exercise areas', () => {
    const actual = new ElicastOTAreaSet()
      .insert('exercise', 10, 15, false)
      .insert('text', 15, 20)
      .insert('exercise', 20, 25, false)
      .remove('text', 15, 20)
      .toArray()

    const expected = [
      new OTArea('exercise', 10, 15),
      new OTArea('exercise', 15, 20)
    ]

    expect(actual).to.deep.equal(expected)
  })

  it('remove whole exercise area', () => {
    const actual = new ElicastOTAreaSet()
      .insert('exercise', 10, 15, false)
      .remove('exercise', 10, 15)
      .toArray()

    const expected = [new OTArea('exercise', 10, 10)]

    expect(actual).to.deep.equal(expected)
  })

  it('remove adjacent areas with different types', () => {
    expect(() => new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .insert('exercise', 15, 20, false)
      .remove('text', 12, 17)
      .toArray()).to.throw('mixed')
  })

  it('remove adjacent areas non-type + type', () => {
    expect(() => new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .remove('text', 8, 12)
      .toArray()).to.throw('mixed')
  })

  it('remove area type mismatch', () => {
    expect(() => new ElicastOTAreaSet()
      .insert('text', 10, 15)
      .remove('exercise', 12, 13)
      .toArray()).to.throw('mismatch')
  })
})
