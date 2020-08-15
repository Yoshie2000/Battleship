function shootCell(x, y, fieldIndex) {
    let currentAttack = {
        x: x,
        y: y,
        i: fieldIndex
    };

    for (let oldAttack of attackData) {
        if (oldAttack.x == currentAttack.x && oldAttack.y == currentAttack.y && oldAttack.i == currentAttack.i) {
            if (currentPlayer == 1) {
                playerFinished = true;
            }
            return false;
        }
    }

    currentPlayer = (currentPlayer + 1) % 2;

    let shipsToCheck = fieldIndex == 0 ? ships : otherShips;

    attackData.push(currentAttack);

    for (let ship of shipsToCheck) {
        if (rectContainsNoEdges(ship.getFieldBounds(), x, y)) {
            if (fieldIndex == 0) {
                fieldData[x][y] = 2;
            } else {
                otherFieldData[x][y] = 2;
            }

            currentPlayer = (currentPlayer + 1) % 2;

            if (currentPlayer == 1) {
                playerFinished = true;
                aiTurnStarted = frameCount;
            }

            return true;
        }
    }

    if (fieldIndex == 0) {
        fieldData[x][y] = 1;
    } else {
        otherFieldData[x][y] = 1;
    }

    if (currentPlayer == 1) {
        playerFinished = true;
        aiTurnStarted = frameCount;
    }

    return true;
}

function aiAttack(fieldIndex) {
    let highestProbabilityCell = getHighestProbabilityCell(fieldIndex);
    shootCell(highestProbabilityCell.x, highestProbabilityCell.y, fieldIndex);

    // Randomly hit an unhit cell
    //while (!shootCell(floor(random(gridSize)), floor(random(gridSize)), fieldIndex)) {
    //    console.log("already hit");
    //}
}

function checkForGameOver() {

    let isGameOver = true;
    for (let ship of ships) {
        let bounds = ship.getFieldBounds();

        for (let x = bounds.startX; x < bounds.endX; x++) {
            for (let y = bounds.startY; y < bounds.endY; y++) {
                let cellData = fieldData[x][y];

                if (cellData != 2) {
                    isGameOver = false;
                }
            }
        }
    }

    if (isGameOver) {
        return 0;
    }

    isGameOver = true;
    for (let ship of otherShips) {
        let bounds = ship.getFieldBounds();

        for (let x = bounds.startX; x < bounds.endX; x++) {
            for (let y = bounds.startY; y < bounds.endY; y++) {
                let cellData = otherFieldData[x][y];

                if (cellData != 2) {
                    isGameOver = false;
                }
            }
        }
    }

    if (isGameOver) {
        return 1;
    }

    return -1;
}