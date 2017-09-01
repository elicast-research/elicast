import { OTAreaType, OTAreaSet } from './ot-area.js'

export default class ElicastOTAreaSet extends OTAreaSet {
  static TEXT = 'text'
  static EXERCISE = 'exercise'
  static EXERCISE_BUILD = 'exercise_build'
  static ASSERT = 'assert'
  static ASSERT_BUILD = 'assert_build'

  constructor () {
    super([
      new OTAreaType(ElicastOTAreaSet.TEXT, true, true),
      new OTAreaType(ElicastOTAreaSet.EXERCISE, false, false),
      new OTAreaType(ElicastOTAreaSet.EXERCISE_BUILD, true, false),
      new OTAreaType(ElicastOTAreaSet.ASSERT, true, true),
      new OTAreaType(ElicastOTAreaSet.ASSERT_BUILD, true, false)
    ])
  }
}
