
// If live debugging is needed: https://code.visualstudio.com/docs/typescript/typescript-tutorial#_debugging

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const setLimitsButton = document.getElementById("set-limits-button") as HTMLButtonElement;

class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    copy(): Point {
        return new Point(this.x, this.y);
    }

    add(other: Point): Point {
        return new Point(this.x + other.x, this.y + other.y);
    }

    sub(other: Point): Point {
        return new Point(this.x - other.x, this.y - other.y);
    }
}

class TileState {
    position: Point;
    flipped: boolean;
    rotation: number;  // 0-3 representing 0, 90, 180, 270 degrees.
}

class MouseLock {
    tileOffset: Point;  // Offset from mouse position to tile position.
    tileIndex: number;  // Index of the tile held by the mouse.
}

enum GridCellState {
    Free,
    Full,
    OverCapacity,
}

class GameState {
    zBuffer: number[];
    tileStates: TileState[];
    gridOccupation: GridCellState[][];
    horizontalLimitStates: GridCellState[];
    verticalLimitStates: GridCellState[];
    mouseLock: MouseLock | undefined;  // Present if the mouse is holding a tile.
}

// For each tile, a list of 4 center points of the squares that make up the tile.
let tileShapes: Point[][] = [
    [new Point(-1, 0), new Point(0, 0), new Point(1, 0), new Point(0, 1)],                     // T
    [new Point(-0.5, -0.5), new Point(0.5, -0.5), new Point(0.5, 0.5), new Point(-0.5, 0.5)],  // O
    [new Point(0, -1.5), new Point(0, -0.5), new Point(0, 0.5), new Point(0, 1.5)],            // I
    [new Point(-0.5, -1.5), new Point(-0.5, -0.5), new Point(-0.5, 0.5), new Point(0.5, 0.5)], // L
    [new Point(-0.5, -1), new Point(-0.5, 0), new Point(0.5, 0), new Point(0.5, 1)],           // S
];
let tileColors: string[] = [
    "#8C6B37",  // T
    "#3B603C",  // O
    "#8C3750",  // I
    "#813130",  // L
    "#47516A",  // S
];
let verticalLimits: number[] = [-1, -1, 3, 3, -1, 2];
let horizontalLimits: number[] = [2, -1, 2, -1, 1, -1, -1];

let gameState: GameState = {
    zBuffer: [0, 1, 2, 3, 4],
    tileStates: [
        { position: new Point(10, 2), flipped: false, rotation: 0 },
        { position: new Point(10, 6), flipped: false, rotation: 0 },
        { position: new Point(12, 6), flipped: false, rotation: 0 },
        { position: new Point(10, 10), flipped: false, rotation: 0 },
        { position: new Point(13, 11), flipped: false, rotation: 0 },
    ],
    gridOccupation: Array(7).fill(0).map(() => Array(6).fill(GridCellState.Free)),
    verticalLimitStates: Array(6).fill(GridCellState.Free),
    horizontalLimitStates: Array(7).fill(GridCellState.Free),
    mouseLock: undefined,
};


const scale = (v: number) => v * 50;
const descale = (v: number) => v / 50;

function redraw() {
    // Placeholder for future rendering code.
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Could not get 2D context");
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx, horizontalLimits, verticalLimits, gameState.gridOccupation, scale);

    drawTetrominoes(ctx, scale);
}

function drawGrid(ctx: CanvasRenderingContext2D, horizontalLimits: number[], verticalLimits: number[], gridOccupation: GridCellState[][], scale: (coordinate: number) => number) {

    // Shade occupied grid cells.
    for (let x = 0; x < 6; x++) {
        for (let y = 0; y < 7; y++) {
            const occupation = gridOccupation[y][x];
            if (occupation === GridCellState.Free) {
                ctx.fillStyle = "lightgray";
            } else if (occupation === GridCellState.Full) {
                ctx.fillStyle = "#808080";
            } else if (occupation === GridCellState.OverCapacity) {
                ctx.fillStyle = "red";
            }
            ctx.fillRect(scale(1 + x), scale(2 + y), scale(1), scale(1));
        }
    }

    // Draw the grid lines.

    // Grid starts at 1, 2 and ends at 7, 9.
    for (let x = 1; x <= 7; x++) {
        ctx.strokeRect(scale(x), scale(2), 0.1, scale(7));
    }
    for (let y = 2; y <= 9; y++) {
        ctx.strokeRect(scale(1), scale(y), scale(6), 0.1);
    }

    // Draw the hints.

    ctx.font = "30px Courier New";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Hints go along the horizontal (1,1) -> (7,1) (top row)
    // and the vertical (7, 2) -> (7,9) (right column).

    function getFillStyle(state: GridCellState): string {
        if (state === GridCellState.Free) {
            return "red";
        } else if (state === GridCellState.Full) {
            return "darkgreen";
        } else if (state === GridCellState.OverCapacity) {
            return "red";
        }
        return "black";
    }

    for (let x = 0; x < 6; x++) {
        ctx.fillStyle = getFillStyle(gameState.verticalLimitStates[x]);
        const limit = verticalLimits[x];
        if (limit >= 0) {
            ctx.fillText(`${limit}`, scale(1 + x + 0.5), scale(1 + 0.5));
        }
    }
    for (let y = 0; y < 7; y++) {
        ctx.fillStyle = getFillStyle(gameState.horizontalLimitStates[y]);
        const limit = horizontalLimits[y];
        if (limit >= 0) {
            ctx.fillText(`${limit}`, scale(7 + 0.5), scale(2 + y + 0.5));
        }
    }
}

