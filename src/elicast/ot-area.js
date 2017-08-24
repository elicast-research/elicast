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
}

export class OTAreaSet {
  constructor () {
    this.areas = []
  }

  insert (type, fromPos, toPos, isAllowMerge) {
    OTArea.insert(this.areas, type, fromPos, toPos, isAllowMerge)
    return this
  }

  remove (type, fromPos, toPos, isAllowMerge) {
    OTArea.remove(this.areas, type, fromPos, toPos, isAllowMerge)
    return this
  }

  toArray () {
    return this.areas
  }
}

window.OTAreaSet = OTAreaSet

function shiftRemainingAreas (areas, fromIndex, deltaPos) {
  for (let i = fromIndex; i < areas.length; i++) {
    areas[i].fromPos += deltaPos
    areas[i].toPos += deltaPos
  }
}

OTArea.insert = function (areas, type, fromPos, toPos, isAllowMerge) {
  let isInserted = false
  for (let i = 0; i < areas.length; i++) {
    let area = areas[i]

    if (fromPos <= area.fromPos) {
      if (fromPos === area.fromPos && isAllowMerge && type === area.type) {
        area.toPos += toPos - fromPos
        shiftRemainingAreas(areas, i + 1, toPos - fromPos)
      } else {
        areas.splice(i, 0, new OTArea(type, fromPos, toPos))
        shiftRemainingAreas(areas, i + 1, toPos - fromPos)
      }
      isInserted = true
      break
    } else if (area.fromPos < fromPos && fromPos <= area.toPos) {
      if (isAllowMerge && type === area.type) {
        area.toPos += toPos - fromPos
        shiftRemainingAreas(areas, i + 1, toPos - fromPos)
      } else {
        const leftArea = new OTArea(area.type, area.fromPos, fromPos)
        const rightArea = new OTArea(area.type, toPos, area.toPos + (toPos - fromPos))

        areas[i] = leftArea
        areas.splice(i + 1, 0, new OTArea(type, fromPos, toPos))

        if (rightArea.fromPos < rightArea.toPos) {
          areas.splice(i + 2, 0, rightArea)
          shiftRemainingAreas(areas, i + 3, toPos - fromPos)
        } else {
          shiftRemainingAreas(areas, i + 2, toPos - fromPos)
        }
      }
      isInserted = true
      break
    }
  }

  if (!isInserted) {
    areas.push(new OTArea(type, fromPos, toPos))
  }

  return areas
}

OTArea.remove = function (areas, type, fromPos, toPos) {
  for (let i = 0; i < areas.length; i++) {
    let area = areas[i]

    if (fromPos < area.fromPos) {
      if (area.fromPos < toPos) {
        throw new Error('Does not support to remove mixed area (non-typed area + typed area)')
      } else {
        shiftRemainingAreas(areas, i, -(toPos - fromPos))
        if (i > 0 && areas[i - 1].toPos === area.fromPos &&
          areas[i - 1].type === area.type &&
          area.type === type) {
          areas[i - 1].toPos = area.toPos
          areas.splice(i, 1)
        }
      }
      break
    } else if (area.fromPos <= fromPos && fromPos < area.toPos) {
      if (type !== area.type) {
        throw new Error('Failed to remove area due to type mismatch')
      } else if (area.toPos < toPos) {
        throw new Error('Does not support to remove mixed area (typed area + non-typed area)')
      } else {
        area.toPos -= toPos - fromPos
        shiftRemainingAreas(areas, i + 1, -(toPos - fromPos))

        if (area.fromPos === area.toPos) {
          areas.splice(i, 1)
        }
      }
      break
    }
  }

  return areas
}
