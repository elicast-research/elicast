import { OTAreaType, OTAreaSet } from './ot-area.js'

export default class ElicastOTAreaSet extends OTAreaSet {
  static TEXT = 'text'
  static EXERCISE = 'exercise'
  static EXERCISE_BUILD = 'exercise_build'
  static ASSERT = 'assert'

  constructor () {
    super([
      new OTAreaType(ElicastOTAreaSet.TEXT, true, true),
      new OTAreaType(ElicastOTAreaSet.EXERCISE, false, false),
      new OTAreaType(ElicastOTAreaSet.EXERCISE_BUILD, true, false),
      new OTAreaType(ElicastOTAreaSet.ASSERT, false, true),
      new OTAreaType(ElicastOTAreaSet.ASSERT_BUILD, true, false)
    ])
  }
}
