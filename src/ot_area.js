export default function OTArea() {

}

window.OTArea = OTArea;

function shiftRemainingAreas(areas, fromIndex, deltaPos) {
  for (let i = fromIndex; i < areas.length; i++) {
    areas[i].fromPos += deltaPos;
    areas[i].toPos += deltaPos;
  }
}


OTArea.insert = function(areas, type, fromPos, toPos, isAllowMerge) {
  let isInserted = false;
  for (let i = 0; i < areas.length; i++) {
    let area = areas[i];

    if (fromPos <= area.fromPos) {
      if (fromPos == area.fromPos && isAllowMerge && type == area.type) {
        area.toPos += toPos - fromPos;
        shiftRemainingAreas(areas, i + 1, toPos - fromPos);
      } else {
        areas.splice(i, 0, {
          type: type,
          fromPos: fromPos,
          toPos: toPos
        });
        shiftRemainingAreas(areas, i + 1, toPos - fromPos);
      }
      isInserted = true;
      break;

    } else if (area.fromPos < fromPos && fromPos <= area.toPos) {
      if (isAllowMerge && type == area.type) {
        area.toPos += toPos - fromPos;
        shiftRemainingAreas(areas, i + 1, toPos - fromPos);
      } else {
        const leftArea = {
            type: area.type,
            fromPos: area.fromPos,
            toPos: fromPos
          },
          rightArea = {
            type: area.type,
            fromPos: toPos,
            toPos: area.toPos + (toPos - fromPos)
          };

        areas[i] = leftArea;
        areas.splice(i + 1, 0, {
          type: type,
          fromPos: fromPos,
          toPos: toPos
        });

        if (rightArea.fromPos < rightArea.toPos) {
          areas.splice(i + 2, 0, rightArea);
          shiftRemainingAreas(areas, i + 3, toPos - fromPos);
        } else {
          shiftRemainingAreas(areas, i + 2, toPos - fromPos);
        }
      }
      isInserted = true;
      break;

    }
  }

  if (!isInserted) {
    areas.push({
      type: type,
      fromPos: fromPos,
      toPos: toPos
    });
  }

  return areas;
}

OTArea.remove = function(areas, type, fromPos, toPos) {
  for (let i = 0; i < areas.length; i++) {
    let area = areas[i];

    if (fromPos < area.fromPos) {
      if (area.fromPos < toPos) {
        console.error("Does not support to remove mixed area (non-typed area + typed area)");
      } else {
        shiftRemainingAreas(areas, i, -(toPos - fromPos));
        if (0 < i && areas[i - 1].toPos == area.fromPos && areas[i - 1].type == area.type &&
          area.type == type) {
          areas[i - 1].toPos = area.toPos;
          areas.splice(i, 1);
        }
      }
      break;

    } else if (area.fromPos <= fromPos && fromPos < area.toPos) {
      if (type !== area.type) {
        console.error("Failed to remove area due to type mismatch");
      } else if (area.toPos < toPos) {
        console.error("Does not support to remove mixed area (typed area + non-typed area)");
      } else {
        area.toPos -= toPos - fromPos;
        shiftRemainingAreas(areas, i + 1, -(toPos - fromPos));

        if (area.fromPos == area.toPos) {
          areas.splice(i, 1);
        }
      }
      break;

    }
  }

  return areas;
}



// OTArea.insert(OTArea.insert([], "text", 10, 15, true), "text", 15, 20, true);
// => {type: "text", fromPos: 10, toPos: 20}

// OTArea.insert(OTArea.insert([], "text", 10, 15, true), "text", 20, 25, true);
// => {type: "text", fromPos: 10, toPos: 15}
// => {type: "text", fromPos: 20, toPos: 25}

// OTArea.insert(OTArea.insert([], "text", 10, 15, true), "exercise", 15, 20, false);
// => {type: "text", fromPos: 10, toPos: 15}
// => {type: "exercise", fromPos: 15, toPos: 20}

// OTArea.insert(OTArea.insert([], "text", 10, 15, true), "exercise", 20, 25, false);
// => {type: "text", fromPos: 10, toPos: 15}
// => {type: "exercise", fromPos: 20, toPos: 25}

// OTArea.insert(OTArea.insert([], "text", 10, 15, true), "exercise", 12, 13, false);
// => {type: "text", fromPos: 10, toPos: 12}
// => {type: "exercise", fromPos: 12, toPos: 13}
// => {type: "text", fromPos: 13, toPos: 16}

// OTArea.insert(OTArea.insert(OTArea.insert([], "text", 10, 15, true), "exercise", 12, 13, false), "exercise", 13, 14, false);
// => {type: "text", fromPos: 10, toPos: 12}
// => {type: "exercise", fromPos: 12, toPos: 13}
// => {type: "exercise", fromPos: 13, toPos: 14}
// => {type: "text", fromPos: 14, toPos: 17}

// areas = OTArea.insert(OTArea.insert([], "text", 10, 15, true), "text", 20, 25, true)
// OTArea.remove(areas, "text", 5, 10)
// => {type: "text", fromPos: 5, toPos: 10}
// => {type: "text", fromPos: 15, toPos: 20}

// areas = OTArea.insert(OTArea.insert([], "text", 10, 15, true), "text", 20, 25, true)
// OTArea.remove(areas, "text", 11, 12)
// => {type: "text", fromPos: 10, toPos: 14}
// => {type: "text", fromPos: 19, toPos: 24}

// areas = OTArea.insert(OTArea.insert([], "text", 10, 15, true), "text", 20, 25, true)
// OTArea.remove(areas, "text", 10, 15)
// => {type: "text", fromPos: 15, toPos: 20}

// areas = OTArea.insert(OTArea.insert([], "text", 10, 15, true), "text", 20, 25, true)
// OTArea.remove(areas, "text", 16, 18)
// => {type: "text", fromPos: 10, toPos: 15}
// => {type: "text", fromPos: 18, toPos: 23}

// areas = OTArea.insert(OTArea.insert([], "text", 10, 15, true), "text", 20, 25, true)
// OTArea.remove(areas, "text", 15, 20)
// => {type: "text", fromPos: 10, toPos: 20}

// areas = OTArea.insert(OTArea.insert([], "text", 10, 15, true), "exercise", 20, 25, false)
// OTArea.remove(areas, "text", 15, 20)
// => {type: "text", fromPos: 10, toPos: 15}
// => {type: "exercise", fromPos: 15, toPos: 20}
