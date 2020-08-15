function getHighestProbabilityCell(fieldIndex) {
    let probabilityMap = getProbabilityMap(fieldIndex);

    let highestIndexX = -1,
        highestIndexY = -1;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            if (highestIndexX == -1 || highestIndexY == -1 || probabilityMap[x][y] > probabilityMap[highestIndexX][highestIndexY]) {
                highestIndexX = x;
                highestIndexY = y;
            }
        }
    }

    return {
        x: highestIndexX,
        y: highestIndexY,
        probability: probabilityMap[highestIndexX][highestIndexY],
        probabilityMap: probabilityMap
    };
}

function getProbabilityMap(fieldIndex) {

    let fieldHitData = fieldIndex == 0 ? fieldData : otherFieldData;

    let probabilityMap = createEmptyMap();
    let validPositionCounter = 0;

    for (let i = 0; i <= 1; i++) {
        for (let shipDataEntry of shipData) {

            let width = i == 0 ? shipDataEntry.width : shipDataEntry.height;
            let height = i == 0 ? shipDataEntry.height : shipDataEntry.width;

            // Go through all the possible positions for the ship (default rotation)
            for (let x = 0; x < gridSize - width + 1; x++) {
                for (let y = 0; y < gridSize - height + 1; y++) {

                    let positionIsValid = true;

                    // Check for each tile of the ship if it has been hit in the fieldHitData array
                    for (let xTile = 0; xTile < width && positionIsValid; xTile++) {
                        for (let yTile = 0; yTile < height && positionIsValid; yTile++) {
                            let positionBlocked = fieldHitData[x + xTile][y + yTile] == 1;

                            if (positionBlocked) {
                                positionIsValid = false;
                            }
                        }
                    }

                    if (positionIsValid) {
                        // Increase the counter
                        validPositionCounter++;
                        for (let xTile = 0; xTile < width && positionIsValid; xTile++) {
                            for (let yTile = 0; yTile < height && positionIsValid; yTile++) {
                                // Don't increase tile probability if already a ship hit
                                if (fieldHitData[x + xTile][y + yTile] != 0) {
                                    continue;
                                }

                                probabilityMap[x + xTile][y + yTile]++;
                            }
                        }
                    }

                }
            }

        }
    }

    // Convert the counter to a percentage
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            probabilityMap[x][y] /= validPositionCounter;
        }
    }

    return probabilityMap;
}

function createEmptyMap() {
    let map = [];
    for (let x = 0; x < gridSize; x++) {
        let column = [];
        for (let y = 0; y < gridSize; y++) {
            column.push(0);
        }
        map.push(column);
    }
    return map;
}