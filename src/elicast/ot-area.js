import _ from 'lodash'

export default class OTArea {
  constructor (type, fromPos, toPos) {
    if (!_.isString(type)) throw new Error('Invalid type')
    if (!_.isInteger(fromPos)) throw new Error('Invalid fromPos')
    if (!_.isInteger(toPos)) throw new Error('Invalid toPos')

    this.type = type
    this.fromPos = fromPos
    this.toPos = toPos
  }

  length () {
    return this.toPos - this.fromPos
  }
}

export class OTAreaType {
  constructor (name, mergeable, removeOnEmpty) {
    this.name = name
    this.mergeable = mergeable
    this.removeOnEmpty = removeOnEmpty
  }
}

export class OTAreaSet {
  constructor (typesArray) {
    if (!_.isArray(typesArray)) throw new Error('Invalid typesArray')
    typesArray.forEach(type => {
      if (!(type instanceof OTAreaType)) throw new Error('Invalid typesArray')
    })

    this.types = typesArray.reduce((types, type) => {
      types[type.name] = type
      return types
    }, {})
    this.areas = []
  }

  toArray () {
    return this.areas
  }

  insert (typeName, fromPos, toPos) {
    const newArea = new OTArea(typeName, fromPos, toPos)

    let newAreaIndex = -1
    for (let i = 0; i < this.areas.length; i++) {
      let area = this.areas[i]

      if (fromPos <= area.fromPos) {
        // non-typed area
        // if this.areas[i] is an empty area, newArea is inserted on the left
        this.areas.splice(i, 0, newArea)
        newAreaIndex = i

        shiftRemainingAreas(this.areas, i + 1, newArea.length())
        break
      } else if (area.fromPos < fromPos && fromPos <= area.toPos) {
        // split an area
        const rightSplittedArea = new OTArea(area.type, toPos, area.toPos + newArea.length())

        area.toPos = fromPos
        this.areas.splice(i + 1, 0, newArea)
        newAreaIndex = i + 1

        if (rightSplittedArea.length() > 0) {
          this.areas.splice(i + 2, 0, rightSplittedArea)
          shiftRemainingAreas(this.areas, i + 3, newArea.length())
        } else {
          shiftRemainingAreas(this.areas, i + 2, newArea.length())
        }
        break
      }
    }

    if (newAreaIndex === -1) {
      // rightmost area
      newAreaIndex = this.areas.push(newArea) - 1
    }

    // merge areas if mergeable
    this.mergeAdjacentAreas(newAreaIndex)

    return this
  }

  remove (typeName, fromPos, toPos) {
    const removeLength = toPos - fromPos

    let removeShiftStartIndex = -1
    for (let i = 0; i < this.areas.length; i++) {
      let area = this.areas[i]

      if (fromPos < area.fromPos) {
        // non-typed area
        if (area.fromPos < toPos) {
          throw new Error('Does not support to remove mixed area (non-typed area + typed area)')
        }

        removeShiftStartIndex = i
        shiftRemainingAreas(this.areas, removeShiftStartIndex, -removeLength)
        break
      } else if (area.fromPos <= fromPos && fromPos < area.toPos) {
        if (typeName !== area.type) {
          throw new Error('Failed to remove area due to type mismatch')
        }
        if (area.toPos < toPos) {
          throw new Error('Does not support to remove mixed area (typed area + non-typed area)')
        }

        area.toPos -= toPos - fromPos
        removeShiftStartIndex = i + 1
        shiftRemainingAreas(this.areas, removeShiftStartIndex, -removeLength)

        if (area.length() === 0 && this.types[area.type].removeOnEmpty) {
          this.areas.splice(i, 1)
        }
        break
      }
    }

    // merge areas if mergeable
    if (removeShiftStartIndex >= 0 && removeShiftStartIndex < this.areas.length) {
      this.mergeAdjacentAreas(removeShiftStartIndex)
    }

    return this
  }

  mergeAdjacentAreas (index) {
    const area = this.areas[index]

    const leftArea = (index > 0) && this.areas[index - 1]
    if (leftArea && this.canMerge(leftArea, area)) {
      area.fromPos -= leftArea.length()
      this.areas.splice(index - 1, 1)
      index--
    }

    const rightArea = (index + 1 < this.areas.length) && this.areas[index + 1]
    if (rightArea && this.canMerge(area, rightArea)) {
      area.toPos += rightArea.length()
      this.areas.splice(index + 1, 1)
    }

    return index
  }

  canMerge (leftArea, rightArea) {
    if (leftArea.type !== rightArea.type) return false
    if (leftArea.toPos !== rightArea.fromPos) return false
    if (!this.types[leftArea.type].mergeable) return false
    return true
  }
}

function shiftRemainingAreas (areas, fromIndex, deltaPos) {
  for (let i = fromIndex; i < areas.length; i++) {
    areas[i].fromPos += deltaPos
    areas[i].toPos += deltaPos
  }
}
