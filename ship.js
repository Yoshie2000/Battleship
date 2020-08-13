/// <reference path="p5.js" />

class Ship {

    // Set up the variables
    constructor(x, y, width, height) {
        this.width = width;
        this.height = height;

        this.fieldX = x;
        this.fieldY = y;

        this.onField = false;
        this.dragging = false;

        this.canvasX = 100;
        this.canvasY = 100;

        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        this.stopDragAnimation = false;
        this.stopDragAnimationTime = 0.1;
        this.stopDragAnimationTimer = 0;

        this.rotateAnimation = false;
        this.rotateAnimationTime = 0.2;
        this.rotateAnimationTimer = 0;
    }

    //#region Drawing

    draw() {
        // Make the ship follow the mouse while dragging
        if (this.dragging) {
            this.canvasX = mouseX;
            this.canvasY = mouseY;
        }

        let animationOffset = {
            x: 0,
            y: 0
        };

        push();

        // Calculate the rotation for the animation
        if (this.rotateAnimation) {
            if (this.rotateAnimationTimer >= this.rotateAnimationTime) {
                this.rotateAnimation = false;
                this.rotateAnimationTimer = 0;
            } else {
                this.rotateAnimationTimer += deltaTime / 1000;
                let timeRatio = this.easeInOut(this.rotateAnimationTimer / this.rotateAnimationTime);

                let translateX = mouseX - this.dragOffsetX * pow(timeRatio, 7);
                let translateY = mouseY - this.dragOffsetY * pow(timeRatio, 7);

                translate(translateX, translateY);

                let rotation = -HALF_PI + (timeRatio * HALF_PI);
                rotate(rotation);

                animationOffset.x -= translateX;
                animationOffset.y -= translateY;
            }
        }

        // Offset the ship for a stop drag animation
        if (this.stopDragAnimation) {
            if (this.stopDragAnimationTimer >= this.stopDragAnimationTime) {
                this.stopDragAnimation = false;
                this.stopDragAnimationTimer = 0;
            } else {
                this.stopDragAnimationTimer += deltaTime / 1000;
                let timeRatio = this.easeInOut(this.stopDragAnimationTimer / this.stopDragAnimationTime);

                animationOffset.x += (this.stopDragAnimationDestination.x - this.stopDragAnimationOrigin.x) * timeRatio;
                animationOffset.y += (this.stopDragAnimationDestination.y - this.stopDragAnimationOrigin.y) * timeRatio;
            }
        }

        let gridCellSize = getGridCellSize();

        for (let shipTileX = this.fieldX; shipTileX < this.fieldX + this.width; shipTileX++) {
            for (let shipTileY = this.fieldY; shipTileY < this.fieldY + this.height; shipTileY++) {

                // When dragging, follow the mouse and take the offset into account; otherwise stay at the current tile
                let canvasCoords = this.dragging || this.stopDragAnimation ? 
                    {
                        x: this.canvasX + this.dragOffsetX + (shipTileX - this.fieldX) * gridCellSize,
                        y: this.canvasY + this.dragOffsetY + (shipTileY - this.fieldY) * gridCellSize
                    }
                    : fieldCoordsToCanvasCoords(shipTileX, shipTileY);
                canvasCoords.x += animationOffset.x;
                canvasCoords.y += animationOffset.y;

                // Black boxes for each ship tile
                stroke(0);
                strokeWeight(1);
                fill(0);

                // Fill the line towards the bottom if another tile will be drawn there
                if (shipTileY - this.fieldY < this.height - 1) {
                    rect(canvasCoords.x + 2, canvasCoords.y + 2, gridCellSize - 4, gridCellSize);
                }
                // Fill the line towards the right if another tile will be drawn there
                else if (shipTileX - this.fieldX < this.width - 1) {
                    rect(canvasCoords.x + 2, canvasCoords.y + 2, gridCellSize, gridCellSize - 4);
                } else {
                    rect(canvasCoords.x + 2, canvasCoords.y + 2, gridCellSize - 4, gridCellSize - 4);
                }

            }
        }

        pop();

    }

    //#endregion Drawing

    //#region Dragging

    startDrag(dragOffsetX, dragOffsetY) {
        this.dragging = true;
        this.dragOffsetX = dragOffsetX;
        this.dragOffsetY = dragOffsetY;
    }

    stopDrag(newFieldCoords) {
        this.dragging = false;
        this.stopDragAnimation = true;
        this.fieldX = newFieldCoords.x;
        this.fieldY = newFieldCoords.y;
        this.stopDragAnimationOrigin = {
            x: this.canvasX + this.dragOffsetX,
            y: this.canvasY + this.dragOffsetY
        }
        this.stopDragAnimationDestination = fieldCoordsToCanvasCoords(newFieldCoords.x, newFieldCoords.y);
    }

    //#endregion Dragging

    //#region Geometry

    rotate() {
        // Store the old width and height
        let oldWidth = this.width;
        let oldHeight = this.height;

        // Switch width and height around
        this.width = oldHeight;
        this.height = oldWidth;

        // Calculate the ratio between the drag offset and width / height
        let dragOffsetRatioX = this.dragOffsetX / oldWidth;
        let dragOffsetRatioY = this.dragOffsetY / oldHeight;

        // Apply that ratio to the updated width and height
        this.dragOffsetX = this.width * dragOffsetRatioX;
        this.dragOffsetY = this.height * dragOffsetRatioY;

        // Start animation
        this.rotateAnimation = true;
    }

    getFieldBounds() {
        // The rectangle of the ship inside the field
        return {
            startX: this.fieldX,
            startY: this.fieldY,
            endX: this.fieldX + this.width,
            endY: this.fieldY + this.height
        }
    }

    getCanvasBounds() {
        let canvasCoords = fieldCoordsToCanvasCoords(this.fieldX, this.fieldY);
        let gridCellSize = getGridCellSize();

        // The rectangle of the ship inside the canvas
        return {
            startX: canvasCoords.x,
            startY: canvasCoords.y,
            endX: canvasCoords.x + gridCellSize * this.width,
            endY: canvasCoords.y + gridCellSize * this.height
        }
    }

    //#endregion Geometry

    //#region Timing

    easeIn(k) {
        return Math.pow(k, 1.675);
    }

    easeOut(k) {
        return 1 - Math.pow(1 - k, 1.675);
    }

    easeInOut(k) {
        return 0.5 * (sin(PI * Math.sin(k - 0.5)) + 1);
    }

    //#endregion Timing

}