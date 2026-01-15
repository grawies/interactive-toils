/******/ (() => { // webpackBootstrap
/*!********************************!*\
  !*** ./src/typescript/main.ts ***!
  \********************************/
// If live debugging is needed: https://code.visualstudio.com/docs/typescript/typescript-tutorial#_debugging
var canvas = document.getElementById("canvas");
var setLimitsButton = document.getElementById("set-limits-button");
var Point = /** @class */ (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.copy = function () {
        return new Point(this.x, this.y);
    };
    Point.prototype.add = function (other) {
        return new Point(this.x + other.x, this.y + other.y);
    };
    Point.prototype.sub = function (other) {
        return new Point(this.x - other.x, this.y - other.y);
    };
    return Point;
}());
var TileState = /** @class */ (function () {
    function TileState() {
    }
    return TileState;
}());
var MouseLock = /** @class */ (function () {
    function MouseLock() {
    }
    return MouseLock;
}());
var GridCellState;
(function (GridCellState) {
    GridCellState[GridCellState["Free"] = 0] = "Free";
    GridCellState[GridCellState["Full"] = 1] = "Full";
    GridCellState[GridCellState["OverCapacity"] = 2] = "OverCapacity";
})(GridCellState || (GridCellState = {}));
var GameState = /** @class */ (function () {
    function GameState() {
    }
    return GameState;
}());
// For each tile, a list of 4 center points of the squares that make up the tile.
var tileShapes = [
    [new Point(-1, 0), new Point(0, 0), new Point(1, 0), new Point(0, 1)], // T
    [new Point(-0.5, -0.5), new Point(0.5, -0.5), new Point(0.5, 0.5), new Point(-0.5, 0.5)], // O
    [new Point(0, -1.5), new Point(0, -0.5), new Point(0, 0.5), new Point(0, 1.5)], // I
    [new Point(-0.5, -1.5), new Point(-0.5, -0.5), new Point(-0.5, 0.5), new Point(0.5, 0.5)], // L
    [new Point(-0.5, -1), new Point(-0.5, 0), new Point(0.5, 0), new Point(0.5, 1)], // S
];
var tileColors = [
    "#8C6B37", // T
    "#3B603C", // O
    "#8C3750", // I
    "#813130", // L
    "#47516A", // S
];
var verticalLimits = [-1, -1, 3, 3, -1, 2];
var horizontalLimits = [2, -1, 2, -1, 1, -1, -1];
var gameState = {
    zBuffer: [0, 1, 2, 3, 4],
    tileStates: [
        { position: new Point(10, 2), flipped: false, rotation: 0 },
        { position: new Point(10, 6), flipped: false, rotation: 0 },
        { position: new Point(12, 6), flipped: false, rotation: 0 },
        { position: new Point(10, 10), flipped: false, rotation: 0 },
        { position: new Point(13, 11), flipped: false, rotation: 0 },
    ],
    gridOccupation: Array(7).fill(0).map(function () { return Array(6).fill(GridCellState.Free); }),
    verticalLimitStates: Array(6).fill(GridCellState.Free),
    horizontalLimitStates: Array(7).fill(GridCellState.Free),
    mouseLock: undefined,
};
var scale = function (v) { return v * 50; };
var descale = function (v) { return v / 50; };
function redraw() {
    // Placeholder for future rendering code.
    var ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Could not get 2D context");
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, horizontalLimits, verticalLimits, gameState.gridOccupation, scale);
    drawTetrominoes(ctx, scale);
}
function drawGrid(ctx, horizontalLimits, verticalLimits, gridOccupation, scale) {
    // Shade occupied grid cells.
    for (var x = 0; x < 6; x++) {
        for (var y = 0; y < 7; y++) {
            var occupation = gridOccupation[y][x];
            if (occupation === GridCellState.Free) {
                ctx.fillStyle = "lightgray";
            }
            else if (occupation === GridCellState.Full) {
                ctx.fillStyle = "#808080";
            }
            else if (occupation === GridCellState.OverCapacity) {
                ctx.fillStyle = "red";
            }
            ctx.fillRect(scale(1 + x), scale(2 + y), scale(1), scale(1));
        }
    }
    // Draw the grid lines.
    // Grid starts at 1, 2 and ends at 7, 9.
    for (var x = 1; x <= 7; x++) {
        ctx.strokeRect(scale(x), scale(2), 0.1, scale(7));
    }
    for (var y = 2; y <= 9; y++) {
        ctx.strokeRect(scale(1), scale(y), scale(6), 0.1);
    }
    // Draw the hints.
    ctx.font = "30px Courier New";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Hints go along the horizontal (1,1) -> (7,1) (top row)
    // and the vertical (7, 2) -> (7,9) (right column).
    function getFillStyle(state) {
        if (state === GridCellState.Free) {
            return "red";
        }
        else if (state === GridCellState.Full) {
            return "darkgreen";
        }
        else if (state === GridCellState.OverCapacity) {
            return "red";
        }
        return "black";
    }
    for (var x = 0; x < 6; x++) {
        ctx.fillStyle = getFillStyle(gameState.verticalLimitStates[x]);
        var limit = verticalLimits[x];
        if (limit >= 0) {
            ctx.fillText("".concat(limit), scale(1 + x + 0.5), scale(1 + 0.5));
        }
    }
    for (var y = 0; y < 7; y++) {
        ctx.fillStyle = getFillStyle(gameState.horizontalLimitStates[y]);
        var limit = horizontalLimits[y];
        if (limit >= 0) {
            ctx.fillText("".concat(limit), scale(7 + 0.5), scale(2 + y + 0.5));
        }
    }
}
function drawTetrominoes(ctx, scale) {
    for (var _i = 0, _a = gameState.zBuffer.slice().reverse(); _i < _a.length; _i++) {
        var tileIndex = _a[_i];
        var tileState = gameState.tileStates[tileIndex];
        var shape = tileShapes[tileIndex];
        for (var _b = 0, shape_1 = shape; _b < shape_1.length; _b++) {
            var localSquareCenter = shape_1[_b];
            localSquareCenter = localSquareCenter.copy();
            // Apply transformations relative to tile center.
            var rotation = tileState.rotation % 4;
            for (var r = 0; r < rotation; r++) {
                var tmpX = localSquareCenter.x;
                localSquareCenter.x = -localSquareCenter.y;
                localSquareCenter.y = tmpX;
            }
            if (tileState.flipped) {
                localSquareCenter.y = -localSquareCenter.y;
            }
            // Translate and draw.
            var squareCenter = tileState.position.add(localSquareCenter);
            ctx.fillStyle = tileColors[tileIndex];
            ctx.globalAlpha = 0.8;
            ctx.fillRect(scale(squareCenter.x - 0.5), scale(squareCenter.y - 0.5), scale(1), scale(1));
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = "black";
            ctx.strokeRect(scale(squareCenter.x - 0.5), scale(squareCenter.y - 0.5), scale(1), scale(1));
        }
    }
}
function sumOfBits(n) {
    var count = 0;
    while (n > 0) {
        count += n & 1;
        n >>= 1;
    }
    return count;
}
function updateGridCellOccupation() {
    // Boolean indicator for whether a tile is present.
    var tileBitmapOnCell = Array(7).fill(0).map(function () { return Array(6).fill(0); });
    // Recalculate occupation based on tiles.
    for (var y = 0; y < 7; y++) {
        for (var x = 0; x < 6; x++) {
            for (var tileIndex = 0; tileIndex < gameState.zBuffer.length; tileIndex++) {
                if (tetraminoContainsPoint(tileIndex, new Point(1 + x + 0.5, 2 + y + 0.5))) {
                    tileBitmapOnCell[y][x] += (1 << tileIndex);
                }
            }
        }
    }
    // Reset occupation.
    for (var y = 0; y < 7; y++) {
        for (var x = 0; x < 6; x++) {
            gameState.gridOccupation[y][x] = GridCellState.Free;
        }
    }
    // Recalculate occupation based on tiles.
    for (var y = 0; y < 7; y++) {
        for (var x = 0; x < 6; x++) {
            var bitSum = sumOfBits(tileBitmapOnCell[y][x]);
            if (bitSum > 1) {
                gameState.gridOccupation[y][x] = GridCellState.OverCapacity;
            }
            if (bitSum >= 1) {
                gameState.gridOccupation[y][x] = gameState.gridOccupation[y][x] === GridCellState.OverCapacity ? GridCellState.OverCapacity : GridCellState.Full;
                // Mark all adjacent (incl diagonal) cells as adjacent to a tile.
                for (var dy = -1; dy <= 1; dy++) {
                    for (var dx = -1; dx <= 1; dx++) {
                        if (Math.abs(dx) + Math.abs(dy) !== 1) {
                            continue;
                        }
                        var nx = x + dx;
                        var ny = y + dy;
                        if (nx >= 0 && nx < 6 && ny >= 0 && ny < 7) {
                            if (gameState.gridOccupation[ny][nx] === GridCellState.Free) {
                                gameState.gridOccupation[ny][nx] = GridCellState.Full;
                            }
                            if ((tileBitmapOnCell[ny][nx] !== 0) && (tileBitmapOnCell[y][x] !== 0) && ((tileBitmapOnCell[ny][nx] !== tileBitmapOnCell[y][x]))) {
                                gameState.gridOccupation[ny][nx] = GridCellState.OverCapacity;
                            }
                        }
                    }
                }
            }
        }
    }
    // Check against limits.
    for (var x = 0; x < 6; x++) {
        var count = 0;
        for (var y = 0; y < 7; y++) {
            if (tileBitmapOnCell[y][x] !== 0) {
                count++;
            }
        }
        var limit = verticalLimits[x];
        if (limit < 0) {
            continue;
        }
        gameState.verticalLimitStates[x] = (count > limit) ? GridCellState.OverCapacity : (count === limit) ? GridCellState.Full : GridCellState.Free;
        if (count >= limit) {
            var state = (count > limit) ? GridCellState.OverCapacity : GridCellState.Full;
            for (var y = 0; y < 7; y++) {
                if (gameState.gridOccupation[y][x] !== GridCellState.OverCapacity) {
                    gameState.gridOccupation[y][x] = state;
                }
            }
        }
    }
    for (var y = 0; y < 7; y++) {
        var count = 0;
        for (var x = 0; x < 6; x++) {
            if (tileBitmapOnCell[y][x] !== 0) {
                count++;
            }
        }
        var limit = horizontalLimits[y];
        if (limit < 0) {
            continue;
        }
        gameState.horizontalLimitStates[y] = (count > limit) ? GridCellState.OverCapacity : (count === limit) ? GridCellState.Full : GridCellState.Free;
        if (count >= limit) {
            var state = (count > limit) ? GridCellState.OverCapacity : GridCellState.Full;
            for (var x = 0; x < 6; x++) {
                if (gameState.gridOccupation[y][x] !== GridCellState.OverCapacity) {
                    gameState.gridOccupation[y][x] = state;
                }
            }
        }
    }
}
function gameLoop() {
    var beforeTimeMs = Date.now();
    updateGridCellOccupation();
    window.requestAnimationFrame(function (t) { redraw(); });
    var elapsedTimeMs = Date.now() - beforeTimeMs;
    var targetFps = 30;
    var targetFrameTimeMs = 1000 / targetFps;
    var delayMs = Math.max(0, targetFrameTimeMs - elapsedTimeMs);
    setTimeout(gameLoop, delayMs);
}
gameLoop();
function tetraminoContainsPoint(tileIndex, position) {
    var tileState = gameState.tileStates[tileIndex];
    var shape = tileShapes[tileIndex];
    for (var _i = 0, shape_2 = shape; _i < shape_2.length; _i++) {
        var localSquareCenter = shape_2[_i];
        localSquareCenter = localSquareCenter.copy();
        // Apply transformations relative to tile center.
        var rotation = tileState.rotation % 4;
        for (var r = 0; r < rotation; r++) {
            var tmpX = localSquareCenter.x;
            localSquareCenter.x = -localSquareCenter.y;
            localSquareCenter.y = tmpX;
        }
        if (tileState.flipped) {
            localSquareCenter.y = -localSquareCenter.y;
        }
        var squareCenter = tileState.position.add(localSquareCenter);
        var localPoint = position.sub(squareCenter);
        if (localPoint.x >= -0.5 && localPoint.x < 0.5 &&
            localPoint.y >= -0.5 && localPoint.y < 0.5) {
            return true;
        }
    }
    return false;
}
canvas.addEventListener("mousedown", function (event) {
    console.log("Mouse down at (".concat(event.offsetX, ", ").concat(event.offsetY, ")"));
    if (gameState.mouseLock !== undefined) {
        // Already holding a tile.
        console.error("Already holding a tile, ignoring mouse down.");
        return;
    }
    // If the mouse is over a tile, lock it to the mouse position.
    var mousePosition = new Point(descale(event.offsetX), descale(event.offsetY));
    var selectedTile = undefined;
    for (var _i = 0, _a = gameState.zBuffer; _i < _a.length; _i++) {
        var tileIndex = _a[_i];
        if (tetraminoContainsPoint(tileIndex, mousePosition)) {
            selectedTile = tileIndex;
            break;
        }
    }
    if (selectedTile === undefined) {
        return;
    }
    // Update mouse lock state and z-buffer.
    gameState.mouseLock = {
        tileOffset: gameState.tileStates[selectedTile].position.sub(mousePosition),
        tileIndex: selectedTile,
    };
    var tmp = gameState.zBuffer[0];
    var i = 0;
    while (tmp !== selectedTile) {
        // Bubble up the selected tile in the z-buffer.
        var tmp2 = gameState.zBuffer[i + 1];
        gameState.zBuffer[i + 1] = tmp;
        tmp = tmp2;
        i++;
    }
    gameState.zBuffer[0] = selectedTile;
    console.log("Locked tile ".concat(selectedTile, " to mouse."));
});
canvas.addEventListener("mouseup", function (event) {
    console.log("Mouse up at (".concat(event.offsetX, ", ").concat(event.offsetY, ")"));
    if (gameState.mouseLock !== undefined) {
        // Clear the held tile.
        console.log("Clearing held tile.");
        gameState.mouseLock = undefined;
        return;
    }
});
canvas.addEventListener("mousemove", function (event) {
    if (gameState.mouseLock === undefined) {
        // Not holding a tile. No action necessary.
        return;
    }
    // Update the held tile position.
    var mousePosition = new Point(descale(event.offsetX), descale(event.offsetY));
    var tileIndex = gameState.mouseLock.tileIndex;
    var tileState = gameState.tileStates[tileIndex];
    tileState.position = mousePosition.add(gameState.mouseLock.tileOffset);
});
window.addEventListener("keydown", function (event) {
    if (gameState.mouseLock === undefined) {
        // Not holding a tile. No action necessary.
        return;
    }
    console.log("Key down during mouse lock: '".concat(event.key, "'"));
    if (event.repeat) {
        // Ignore repeat key events due to holding the key.
        return;
    }
    var key = event.key;
    if (key !== "r" && key !== "f") {
        // Not a transformation key.
        return;
    }
    // Update the held tile transformations.
    var tileIndex = gameState.mouseLock.tileIndex;
    var tileState = gameState.tileStates[tileIndex];
    if (key === "r") {
        tileState.rotation = (tileState.rotation + 1) % 4;
    }
    else if (key === "f") {
        tileState.flipped = !tileState.flipped;
    }
});
setLimitsButton.addEventListener("click", function (event) {
    var rowLimitButton = document.getElementById("row-limits");
    var colLimitButton = document.getElementById("col-limits");
    var rowLimitString = rowLimitButton.value;
    var colLimitString = colLimitButton.value;
    if (rowLimitString.length !== 7 || colLimitString.length !== 6) {
        alert("Row limits must be 7 characters and column limits must be 6 characters.");
        return;
    }
    for (var i = 0; i < 7; i++) {
        var char = rowLimitString.charAt(i);
        var limit = parseInt(char);
        if (isNaN(limit)) {
            horizontalLimits[i] = -1;
        }
        else {
            horizontalLimits[i] = limit;
        }
    }
    for (var i = 0; i < 6; i++) {
        var char = colLimitString.charAt(i);
        var limit = parseInt(char);
        if (isNaN(limit)) {
            verticalLimits[i] = -1;
        }
        else {
            verticalLimits[i] = limit;
        }
    }
});

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNEJBQTRCLE9BQU87QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0QsV0FBVztBQUMzRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQyxxQkFBcUI7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsY0FBYztBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkNBQTZDLGdCQUFnQjtBQUM3RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsT0FBTztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsT0FBTztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vLy4vc3JjL3R5cGVzY3JpcHQvbWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBJZiBsaXZlIGRlYnVnZ2luZyBpcyBuZWVkZWQ6IGh0dHBzOi8vY29kZS52aXN1YWxzdHVkaW8uY29tL2RvY3MvdHlwZXNjcmlwdC90eXBlc2NyaXB0LXR1dG9yaWFsI19kZWJ1Z2dpbmdcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcbnZhciBzZXRMaW1pdHNCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNldC1saW1pdHMtYnV0dG9uXCIpO1xudmFyIFBvaW50ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBvaW50KHgsIHkpIHtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICB9XG4gICAgUG9pbnQucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54LCB0aGlzLnkpO1xuICAgIH07XG4gICAgUG9pbnQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCArIG90aGVyLngsIHRoaXMueSArIG90aGVyLnkpO1xuICAgIH07XG4gICAgUG9pbnQucHJvdG90eXBlLnN1YiA9IGZ1bmN0aW9uIChvdGhlcikge1xuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAtIG90aGVyLngsIHRoaXMueSAtIG90aGVyLnkpO1xuICAgIH07XG4gICAgcmV0dXJuIFBvaW50O1xufSgpKTtcbnZhciBUaWxlU3RhdGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGlsZVN0YXRlKCkge1xuICAgIH1cbiAgICByZXR1cm4gVGlsZVN0YXRlO1xufSgpKTtcbnZhciBNb3VzZUxvY2sgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTW91c2VMb2NrKCkge1xuICAgIH1cbiAgICByZXR1cm4gTW91c2VMb2NrO1xufSgpKTtcbnZhciBHcmlkQ2VsbFN0YXRlO1xuKGZ1bmN0aW9uIChHcmlkQ2VsbFN0YXRlKSB7XG4gICAgR3JpZENlbGxTdGF0ZVtHcmlkQ2VsbFN0YXRlW1wiRnJlZVwiXSA9IDBdID0gXCJGcmVlXCI7XG4gICAgR3JpZENlbGxTdGF0ZVtHcmlkQ2VsbFN0YXRlW1wiRnVsbFwiXSA9IDFdID0gXCJGdWxsXCI7XG4gICAgR3JpZENlbGxTdGF0ZVtHcmlkQ2VsbFN0YXRlW1wiT3ZlckNhcGFjaXR5XCJdID0gMl0gPSBcIk92ZXJDYXBhY2l0eVwiO1xufSkoR3JpZENlbGxTdGF0ZSB8fCAoR3JpZENlbGxTdGF0ZSA9IHt9KSk7XG52YXIgR2FtZVN0YXRlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEdhbWVTdGF0ZSgpIHtcbiAgICB9XG4gICAgcmV0dXJuIEdhbWVTdGF0ZTtcbn0oKSk7XG4vLyBGb3IgZWFjaCB0aWxlLCBhIGxpc3Qgb2YgNCBjZW50ZXIgcG9pbnRzIG9mIHRoZSBzcXVhcmVzIHRoYXQgbWFrZSB1cCB0aGUgdGlsZS5cbnZhciB0aWxlU2hhcGVzID0gW1xuICAgIFtuZXcgUG9pbnQoLTEsIDApLCBuZXcgUG9pbnQoMCwgMCksIG5ldyBQb2ludCgxLCAwKSwgbmV3IFBvaW50KDAsIDEpXSwgLy8gVFxuICAgIFtuZXcgUG9pbnQoLTAuNSwgLTAuNSksIG5ldyBQb2ludCgwLjUsIC0wLjUpLCBuZXcgUG9pbnQoMC41LCAwLjUpLCBuZXcgUG9pbnQoLTAuNSwgMC41KV0sIC8vIE9cbiAgICBbbmV3IFBvaW50KDAsIC0xLjUpLCBuZXcgUG9pbnQoMCwgLTAuNSksIG5ldyBQb2ludCgwLCAwLjUpLCBuZXcgUG9pbnQoMCwgMS41KV0sIC8vIElcbiAgICBbbmV3IFBvaW50KC0wLjUsIC0xLjUpLCBuZXcgUG9pbnQoLTAuNSwgLTAuNSksIG5ldyBQb2ludCgtMC41LCAwLjUpLCBuZXcgUG9pbnQoMC41LCAwLjUpXSwgLy8gTFxuICAgIFtuZXcgUG9pbnQoLTAuNSwgLTEpLCBuZXcgUG9pbnQoLTAuNSwgMCksIG5ldyBQb2ludCgwLjUsIDApLCBuZXcgUG9pbnQoMC41LCAxKV0sIC8vIFNcbl07XG52YXIgdGlsZUNvbG9ycyA9IFtcbiAgICBcIiM4QzZCMzdcIiwgLy8gVFxuICAgIFwiIzNCNjAzQ1wiLCAvLyBPXG4gICAgXCIjOEMzNzUwXCIsIC8vIElcbiAgICBcIiM4MTMxMzBcIiwgLy8gTFxuICAgIFwiIzQ3NTE2QVwiLCAvLyBTXG5dO1xudmFyIHZlcnRpY2FsTGltaXRzID0gWy0xLCAtMSwgMywgMywgLTEsIDJdO1xudmFyIGhvcml6b250YWxMaW1pdHMgPSBbMiwgLTEsIDIsIC0xLCAxLCAtMSwgLTFdO1xudmFyIGdhbWVTdGF0ZSA9IHtcbiAgICB6QnVmZmVyOiBbMCwgMSwgMiwgMywgNF0sXG4gICAgdGlsZVN0YXRlczogW1xuICAgICAgICB7IHBvc2l0aW9uOiBuZXcgUG9pbnQoMTAsIDIpLCBmbGlwcGVkOiBmYWxzZSwgcm90YXRpb246IDAgfSxcbiAgICAgICAgeyBwb3NpdGlvbjogbmV3IFBvaW50KDEwLCA2KSwgZmxpcHBlZDogZmFsc2UsIHJvdGF0aW9uOiAwIH0sXG4gICAgICAgIHsgcG9zaXRpb246IG5ldyBQb2ludCgxMiwgNiksIGZsaXBwZWQ6IGZhbHNlLCByb3RhdGlvbjogMCB9LFxuICAgICAgICB7IHBvc2l0aW9uOiBuZXcgUG9pbnQoMTAsIDEwKSwgZmxpcHBlZDogZmFsc2UsIHJvdGF0aW9uOiAwIH0sXG4gICAgICAgIHsgcG9zaXRpb246IG5ldyBQb2ludCgxMywgMTEpLCBmbGlwcGVkOiBmYWxzZSwgcm90YXRpb246IDAgfSxcbiAgICBdLFxuICAgIGdyaWRPY2N1cGF0aW9uOiBBcnJheSg3KS5maWxsKDApLm1hcChmdW5jdGlvbiAoKSB7IHJldHVybiBBcnJheSg2KS5maWxsKEdyaWRDZWxsU3RhdGUuRnJlZSk7IH0pLFxuICAgIHZlcnRpY2FsTGltaXRTdGF0ZXM6IEFycmF5KDYpLmZpbGwoR3JpZENlbGxTdGF0ZS5GcmVlKSxcbiAgICBob3Jpem9udGFsTGltaXRTdGF0ZXM6IEFycmF5KDcpLmZpbGwoR3JpZENlbGxTdGF0ZS5GcmVlKSxcbiAgICBtb3VzZUxvY2s6IHVuZGVmaW5lZCxcbn07XG52YXIgc2NhbGUgPSBmdW5jdGlvbiAodikgeyByZXR1cm4gdiAqIDUwOyB9O1xudmFyIGRlc2NhbGUgPSBmdW5jdGlvbiAodikgeyByZXR1cm4gdiAvIDUwOyB9O1xuZnVuY3Rpb24gcmVkcmF3KCkge1xuICAgIC8vIFBsYWNlaG9sZGVyIGZvciBmdXR1cmUgcmVuZGVyaW5nIGNvZGUuXG4gICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgaWYgKCFjdHgpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkNvdWxkIG5vdCBnZXQgMkQgY29udGV4dFwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjdHguY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgZHJhd0dyaWQoY3R4LCBob3Jpem9udGFsTGltaXRzLCB2ZXJ0aWNhbExpbWl0cywgZ2FtZVN0YXRlLmdyaWRPY2N1cGF0aW9uLCBzY2FsZSk7XG4gICAgZHJhd1RldHJvbWlub2VzKGN0eCwgc2NhbGUpO1xufVxuZnVuY3Rpb24gZHJhd0dyaWQoY3R4LCBob3Jpem9udGFsTGltaXRzLCB2ZXJ0aWNhbExpbWl0cywgZ3JpZE9jY3VwYXRpb24sIHNjYWxlKSB7XG4gICAgLy8gU2hhZGUgb2NjdXBpZWQgZ3JpZCBjZWxscy5cbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IDY7IHgrKykge1xuICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IDc7IHkrKykge1xuICAgICAgICAgICAgdmFyIG9jY3VwYXRpb24gPSBncmlkT2NjdXBhdGlvblt5XVt4XTtcbiAgICAgICAgICAgIGlmIChvY2N1cGF0aW9uID09PSBHcmlkQ2VsbFN0YXRlLkZyZWUpIHtcbiAgICAgICAgICAgICAgICBjdHguZmlsbFN0eWxlID0gXCJsaWdodGdyYXlcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9jY3VwYXRpb24gPT09IEdyaWRDZWxsU3RhdGUuRnVsbCkge1xuICAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiM4MDgwODBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9jY3VwYXRpb24gPT09IEdyaWRDZWxsU3RhdGUuT3ZlckNhcGFjaXR5KSB7XG4gICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwicmVkXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdHguZmlsbFJlY3Qoc2NhbGUoMSArIHgpLCBzY2FsZSgyICsgeSksIHNjYWxlKDEpLCBzY2FsZSgxKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gRHJhdyB0aGUgZ3JpZCBsaW5lcy5cbiAgICAvLyBHcmlkIHN0YXJ0cyBhdCAxLCAyIGFuZCBlbmRzIGF0IDcsIDkuXG4gICAgZm9yICh2YXIgeCA9IDE7IHggPD0gNzsgeCsrKSB7XG4gICAgICAgIGN0eC5zdHJva2VSZWN0KHNjYWxlKHgpLCBzY2FsZSgyKSwgMC4xLCBzY2FsZSg3KSk7XG4gICAgfVxuICAgIGZvciAodmFyIHkgPSAyOyB5IDw9IDk7IHkrKykge1xuICAgICAgICBjdHguc3Ryb2tlUmVjdChzY2FsZSgxKSwgc2NhbGUoeSksIHNjYWxlKDYpLCAwLjEpO1xuICAgIH1cbiAgICAvLyBEcmF3IHRoZSBoaW50cy5cbiAgICBjdHguZm9udCA9IFwiMzBweCBDb3VyaWVyIE5ld1wiO1xuICAgIGN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XG4gICAgY3R4LnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XG4gICAgY3R4LnRleHRCYXNlbGluZSA9IFwibWlkZGxlXCI7XG4gICAgLy8gSGludHMgZ28gYWxvbmcgdGhlIGhvcml6b250YWwgKDEsMSkgLT4gKDcsMSkgKHRvcCByb3cpXG4gICAgLy8gYW5kIHRoZSB2ZXJ0aWNhbCAoNywgMikgLT4gKDcsOSkgKHJpZ2h0IGNvbHVtbikuXG4gICAgZnVuY3Rpb24gZ2V0RmlsbFN0eWxlKHN0YXRlKSB7XG4gICAgICAgIGlmIChzdGF0ZSA9PT0gR3JpZENlbGxTdGF0ZS5GcmVlKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJyZWRcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzdGF0ZSA9PT0gR3JpZENlbGxTdGF0ZS5GdWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJkYXJrZ3JlZW5cIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzdGF0ZSA9PT0gR3JpZENlbGxTdGF0ZS5PdmVyQ2FwYWNpdHkpIHtcbiAgICAgICAgICAgIHJldHVybiBcInJlZFwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBcImJsYWNrXCI7XG4gICAgfVxuICAgIGZvciAodmFyIHggPSAwOyB4IDwgNjsgeCsrKSB7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBnZXRGaWxsU3R5bGUoZ2FtZVN0YXRlLnZlcnRpY2FsTGltaXRTdGF0ZXNbeF0pO1xuICAgICAgICB2YXIgbGltaXQgPSB2ZXJ0aWNhbExpbWl0c1t4XTtcbiAgICAgICAgaWYgKGxpbWl0ID49IDApIHtcbiAgICAgICAgICAgIGN0eC5maWxsVGV4dChcIlwiLmNvbmNhdChsaW1pdCksIHNjYWxlKDEgKyB4ICsgMC41KSwgc2NhbGUoMSArIDAuNSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIHkgPSAwOyB5IDwgNzsgeSsrKSB7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBnZXRGaWxsU3R5bGUoZ2FtZVN0YXRlLmhvcml6b250YWxMaW1pdFN0YXRlc1t5XSk7XG4gICAgICAgIHZhciBsaW1pdCA9IGhvcml6b250YWxMaW1pdHNbeV07XG4gICAgICAgIGlmIChsaW1pdCA+PSAwKSB7XG4gICAgICAgICAgICBjdHguZmlsbFRleHQoXCJcIi5jb25jYXQobGltaXQpLCBzY2FsZSg3ICsgMC41KSwgc2NhbGUoMiArIHkgKyAwLjUpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGRyYXdUZXRyb21pbm9lcyhjdHgsIHNjYWxlKSB7XG4gICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IGdhbWVTdGF0ZS56QnVmZmVyLnNsaWNlKCkucmV2ZXJzZSgpOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgdGlsZUluZGV4ID0gX2FbX2ldO1xuICAgICAgICB2YXIgdGlsZVN0YXRlID0gZ2FtZVN0YXRlLnRpbGVTdGF0ZXNbdGlsZUluZGV4XTtcbiAgICAgICAgdmFyIHNoYXBlID0gdGlsZVNoYXBlc1t0aWxlSW5kZXhdO1xuICAgICAgICBmb3IgKHZhciBfYiA9IDAsIHNoYXBlXzEgPSBzaGFwZTsgX2IgPCBzaGFwZV8xLmxlbmd0aDsgX2IrKykge1xuICAgICAgICAgICAgdmFyIGxvY2FsU3F1YXJlQ2VudGVyID0gc2hhcGVfMVtfYl07XG4gICAgICAgICAgICBsb2NhbFNxdWFyZUNlbnRlciA9IGxvY2FsU3F1YXJlQ2VudGVyLmNvcHkoKTtcbiAgICAgICAgICAgIC8vIEFwcGx5IHRyYW5zZm9ybWF0aW9ucyByZWxhdGl2ZSB0byB0aWxlIGNlbnRlci5cbiAgICAgICAgICAgIHZhciByb3RhdGlvbiA9IHRpbGVTdGF0ZS5yb3RhdGlvbiAlIDQ7XG4gICAgICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IHJvdGF0aW9uOyByKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wWCA9IGxvY2FsU3F1YXJlQ2VudGVyLng7XG4gICAgICAgICAgICAgICAgbG9jYWxTcXVhcmVDZW50ZXIueCA9IC1sb2NhbFNxdWFyZUNlbnRlci55O1xuICAgICAgICAgICAgICAgIGxvY2FsU3F1YXJlQ2VudGVyLnkgPSB0bXBYO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRpbGVTdGF0ZS5mbGlwcGVkKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxTcXVhcmVDZW50ZXIueSA9IC1sb2NhbFNxdWFyZUNlbnRlci55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gVHJhbnNsYXRlIGFuZCBkcmF3LlxuICAgICAgICAgICAgdmFyIHNxdWFyZUNlbnRlciA9IHRpbGVTdGF0ZS5wb3NpdGlvbi5hZGQobG9jYWxTcXVhcmVDZW50ZXIpO1xuICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRpbGVDb2xvcnNbdGlsZUluZGV4XTtcbiAgICAgICAgICAgIGN0eC5nbG9iYWxBbHBoYSA9IDAuODtcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdChzY2FsZShzcXVhcmVDZW50ZXIueCAtIDAuNSksIHNjYWxlKHNxdWFyZUNlbnRlci55IC0gMC41KSwgc2NhbGUoMSksIHNjYWxlKDEpKTtcbiAgICAgICAgICAgIGN0eC5nbG9iYWxBbHBoYSA9IDEuMDtcbiAgICAgICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgICAgIGN0eC5zdHJva2VSZWN0KHNjYWxlKHNxdWFyZUNlbnRlci54IC0gMC41KSwgc2NhbGUoc3F1YXJlQ2VudGVyLnkgLSAwLjUpLCBzY2FsZSgxKSwgc2NhbGUoMSkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gc3VtT2ZCaXRzKG4pIHtcbiAgICB2YXIgY291bnQgPSAwO1xuICAgIHdoaWxlIChuID4gMCkge1xuICAgICAgICBjb3VudCArPSBuICYgMTtcbiAgICAgICAgbiA+Pj0gMTtcbiAgICB9XG4gICAgcmV0dXJuIGNvdW50O1xufVxuZnVuY3Rpb24gdXBkYXRlR3JpZENlbGxPY2N1cGF0aW9uKCkge1xuICAgIC8vIEJvb2xlYW4gaW5kaWNhdG9yIGZvciB3aGV0aGVyIGEgdGlsZSBpcyBwcmVzZW50LlxuICAgIHZhciB0aWxlQml0bWFwT25DZWxsID0gQXJyYXkoNykuZmlsbCgwKS5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gQXJyYXkoNikuZmlsbCgwKTsgfSk7XG4gICAgLy8gUmVjYWxjdWxhdGUgb2NjdXBhdGlvbiBiYXNlZCBvbiB0aWxlcy5cbiAgICBmb3IgKHZhciB5ID0gMDsgeSA8IDc7IHkrKykge1xuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IDY7IHgrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgdGlsZUluZGV4ID0gMDsgdGlsZUluZGV4IDwgZ2FtZVN0YXRlLnpCdWZmZXIubGVuZ3RoOyB0aWxlSW5kZXgrKykge1xuICAgICAgICAgICAgICAgIGlmICh0ZXRyYW1pbm9Db250YWluc1BvaW50KHRpbGVJbmRleCwgbmV3IFBvaW50KDEgKyB4ICsgMC41LCAyICsgeSArIDAuNSkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbGVCaXRtYXBPbkNlbGxbeV1beF0gKz0gKDEgPDwgdGlsZUluZGV4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gUmVzZXQgb2NjdXBhdGlvbi5cbiAgICBmb3IgKHZhciB5ID0gMDsgeSA8IDc7IHkrKykge1xuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IDY7IHgrKykge1xuICAgICAgICAgICAgZ2FtZVN0YXRlLmdyaWRPY2N1cGF0aW9uW3ldW3hdID0gR3JpZENlbGxTdGF0ZS5GcmVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFJlY2FsY3VsYXRlIG9jY3VwYXRpb24gYmFzZWQgb24gdGlsZXMuXG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCA3OyB5KyspIHtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCA2OyB4KyspIHtcbiAgICAgICAgICAgIHZhciBiaXRTdW0gPSBzdW1PZkJpdHModGlsZUJpdG1hcE9uQ2VsbFt5XVt4XSk7XG4gICAgICAgICAgICBpZiAoYml0U3VtID4gMSkge1xuICAgICAgICAgICAgICAgIGdhbWVTdGF0ZS5ncmlkT2NjdXBhdGlvblt5XVt4XSA9IEdyaWRDZWxsU3RhdGUuT3ZlckNhcGFjaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGJpdFN1bSA+PSAxKSB7XG4gICAgICAgICAgICAgICAgZ2FtZVN0YXRlLmdyaWRPY2N1cGF0aW9uW3ldW3hdID0gZ2FtZVN0YXRlLmdyaWRPY2N1cGF0aW9uW3ldW3hdID09PSBHcmlkQ2VsbFN0YXRlLk92ZXJDYXBhY2l0eSA/IEdyaWRDZWxsU3RhdGUuT3ZlckNhcGFjaXR5IDogR3JpZENlbGxTdGF0ZS5GdWxsO1xuICAgICAgICAgICAgICAgIC8vIE1hcmsgYWxsIGFkamFjZW50IChpbmNsIGRpYWdvbmFsKSBjZWxscyBhcyBhZGphY2VudCB0byBhIHRpbGUuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgZHkgPSAtMTsgZHkgPD0gMTsgZHkrKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBkeCA9IC0xOyBkeCA8PSAxOyBkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoZHgpICsgTWF0aC5hYnMoZHkpICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbnggPSB4ICsgZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbnkgPSB5ICsgZHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobnggPj0gMCAmJiBueCA8IDYgJiYgbnkgPj0gMCAmJiBueSA8IDcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2FtZVN0YXRlLmdyaWRPY2N1cGF0aW9uW255XVtueF0gPT09IEdyaWRDZWxsU3RhdGUuRnJlZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnYW1lU3RhdGUuZ3JpZE9jY3VwYXRpb25bbnldW254XSA9IEdyaWRDZWxsU3RhdGUuRnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCh0aWxlQml0bWFwT25DZWxsW255XVtueF0gIT09IDApICYmICh0aWxlQml0bWFwT25DZWxsW3ldW3hdICE9PSAwKSAmJiAoKHRpbGVCaXRtYXBPbkNlbGxbbnldW254XSAhPT0gdGlsZUJpdG1hcE9uQ2VsbFt5XVt4XSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVTdGF0ZS5ncmlkT2NjdXBhdGlvbltueV1bbnhdID0gR3JpZENlbGxTdGF0ZS5PdmVyQ2FwYWNpdHk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIENoZWNrIGFnYWluc3QgbGltaXRzLlxuICAgIGZvciAodmFyIHggPSAwOyB4IDwgNjsgeCsrKSB7XG4gICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgIGZvciAodmFyIHkgPSAwOyB5IDwgNzsgeSsrKSB7XG4gICAgICAgICAgICBpZiAodGlsZUJpdG1hcE9uQ2VsbFt5XVt4XSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxpbWl0ID0gdmVydGljYWxMaW1pdHNbeF07XG4gICAgICAgIGlmIChsaW1pdCA8IDApIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGdhbWVTdGF0ZS52ZXJ0aWNhbExpbWl0U3RhdGVzW3hdID0gKGNvdW50ID4gbGltaXQpID8gR3JpZENlbGxTdGF0ZS5PdmVyQ2FwYWNpdHkgOiAoY291bnQgPT09IGxpbWl0KSA/IEdyaWRDZWxsU3RhdGUuRnVsbCA6IEdyaWRDZWxsU3RhdGUuRnJlZTtcbiAgICAgICAgaWYgKGNvdW50ID49IGxpbWl0KSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSAoY291bnQgPiBsaW1pdCkgPyBHcmlkQ2VsbFN0YXRlLk92ZXJDYXBhY2l0eSA6IEdyaWRDZWxsU3RhdGUuRnVsbDtcbiAgICAgICAgICAgIGZvciAodmFyIHkgPSAwOyB5IDwgNzsgeSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGdhbWVTdGF0ZS5ncmlkT2NjdXBhdGlvblt5XVt4XSAhPT0gR3JpZENlbGxTdGF0ZS5PdmVyQ2FwYWNpdHkpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2FtZVN0YXRlLmdyaWRPY2N1cGF0aW9uW3ldW3hdID0gc3RhdGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAodmFyIHkgPSAwOyB5IDwgNzsgeSsrKSB7XG4gICAgICAgIHZhciBjb3VudCA9IDA7XG4gICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgNjsgeCsrKSB7XG4gICAgICAgICAgICBpZiAodGlsZUJpdG1hcE9uQ2VsbFt5XVt4XSAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxpbWl0ID0gaG9yaXpvbnRhbExpbWl0c1t5XTtcbiAgICAgICAgaWYgKGxpbWl0IDwgMCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZ2FtZVN0YXRlLmhvcml6b250YWxMaW1pdFN0YXRlc1t5XSA9IChjb3VudCA+IGxpbWl0KSA/IEdyaWRDZWxsU3RhdGUuT3ZlckNhcGFjaXR5IDogKGNvdW50ID09PSBsaW1pdCkgPyBHcmlkQ2VsbFN0YXRlLkZ1bGwgOiBHcmlkQ2VsbFN0YXRlLkZyZWU7XG4gICAgICAgIGlmIChjb3VudCA+PSBsaW1pdCkge1xuICAgICAgICAgICAgdmFyIHN0YXRlID0gKGNvdW50ID4gbGltaXQpID8gR3JpZENlbGxTdGF0ZS5PdmVyQ2FwYWNpdHkgOiBHcmlkQ2VsbFN0YXRlLkZ1bGw7XG4gICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IDY7IHgrKykge1xuICAgICAgICAgICAgICAgIGlmIChnYW1lU3RhdGUuZ3JpZE9jY3VwYXRpb25beV1beF0gIT09IEdyaWRDZWxsU3RhdGUuT3ZlckNhcGFjaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgIGdhbWVTdGF0ZS5ncmlkT2NjdXBhdGlvblt5XVt4XSA9IHN0YXRlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGdhbWVMb29wKCkge1xuICAgIHZhciBiZWZvcmVUaW1lTXMgPSBEYXRlLm5vdygpO1xuICAgIHVwZGF0ZUdyaWRDZWxsT2NjdXBhdGlvbigpO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gKHQpIHsgcmVkcmF3KCk7IH0pO1xuICAgIHZhciBlbGFwc2VkVGltZU1zID0gRGF0ZS5ub3coKSAtIGJlZm9yZVRpbWVNcztcbiAgICB2YXIgdGFyZ2V0RnBzID0gMzA7XG4gICAgdmFyIHRhcmdldEZyYW1lVGltZU1zID0gMTAwMCAvIHRhcmdldEZwcztcbiAgICB2YXIgZGVsYXlNcyA9IE1hdGgubWF4KDAsIHRhcmdldEZyYW1lVGltZU1zIC0gZWxhcHNlZFRpbWVNcyk7XG4gICAgc2V0VGltZW91dChnYW1lTG9vcCwgZGVsYXlNcyk7XG59XG5nYW1lTG9vcCgpO1xuZnVuY3Rpb24gdGV0cmFtaW5vQ29udGFpbnNQb2ludCh0aWxlSW5kZXgsIHBvc2l0aW9uKSB7XG4gICAgdmFyIHRpbGVTdGF0ZSA9IGdhbWVTdGF0ZS50aWxlU3RhdGVzW3RpbGVJbmRleF07XG4gICAgdmFyIHNoYXBlID0gdGlsZVNoYXBlc1t0aWxlSW5kZXhdO1xuICAgIGZvciAodmFyIF9pID0gMCwgc2hhcGVfMiA9IHNoYXBlOyBfaSA8IHNoYXBlXzIubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBsb2NhbFNxdWFyZUNlbnRlciA9IHNoYXBlXzJbX2ldO1xuICAgICAgICBsb2NhbFNxdWFyZUNlbnRlciA9IGxvY2FsU3F1YXJlQ2VudGVyLmNvcHkoKTtcbiAgICAgICAgLy8gQXBwbHkgdHJhbnNmb3JtYXRpb25zIHJlbGF0aXZlIHRvIHRpbGUgY2VudGVyLlxuICAgICAgICB2YXIgcm90YXRpb24gPSB0aWxlU3RhdGUucm90YXRpb24gJSA0O1xuICAgICAgICBmb3IgKHZhciByID0gMDsgciA8IHJvdGF0aW9uOyByKyspIHtcbiAgICAgICAgICAgIHZhciB0bXBYID0gbG9jYWxTcXVhcmVDZW50ZXIueDtcbiAgICAgICAgICAgIGxvY2FsU3F1YXJlQ2VudGVyLnggPSAtbG9jYWxTcXVhcmVDZW50ZXIueTtcbiAgICAgICAgICAgIGxvY2FsU3F1YXJlQ2VudGVyLnkgPSB0bXBYO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aWxlU3RhdGUuZmxpcHBlZCkge1xuICAgICAgICAgICAgbG9jYWxTcXVhcmVDZW50ZXIueSA9IC1sb2NhbFNxdWFyZUNlbnRlci55O1xuICAgICAgICB9XG4gICAgICAgIHZhciBzcXVhcmVDZW50ZXIgPSB0aWxlU3RhdGUucG9zaXRpb24uYWRkKGxvY2FsU3F1YXJlQ2VudGVyKTtcbiAgICAgICAgdmFyIGxvY2FsUG9pbnQgPSBwb3NpdGlvbi5zdWIoc3F1YXJlQ2VudGVyKTtcbiAgICAgICAgaWYgKGxvY2FsUG9pbnQueCA+PSAtMC41ICYmIGxvY2FsUG9pbnQueCA8IDAuNSAmJlxuICAgICAgICAgICAgbG9jYWxQb2ludC55ID49IC0wLjUgJiYgbG9jYWxQb2ludC55IDwgMC41KSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBjb25zb2xlLmxvZyhcIk1vdXNlIGRvd24gYXQgKFwiLmNvbmNhdChldmVudC5vZmZzZXRYLCBcIiwgXCIpLmNvbmNhdChldmVudC5vZmZzZXRZLCBcIilcIikpO1xuICAgIGlmIChnYW1lU3RhdGUubW91c2VMb2NrICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gQWxyZWFkeSBob2xkaW5nIGEgdGlsZS5cbiAgICAgICAgY29uc29sZS5lcnJvcihcIkFscmVhZHkgaG9sZGluZyBhIHRpbGUsIGlnbm9yaW5nIG1vdXNlIGRvd24uXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIElmIHRoZSBtb3VzZSBpcyBvdmVyIGEgdGlsZSwgbG9jayBpdCB0byB0aGUgbW91c2UgcG9zaXRpb24uXG4gICAgdmFyIG1vdXNlUG9zaXRpb24gPSBuZXcgUG9pbnQoZGVzY2FsZShldmVudC5vZmZzZXRYKSwgZGVzY2FsZShldmVudC5vZmZzZXRZKSk7XG4gICAgdmFyIHNlbGVjdGVkVGlsZSA9IHVuZGVmaW5lZDtcbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gZ2FtZVN0YXRlLnpCdWZmZXI7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciB0aWxlSW5kZXggPSBfYVtfaV07XG4gICAgICAgIGlmICh0ZXRyYW1pbm9Db250YWluc1BvaW50KHRpbGVJbmRleCwgbW91c2VQb3NpdGlvbikpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkVGlsZSA9IHRpbGVJbmRleDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChzZWxlY3RlZFRpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFVwZGF0ZSBtb3VzZSBsb2NrIHN0YXRlIGFuZCB6LWJ1ZmZlci5cbiAgICBnYW1lU3RhdGUubW91c2VMb2NrID0ge1xuICAgICAgICB0aWxlT2Zmc2V0OiBnYW1lU3RhdGUudGlsZVN0YXRlc1tzZWxlY3RlZFRpbGVdLnBvc2l0aW9uLnN1Yihtb3VzZVBvc2l0aW9uKSxcbiAgICAgICAgdGlsZUluZGV4OiBzZWxlY3RlZFRpbGUsXG4gICAgfTtcbiAgICB2YXIgdG1wID0gZ2FtZVN0YXRlLnpCdWZmZXJbMF07XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlICh0bXAgIT09IHNlbGVjdGVkVGlsZSkge1xuICAgICAgICAvLyBCdWJibGUgdXAgdGhlIHNlbGVjdGVkIHRpbGUgaW4gdGhlIHotYnVmZmVyLlxuICAgICAgICB2YXIgdG1wMiA9IGdhbWVTdGF0ZS56QnVmZmVyW2kgKyAxXTtcbiAgICAgICAgZ2FtZVN0YXRlLnpCdWZmZXJbaSArIDFdID0gdG1wO1xuICAgICAgICB0bXAgPSB0bXAyO1xuICAgICAgICBpKys7XG4gICAgfVxuICAgIGdhbWVTdGF0ZS56QnVmZmVyWzBdID0gc2VsZWN0ZWRUaWxlO1xuICAgIGNvbnNvbGUubG9nKFwiTG9ja2VkIHRpbGUgXCIuY29uY2F0KHNlbGVjdGVkVGlsZSwgXCIgdG8gbW91c2UuXCIpKTtcbn0pO1xuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIGNvbnNvbGUubG9nKFwiTW91c2UgdXAgYXQgKFwiLmNvbmNhdChldmVudC5vZmZzZXRYLCBcIiwgXCIpLmNvbmNhdChldmVudC5vZmZzZXRZLCBcIilcIikpO1xuICAgIGlmIChnYW1lU3RhdGUubW91c2VMb2NrICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gQ2xlYXIgdGhlIGhlbGQgdGlsZS5cbiAgICAgICAgY29uc29sZS5sb2coXCJDbGVhcmluZyBoZWxkIHRpbGUuXCIpO1xuICAgICAgICBnYW1lU3RhdGUubW91c2VMb2NrID0gdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm47XG4gICAgfVxufSk7XG5jYW52YXMuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBpZiAoZ2FtZVN0YXRlLm1vdXNlTG9jayA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIE5vdCBob2xkaW5nIGEgdGlsZS4gTm8gYWN0aW9uIG5lY2Vzc2FyeS5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgdGhlIGhlbGQgdGlsZSBwb3NpdGlvbi5cbiAgICB2YXIgbW91c2VQb3NpdGlvbiA9IG5ldyBQb2ludChkZXNjYWxlKGV2ZW50Lm9mZnNldFgpLCBkZXNjYWxlKGV2ZW50Lm9mZnNldFkpKTtcbiAgICB2YXIgdGlsZUluZGV4ID0gZ2FtZVN0YXRlLm1vdXNlTG9jay50aWxlSW5kZXg7XG4gICAgdmFyIHRpbGVTdGF0ZSA9IGdhbWVTdGF0ZS50aWxlU3RhdGVzW3RpbGVJbmRleF07XG4gICAgdGlsZVN0YXRlLnBvc2l0aW9uID0gbW91c2VQb3NpdGlvbi5hZGQoZ2FtZVN0YXRlLm1vdXNlTG9jay50aWxlT2Zmc2V0KTtcbn0pO1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIGlmIChnYW1lU3RhdGUubW91c2VMb2NrID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gTm90IGhvbGRpbmcgYSB0aWxlLiBObyBhY3Rpb24gbmVjZXNzYXJ5LlxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFwiS2V5IGRvd24gZHVyaW5nIG1vdXNlIGxvY2s6ICdcIi5jb25jYXQoZXZlbnQua2V5LCBcIidcIikpO1xuICAgIGlmIChldmVudC5yZXBlYXQpIHtcbiAgICAgICAgLy8gSWdub3JlIHJlcGVhdCBrZXkgZXZlbnRzIGR1ZSB0byBob2xkaW5nIHRoZSBrZXkuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGtleSA9IGV2ZW50LmtleTtcbiAgICBpZiAoa2V5ICE9PSBcInJcIiAmJiBrZXkgIT09IFwiZlwiKSB7XG4gICAgICAgIC8vIE5vdCBhIHRyYW5zZm9ybWF0aW9uIGtleS5cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBVcGRhdGUgdGhlIGhlbGQgdGlsZSB0cmFuc2Zvcm1hdGlvbnMuXG4gICAgdmFyIHRpbGVJbmRleCA9IGdhbWVTdGF0ZS5tb3VzZUxvY2sudGlsZUluZGV4O1xuICAgIHZhciB0aWxlU3RhdGUgPSBnYW1lU3RhdGUudGlsZVN0YXRlc1t0aWxlSW5kZXhdO1xuICAgIGlmIChrZXkgPT09IFwiclwiKSB7XG4gICAgICAgIHRpbGVTdGF0ZS5yb3RhdGlvbiA9ICh0aWxlU3RhdGUucm90YXRpb24gKyAxKSAlIDQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmXCIpIHtcbiAgICAgICAgdGlsZVN0YXRlLmZsaXBwZWQgPSAhdGlsZVN0YXRlLmZsaXBwZWQ7XG4gICAgfVxufSk7XG5zZXRMaW1pdHNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciByb3dMaW1pdEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicm93LWxpbWl0c1wiKTtcbiAgICB2YXIgY29sTGltaXRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNvbC1saW1pdHNcIik7XG4gICAgdmFyIHJvd0xpbWl0U3RyaW5nID0gcm93TGltaXRCdXR0b24udmFsdWU7XG4gICAgdmFyIGNvbExpbWl0U3RyaW5nID0gY29sTGltaXRCdXR0b24udmFsdWU7XG4gICAgaWYgKHJvd0xpbWl0U3RyaW5nLmxlbmd0aCAhPT0gNyB8fCBjb2xMaW1pdFN0cmluZy5sZW5ndGggIT09IDYpIHtcbiAgICAgICAgYWxlcnQoXCJSb3cgbGltaXRzIG11c3QgYmUgNyBjaGFyYWN0ZXJzIGFuZCBjb2x1bW4gbGltaXRzIG11c3QgYmUgNiBjaGFyYWN0ZXJzLlwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDc7IGkrKykge1xuICAgICAgICB2YXIgY2hhciA9IHJvd0xpbWl0U3RyaW5nLmNoYXJBdChpKTtcbiAgICAgICAgdmFyIGxpbWl0ID0gcGFyc2VJbnQoY2hhcik7XG4gICAgICAgIGlmIChpc05hTihsaW1pdCkpIHtcbiAgICAgICAgICAgIGhvcml6b250YWxMaW1pdHNbaV0gPSAtMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGhvcml6b250YWxMaW1pdHNbaV0gPSBsaW1pdDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDY7IGkrKykge1xuICAgICAgICB2YXIgY2hhciA9IGNvbExpbWl0U3RyaW5nLmNoYXJBdChpKTtcbiAgICAgICAgdmFyIGxpbWl0ID0gcGFyc2VJbnQoY2hhcik7XG4gICAgICAgIGlmIChpc05hTihsaW1pdCkpIHtcbiAgICAgICAgICAgIHZlcnRpY2FsTGltaXRzW2ldID0gLTE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2ZXJ0aWNhbExpbWl0c1tpXSA9IGxpbWl0O1xuICAgICAgICB9XG4gICAgfVxufSk7XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9