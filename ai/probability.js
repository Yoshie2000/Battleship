function getHighestProbabilityCell(fieldIndex) {
    let probabilityMap = getProbabilityMap(fieldIndex);

    let highestIndexArray = [{
        x: -1,
        y: -1
    }];

    let lowestValue = Infinity;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            if (highestIndexArray[0].x == -1 || probabilityMap[x][y] > probabilityMap[highestIndexArray[0].x][highestIndexArray[0].y]) {
                highestIndexArray = [{
                    x: x,
                    y: y
                }];
            } else if (probabilityMap[x][y] == probabilityMap[highestIndexArray[0].x][highestIndexArray[0].y]) {
                highestIndexArray.push({
                    x: x,
                    y: y
                });
            }

            if (probabilityMap[x][y] < lowestValue) {
                lowestValue = probabilityMap[x][y];
            }

        }
    }

    let r = floor(random(highestIndexArray.length));
    let highestIndexX = highestIndexArray[r].x;
    let highestIndexY = highestIndexArray[r].y;

    return {
        x: highestIndexX,
        y: highestIndexY,
        probability: probabilityMap[highestIndexX][highestIndexY],
        probabilityMap: probabilityMap,
        lowestValue: lowestValue,
        highestValue: probabilityMap[highestIndexX][highestIndexY]
    };
}

function getProbabilityMap(fieldIndex) {

    let fieldHitData = fieldIndex == 0 ? fieldData : otherFieldData;

    let probabilityMap = createEmptyMap();
    let validPositionCounter = 0;

    // How many ships are still alive?
    let aliveShipCount = 0;
    // How many hits belong to alive ships?
    let aliveShipHits = 0;
    for (let shipObject of fieldIndex == 0 ? ships : otherShips) {
        if (!shipObject.isDead) {
            aliveShipCount++;
            aliveShipHits += shipObject.width * shipObject.height - shipObject.health;
        }
    }

    for (let i = 0; i <= 1; i++) {
        for (let shipObject of fieldIndex == 0 ? ships : otherShips) {

            if (shipObject.isDead) {
                continue;
            }

            let width = i == 0 ? shipObject.width : shipObject.height;
            let height = i == 0 ? shipObject.height : shipObject.width;

            // Go through all the possible positions for the ship (default rotation)
            for (let x = 0; x < gridSize - width + 1; x++) {
                for (let y = 0; y < gridSize - height + 1; y++) {

                    let positionIsValid = true;
                    let hitCount = 0;

                    // Check for each tile of the ship if it has been hit in the fieldHitData array
                    for (let xTile = 0; xTile < width && positionIsValid; xTile++) {
                        for (let yTile = 0; yTile < height && positionIsValid; yTile++) {
                            let positionBlocked = fieldHitData[x + xTile][y + yTile] == 1;
                            let belongsToDeadShip = false;

                            if (fieldHitData[x + xTile][y + yTile] == 2) {

                                // Check if cell belongs to a dead ship
                                for (let shipObject of fieldIndex == 0 ? ships : otherShips) {
                                    let shipBounds = shipObject.getFieldBounds();
                                    if (rectContainsNoEdges(shipBounds, x + xTile, y + yTile) && shipObject.isDead) {
                                        belongsToDeadShip = true;
                                    }
                                }

                                if (!belongsToDeadShip) {
                                    hitCount++;
                                }
                            }

                            if (positionBlocked || belongsToDeadShip) {
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

                                if (aliveShipCount == 1 && aliveShipHits >= 1 && hitCount == 0) {
                                    continue;
                                }

                                probabilityMap[x + xTile][y + yTile]++;
                                probabilityMap[x + xTile][y + yTile] += hitCount * 5;
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