function drawTetrominoes(ctx: CanvasRenderingContext2D, scale: (number) => number) {
    for (let tileIndex of gameState.zBuffer.slice().reverse()) {
        const tileState = gameState.tileStates[tileIndex];
        const shape = tileShapes[tileIndex];
        for (let localSquareCenter of shape) {
            localSquareCenter = localSquareCenter.copy();
            // Apply transformations relative to tile center.
            const rotation = tileState.rotation % 4;
            for (let r = 0; r < rotation; r++) {
                const tmpX = localSquareCenter.x;
                localSquareCenter.x = -localSquareCenter.y;
                localSquareCenter.y = tmpX;
            }
            if (tileState.flipped) {
                localSquareCenter.y = -localSquareCenter.y;
            }

            // Translate and draw.
            const squareCenter = tileState.position.add(localSquareCenter);
            ctx.fillStyle = tileColors[tileIndex];
            ctx.globalAlpha = 0.8;
            ctx.fillRect(
                scale(squareCenter.x - 0.5),
                scale(squareCenter.y - 0.5),
                scale(1),
                scale(1));
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = "black";
            ctx.strokeRect(
                scale(squareCenter.x - 0.5),
                scale(squareCenter.y - 0.5),
                scale(1),
                scale(1));
        }
    }
}

function sumOfBits(n: number): number {
    let count = 0;
    while (n > 0) {
        count += n & 1;
        n >>= 1;
    }
    return count;
}

function updateGridCellOccupation() {
    // Boolean indicator for whether a tile is present.
    let tileBitmapOnCell = Array(7).fill(0).map(() => Array(6).fill(0));

    // Recalculate occupation based on tiles.
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 6; x++) {
            for (let tileIndex = 0; tileIndex < gameState.zBuffer.length; tileIndex++) {
                if (tetraminoContainsPoint(tileIndex, new Point(1 + x + 0.5, 2 + y + 0.5))) {
                    tileBitmapOnCell[y][x] += (1 << tileIndex);
                }
            }
        }
    }

    // Reset occupation.
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 6; x++) {
            gameState.gridOccupation[y][x] = GridCellState.Free;
        }
    }

    // Recalculate occupation based on tiles.
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 6; x++) {
            const bitSum = sumOfBits(tileBitmapOnCell[y][x]);
            if (bitSum > 1) {
                gameState.gridOccupation[y][x] = GridCellState.OverCapacity;
            }
            if (bitSum >= 1) {
                gameState.gridOccupation[y][x] = gameState.gridOccupation[y][x] === GridCellState.OverCapacity ? GridCellState.OverCapacity : GridCellState.Full;
                // Mark all adjacent (incl diagonal) cells as adjacent to a tile.
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (Math.abs(dx) + Math.abs(dy) !== 1) {
                            continue;
                        }
                        const nx = x + dx;
                        const ny = y + dy;
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
    for (let x = 0; x < 6; x++) {
        let count = 0;
        for (let y = 0; y < 7; y++) {
            if (tileBitmapOnCell[y][x] !== 0) {
                count++;
            }
        }
        const limit = verticalLimits[x];
        if (limit < 0) { continue; }
        gameState.verticalLimitStates[x] = (count > limit) ? GridCellState.OverCapacity : (count === limit) ? GridCellState.Full : GridCellState.Free;
        if (count >= limit) {
            const state = (count > limit) ? GridCellState.OverCapacity : GridCellState.Full;
            for (let y = 0; y < 7; y++) {
                if (gameState.gridOccupation[y][x] !== GridCellState.OverCapacity) {
                    gameState.gridOccupation[y][x] = state;
                }
            }
        }
    }
    for (let y = 0; y < 7; y++) {
        let count = 0;
        for (let x = 0; x < 6; x++) {
            if (tileBitmapOnCell[y][x] !== 0) {
                count++;
            }
        }
        const limit = horizontalLimits[y];
        if (limit < 0) { continue; }
        gameState.horizontalLimitStates[y] = (count > limit) ? GridCellState.OverCapacity : (count === limit) ? GridCellState.Full : GridCellState.Free;
        if (count >= limit) {
            const state = (count > limit) ? GridCellState.OverCapacity : GridCellState.Full;
            for (let x = 0; x < 6; x++) {
                if (gameState.gridOccupation[y][x] !== GridCellState.OverCapacity) {
                    gameState.gridOccupation[y][x] = state;
                }
            }
        }
    }
}

function gameLoop() {
    const beforeTimeMs = Date.now();
    updateGridCellOccupation();
    window.requestAnimationFrame((t) => { redraw(); });
    const elapsedTimeMs = Date.now() - beforeTimeMs;
    const targetFps = 30;
    const targetFrameTimeMs = 1000 / targetFps;
    const delayMs = Math.max(0, targetFrameTimeMs - elapsedTimeMs);
    setTimeout(gameLoop, delayMs);
}

gameLoop();







function tetraminoContainsPoint(tileIndex: number, position: Point): boolean {
    const tileState = gameState.tileStates[tileIndex];
    const shape = tileShapes[tileIndex];
    for (let localSquareCenter of shape) {
        localSquareCenter = localSquareCenter.copy();
        // Apply transformations relative to tile center.
        const rotation = tileState.rotation % 4;
        for (let r = 0; r < rotation; r++) {
            const tmpX = localSquareCenter.x;
            localSquareCenter.x = -localSquareCenter.y;
            localSquareCenter.y = tmpX;
        }
        if (tileState.flipped) {
            localSquareCenter.y = -localSquareCenter.y;
        }
        const squareCenter = tileState.position.add(localSquareCenter);
        const localPoint = position.sub(squareCenter);
        if (localPoint.x >= -0.5 && localPoint.x < 0.5 &&
            localPoint.y >= -0.5 && localPoint.y < 0.5) {
            return true;
        }
    }
    return false;
}







canvas.addEventListener("mousedown", (event) => {
    console.log(`Mouse down at (${event.offsetX}, ${event.offsetY})`);

    if (gameState.mouseLock !== undefined) {
        // Already holding a tile.
        console.error("Already holding a tile, ignoring mouse down.");
        return;
    }

    // If the mouse is over a tile, lock it to the mouse position.
    const mousePosition = new Point(descale(event.offsetX), descale(event.offsetY));
    let selectedTile: number | undefined = undefined;
    for (let tileIndex of gameState.zBuffer) {
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
    let tmp = gameState.zBuffer[0];
    let i = 0;
    while (tmp !== selectedTile) {
        // Bubble up the selected tile in the z-buffer.
        const tmp2 = gameState.zBuffer[i + 1];
        gameState.zBuffer[i + 1] = tmp;
        tmp = tmp2;
        i++;
    }
    gameState.zBuffer[0] = selectedTile;
    console.log(`Locked tile ${selectedTile} to mouse.`);
});

canvas.addEventListener("mouseup", (event) => {
    console.log(`Mouse up at (${event.offsetX}, ${event.offsetY})`);

    if (gameState.mouseLock !== undefined) {
        // Clear the held tile.
        console.log("Clearing held tile.");
        gameState.mouseLock = undefined;
        return;
    }
});

canvas.addEventListener("mousemove", (event) => {
    if (gameState.mouseLock === undefined) {
        // Not holding a tile. No action necessary.
        return;
    }

    // Update the held tile position.
    const mousePosition = new Point(descale(event.offsetX), descale(event.offsetY));
    const tileIndex = gameState.mouseLock.tileIndex;
    const tileState = gameState.tileStates[tileIndex];
    tileState.position = mousePosition.add(gameState.mouseLock.tileOffset);
});

window.addEventListener("keydown", (event) => {
    if (gameState.mouseLock === undefined) {
        // Not holding a tile. No action necessary.
        return;
    }
    console.log(`Key down during mouse lock: '${event.key}'`);

    if (event.repeat) {
        // Ignore repeat key events due to holding the key.
        return;
    }

    const key = event.key;
    if (key !== "r" && key !== "f") {
        // Not a transformation key.
        return;
    }

    // Update the held tile transformations.
    const tileIndex = gameState.mouseLock.tileIndex;
    const tileState = gameState.tileStates[tileIndex];
    if (key === "r") {
        tileState.rotation = (tileState.rotation + 1) % 4;
    } else if (key === "f") {
        tileState.flipped = !tileState.flipped;
    }
});

setLimitsButton.addEventListener("click", (event) => {
    const rowLimitButton = document.getElementById("row-limits") as HTMLInputElement;
    const colLimitButton = document.getElementById("col-limits") as HTMLInputElement;
    const rowLimitString = rowLimitButton.value;
    const colLimitString = colLimitButton.value;
    if (rowLimitString.length !== 7 || colLimitString.length !== 6) {
        alert("Row limits must be 7 characters and column limits must be 6 characters.");
        return;
    }
    for (let i = 0; i < 7; i++) {
        const char = rowLimitString.charAt(i);
        const limit = parseInt(char);
        if (isNaN(limit)) {
            horizontalLimits[i] = -1;
        } else {
            horizontalLimits[i] = limit;
        }
    }
    for (let i = 0; i < 6; i++) {
        const char = colLimitString.charAt(i);
        const limit = parseInt(char);
        if (isNaN(limit)) {
            verticalLimits[i] = -1;
        } else {
            verticalLimits[i] = limit;
        }
    }
});
