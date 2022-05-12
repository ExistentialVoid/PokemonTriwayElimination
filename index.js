const board = document.getElementById('gameCanvas');
const c = board.getContext('2d');
const overlay = document.getElementById('overlay');
const oc = overlay.getContext('2d');
const backdrop = document.getElementById('backdrop');
const bc = overlay.getContext('2d');

board.width = 1440;
board.height = 860;
overlay.width = board.width;
overlay.height = board.height;
backdrop.width = board.width;
backdrop.height = board.height;

oc.fillStyle = 'transparent';
oc.fillRect(0,0, overlay.width, overlay.height);

c.fillRect(0, 0, board.width, board.height);

let gravity = {x: 0.5, y: 0.5};
let selectedTile = null;
let tiles = new Array(0);

const gameboard = {
    colCnt: 16,
    rowCnt: 10,
    imgPairs: 4,
    padding: 60,
    pendingConnectionPathPoints: null,
    remainingSeconds: 0,
    stageNo: 0,
    _startingSeconds: 600,

    addPointToPendingConnection(row, column) {
        this.pendingConnectionPathPoints.push(this.getLocationCenterPoint(row, column));
    },
    async advanceStage() {
        this.stageNo++;

        // create total num of tiles with randomly assigned images
        tiles = [];
        let imgs = this.prepareImgs();

        for (let r = 0; r < this.rowCnt; r++) {
            for (let c = 0; c < this.colCnt; c++) {
                let rand = parseInt(Math.random() * imgs.length);
                tiles.push(new Tile({
                    img: imgs.splice(rand, 1),
                    position: this.convertPosition(r, c),
                    size: {
                        x: (board.width - 2 * this.padding) / this.colCnt,
                        y: (board.height - 2 * this.padding) / this.rowCnt
                    }
                }));
            }
        }

        // reset time
        this.remainingSeconds = this._startingSeconds;
        await delay(250);
        drawAnimation(0);
    },
    canPairAny() {
        if (!tiles.length) return false;
        
        let consideredImgs = new Array(0);
    
        for (let t = 0; t < tiles.length; t++) {
            const url = tiles[t].img.src.toString()
            if (consideredImgs.some(img => img === url)) continue;
    
            consideredImgs.push(url);
            const similarTiles = tiles.filter(tile => tile.img.src.toString() === url);
            for (let i = 0; i < similarTiles.length - 1; i++) {
                for (let j = i + 1; j < similarTiles.length; j++) {
                    if (similarTiles[i].canPairWith(similarTiles[j])) {
                        return true; 
                    }
                }
            }
        }

        alert('no more pairs')
        return false;
    },
    convertPosition(row, col) {
        const x = this.padding + (board.width - 2 * this.padding) / this.colCnt * col;
        const y = this.padding + (board.height - 2 * this.padding) / this.rowCnt * row;
        return {x: x, y: y};
    },
    countAboveTiles(tile) {
        return tiles
        .filter(t => 
            t.position.x === tile.position.x && t.position.y < tile.position.y
        ).length;
    },
    countBelowTiles(tile) {
        return tiles
        .filter(t => 
            t.position.x === tile.position.x && t.position.y > tile.position.y
        ).length;
    },
    countTilesToLeft(tile) {
        return tiles
        .filter(t => 
            t.position.y === tile.position.y && t.position.x < tile.position.x
        ).length;
    },
    countTilesToRight(tile) {
        return tiles
        .filter(t => 
            t.position.y === tile.position.y && t.position.x > tile.position.x
        ).length;
    },
    async drawConnection() {
        if (!this.pendingConnectionPathPoints) return;

        oc.strokeStyle = 'deepskyblue';
        oc.lineWidth = 10;

        oc.beginPath();
        oc.moveTo(this.pendingConnectionPathPoints[0].x, this.pendingConnectionPathPoints[0].y);
        for (let p = 1; p < this.pendingConnectionPathPoints.length; p++) {
            oc.lineTo(this.pendingConnectionPathPoints[p].x, this.pendingConnectionPathPoints[p].y);
        }
        oc.stroke();

        await delay(1600);

        oc.clearRect(0,0, board.width, board.height);
    },
    getTileAbove(row, column) {
        const aboveTiles = tiles.filter(t => t.col() === column && t.row() < row);
        if (!aboveTiles.length) return null;

        aboveTiles.sort((tile1, tile2) => {
            if (tile1.position.y > tile2.position.y) {
                return -1;
            } else if (tile1.position.y < tile2.position.y) {
                return 1;
            } else {
                return 0;
            }
        });
        return aboveTiles[0];
    },
    getTileBelow(row, column) {
        const belowTiles = tiles.filter(t => t.col() === column && t.row() > row);
        if (!belowTiles.length) return null;

        belowTiles.sort((tile1, tile2) => {
            if (tile1.position.y < tile2.position.y) {
                return -1;
            } else if (tile1.position.y > tile2.position.y) {
                return 1;
            } else {
                return 0;
            }
        });
        return belowTiles[0];
    },
    getLocationCenterPoint(row, column) {
        // row = -1, column = -1, row = rowCnt, column = colCnt represent margin area
        const tileSize = {x: tiles[0].width, y: tiles[0].height};
        let x;
        let y;
        if (row < 0) {
            y = 2;
        } else if (row >= gameboard.rowCnt) {
            y = board.height - 2;
        }
        else {
            y = gameboard.convertPosition(row, 0).y + tileSize.y / 2;
        }

        if (column < 0) {
            x = 2;
        } else if (column >= gameboard.colCnt) {
            x = board.width - 2;
        }
        else {
            x = gameboard.convertPosition(0, column).x + tileSize.x / 2;
        }

        return {x: x, y: y};
    },
    getTileToLeft(row, column) {
        const leftTiles = tiles.filter(t => t.row() === row && t.col() < column);
        if (!leftTiles.length) return null;

        leftTiles.sort((tile1, tile2) => {
            if (tile1.position.x > tile2.position.x) {
                return -1;
            } else if (tile1.position.x < tile2.position.x) {
                return 1;
            } else {
                return 0;
            }
        });
        
        return leftTiles[0];
    },
    getTileToRight(row, column) {
        const rightTiles = tiles.filter(t => t.row() === row && t.col() > column);
        if (!rightTiles.length) return null;

        rightTiles.sort((tile1, tile2) => {
            if (tile1.position.x < tile2.position.x) {
                return -1;
            } else if (tile1.position.x > tile2.position.x) {
                return 1;
            } else {
                return 0;
            }
        });
        
        return rightTiles[0];
    },
    horizontalPathIsClear(col1, col2, row) {
        const c1 = Math.min(col1, col2);
        const c2 = Math.max(col1, col2);

        const obstructingTiles = tiles.filter(t => t.row() === row && t.col() >= c1 && t.col() <= c2);
        return !obstructingTiles.length;
    },
    imgCount() {
        return this.colCnt * this.rowCnt / this.imgPairs;
    },
    onClick(ev) {
        if (!ev) ev = window.event;

        let tile = tiles.find(t => 
            t.position.x <= ev.clientX && 
            t.position.x + t.width >= ev.clientX &&
            t.position.y <= ev.clientY &&
            t.position.y + t.height >= ev.clientY
        );
        if (tile) {
            tile.click();
            if (!tiles.find(t => t === tile)) tile = null;
        }
    },
    prepareImgs() {
        // return an order list of images by index
        let imgs = [];
        for (let i = 0; i < this.imgCount(); i++) {
            for (let j = 0; j < this.imgPairs; j++) {
                imgs.push(`./Images/${imageURLs[i]}`);
            }
        }
        return imgs;
    },
    proportionalTime() {
        return this.remainingSeconds / this._startingSeconds;
    },
    proportionalTimeGain() {
        // Gain between 1 and 5 seconds is linearly proportional to remaining time
        return 4 * this.proportionalTime() + 1;
    },
    rearrange() {
        // Save the current tile locations
        // Save the current tile indexes
        let unmatchedImgs = new Array(0);
        do
        {
            for (let t = 0; t < tiles.length; t++) {
                unmatchedImgs.push(tiles[t].img.src.toString());
            }
            for (let t = 0; t < tiles.length; t++) {
                const rand = parseInt(Math.random() * unmatchedImgs.length);
                const url = unmatchedImgs.splice(rand, 1);
                tiles[t].img.src = url;
            }
        } while (!this.canPairAny())
        tiles.forEach(t => t.draw());
    },
    reset() {
        this.advanceStage();
        this.stageNo = 1;
    },
    revertPosition(position) {
        const c = (position.x - this.padding) * this.colCnt / (board.width - 2 * this.padding);
        const r = (position.y - this.padding) * this.rowCnt / (board.height - 2 * this.padding);
        return {r: Math.round(r), c: Math.round(c)};
    },
    verticalPathIsClear(row1, row2, col) {
        const r1 = Math.min(row1, row2);
        const r2 = Math.max(row1, row2);

        const obstructingTiles = tiles.filter(t => t.col() === col && t.row() >= r1 && t.row() <= r2);
        return !obstructingTiles.length;
    }
}
const stageMechanics = {
    /*  Stage     Flow           Pairs    Inject pair    Swap tiles
        1         None           2        false          false
        2         down           2        false          false
        3         left           2        false          false
        4         origin         2        false          false
        5         None           2        false          false
        6         down           2        false          false
        7         right          2        false          false
        8         origin         2        false          false
        9         None           2        false          false
        10        up             2        false          false
        11        left           2        false          false
        12        origin         2        false          false
        13        None           1        false          false
        14        up             1        false          false
        15        right          1        false          false
        16        boundary       1        false          false
        17        None           1        false          false
        18        up or down     1        false          false
        19        right or left  1        false          false
        20        boundary       1        false          false
        21        None           1        false          false
        22        up or down     1        false          false
        23        right or left  1        false          false
        24        orig or bound  1        false          false
    */
    executingDualFalling: false,

    async applyMechanics() {
        if (gameboard.stageNo % 4 === 0) {
            gravity = {x: 1.0, y: 1.0};
            executingDualFalling = true;
            tiles.forEach(tile => {
                stageMechanics.prepareFall(tile, true, false);
            });
            fallAnimation();
            while (tiles.some(t => t.toggleFall)){
                await delay(50);
            }
            tiles.forEach(tile => {
                stageMechanics.prepareFall(tile, false, true);
            });
            executingDualFalling = false;
        } else {
            gravity = {x: 0.5, y: 0.5};
            tiles.forEach(tile => {
                stageMechanics.prepareFall(tile, true, true);
            });
        }
        fallAnimation();
    },
    getStageNo() {
        return gameboard.stageNo;
    },
    prepareFall(tile, doColumn = true, doRow = true) {
        // provide the upper-left coordinate where tile should fall to
        tile.toggleFall = true;

        const aboveCnt = gameboard.countAboveTiles(tile);
        const belowCnt = gameboard.countBelowTiles(tile);
        const leftCnt = gameboard.countTilesToLeft(tile);
        const rightCnt = gameboard.countTilesToRight(tile);

        let targetRow = tile.row();
        let targetCol = tile.col();
        switch (this.getStageNo()) {
            case 2: // downward
            case 6:
                if (doRow){
                    targetRow = gameboard.rowCnt - belowCnt - 1;
                }
                break;
            case 10: // upward
            case 14:
                if (doRow) {
                    targetRow = aboveCnt;
                }
                break;
            case 3: // leftward
            case 11:
                if (doColumn) {
                    targetCol = leftCnt;
                }
                break;
            case 7: // rightward
            case 15:
                if (doColumn) {
                    targetCol = gameboard.colCnt - rightCnt - 1;
                }
                break;
            case 4: // origin (which quadrant does the tile lie?)
            case 8:
            case 12:
                if (doColumn) {
                    const tilesInRow = 1 + leftCnt + rightCnt;
                    const letfPadding = Math.floor((gameboard.colCnt - tilesInRow) / 2);
                    targetCol = letfPadding + leftCnt;
                }
                if (doRow) {
                    const tilesInCol = 1 + aboveCnt + belowCnt;
                    const topPadding = Math.floor((gameboard.rowCnt - tilesInCol) / 2);
                    targetRow = topPadding + aboveCnt;
                }
                break
            case 16: // boundary (which quadrant does the tile lie?)
            case 20:
                if (doColumn) {
                    targetCol = tile.position.x < board.width / 2 ? 
                        leftCnt : gameboard.colCnt - rightCnt - 1;
                }
                if (doRow) {
                    targetRow = tile.position.y < board.height / 2 ? 
                        aboveCnt : gameboard.rowCnt - belowCnt - 1;
                }
                break
            case 18: // either downward or upward
            case 22:
                if (doRow) {
                    targetRow = !Math.floor(Math.random * 2) ?
                        gameboard.rowCnt - belowCnt - 1 : aboveCnt;
                }
            case 19: // either rightward or leftward
            case 23:
                if (doColumn) {
                    targetCol = !Math.floor(Math.random * 2) ?
                        gameboard.colCnt - rightCnt - 1 : targetCol = leftCnt;
                }
                break
            case 24: // either origin or boundary (which quadrant does the tile lie?)
                if (Math.floor(Math.random * 2)) {
                    if (doColumn) {
                        const tilesInRow = 1 + leftCnt + rightCnt;
                        const letfPadding = Math.floor((gameboard.colCnt - tilesInRow) / 2);
                        targetCol = letfPadding + leftCnt;
                    }
                    if (doRow) {
                        const tilesInCol = 1 + aboveCnt + belowCnt;
                        const topPadding = Math.floor((gameboard.rowCnt - tilesInCol) / 2);
                        targetRow = topPadding + aboveCnt;
                    }
                }
                else {
                    if (doColumn) {
                        targetCol = tile.position.x < board.width / 2 ? 
                            leftCnt : gameboard.colCnt - rightCnt - 1;
                    }
                    if (doRow) {
                        targetRow = tile.position.y < board.height / 2 ? 
                            aboveCnt : gameboard.rowCnt - belowCnt - 1;
                    }
                }
                break
            default:
                break;
        }

        tile.restPosition = gameboard.convertPosition(targetRow, targetCol);
    }
}
const imageURLs = [
    '1Bulbasaur.png',
    '2Ivysaur.png',
    '4Charmander.png',
    '5Charmeleon.png',
    '7Squirtle.png',
    '8Warturtle.png',
    '12Butterfree.png',
    '25Pikachu_A.png',
    '26Raichu.png',
    '35Clefairy.png',
    '37Vulpix.png',
    '39Jigglypuff.png',
    '43Oddish.png',
    '45Vileplume.png',
    '48Venonat.png',
    '50Diglet.png',
    '52Meowth.png',
    '54Psyduck.png',
    '58Growlith.png',
    '66Machop.png',
    '74Geodude.png',
    '79Slowpoke.png',
    '81Magnemite.png',
    '82Magneton.png',
    '83Farfetchd.png',
    '92Gastly.png',
    '94Gengar.png',
    '101Electrode.png',
    '120Staryu.png',
    '121Starmie.png',
    '129Magikarp.png',
    '131Lapras.png',
    '132Ditto.png',
    '133Eevee_B.png',
    '134Vaporeon.png',
    '135Jolteon.png',
    '136Flareon.png',
    '143Snorlax.png',
    '148Dragonair.png',
    '149Dragonite.png',
    '151Mew.png',
    '152Chikorita.png',
    '155Cyndaquil.png',
    '158Totodile.png',
    '161Furret.png',
    '166Ledian.png',
    '172Pichu.png',
    '173Cleffa.png',
    '175Togepi.png',
    '176Togetic.png',
    '182Bellossom.png',
    '183Marill.png',
    '186Politoad.png',
    '196Espeon.png',
    '197Umbreon.png',
    '216Teddiursa.png',
    '225Delibird.png',
    '226Mantine.png',
    '231Phanpy.png',
    '251Celebi.png',
    '252Treecko.png',
    '255Torchic.png',
    '258Mudkip.png',
    '267Beautifly.png',
    '298Azurill.png',
    '300Skitty.png',
    '311Plusle.png',
    '312Minun.png',
    '315Roselia.png',
    '385Jirachi.png',
    '387Turtwig.png',
    '390Chimchar.png',
    '393Piplup.png',
    '403Shinx.png',
    '417Pachirisu.png',
    '433Chingling.png',
    '489Phione.png',
    '492Shaymin.png',
    '494Victini.png',
    '498Tepig.png',
    '501Oshawott.png',
    '506Lillipup.png',
    '509Purrloin.png',
    '570Zorua.png',
    '572Minccino.png',
    '587Emolga.png',
    '648Meloetta.png',
    '650Chespin.png',
    '653Fennekin.png',
    '656Froakie.png',
    '702Dedenne.png',
    '764Comfey.png',
    '778Mimikyu.png',
    '789Cosmog.png',
    '802Marshadow.png',
    '813Scorbunny.png',
    '816Sobble.png',
    '827Nickit.png',
    '835Yamper.png',
    '877Morpeko.png'
];


class Tile {
    margin = 2;
    height;
    img = new Image();
    padding = 4;
    position;
    restPosition;
    toggleFall = true;
    velocity = {x: 0, y: 0};
    width;

    constructor({img, position, size}) {
        this.height = size.y;
        this.width = size.x;
        this.img.src = img;
        this.position = position;
        this.restPosition = position;
    }

    canPairWith(selectedTile) {
        // Check if a connection can be extended between tiles
        // Create the connection path while algorithms calculate

        if (this.img.src !== selectedTile.img.src) return false;

        gameboard.pendingConnectionPathPoints = [];
        gameboard.addPointToPendingConnection(this.row(), this.col());
        
        // Direct and Null connection
        let tileAboveMe = this.getTileAbove();
        let tileBelowMe = this.getTileBelow();
        let tileLeftOfMe = this.getTileToLeft();
        let tileRightOfMe = this.getTileToRight();
        if (tileAboveMe === selectedTile || tileBelowMe === selectedTile ||
            tileLeftOfMe === selectedTile || tileRightOfMe === selectedTile) {
            gameboard.pendingConnectionPathPoints.push(
                gameboard.getLocationCenterPoint(selectedTile.row(), selectedTile.col())
            );
            return true;
        }
        
        // Alternate iterating through each row and column, outward from a tile
        //   to get the shortest path
        const col1 = this.col();
        const col2 = selectedTile.col();
        const row1 = this.row();
        const row2 = selectedTile.row();
        let cToRight = col1 + 1;
        let cToLeft = col1 - 1;
        let rBelow = row1 + 1;
        let rAbove = row1 - 1;

        while (cToRight < gameboard.colCnt || cToLeft >= 0 || rBelow < gameboard.rowCnt || rAbove >= 0) {
            if (cToRight <= gameboard.colCnt) {
                if (gameboard.horizontalPathIsClear(col1 + 1, cToRight, row1)) {
                    if (cToRight == col2 &&
                        ((row2 > row1 && gameboard.verticalPathIsClear(row1, row2 - 1, cToRight)) ||
                        (row2 < row1 && gameboard.verticalPathIsClear(row1, row2 + 1, cToRight))))
                    {
                        // Right angle
                        gameboard.addPointToPendingConnection(row1, cToRight);
                        gameboard.addPointToPendingConnection(row2, col2);
                        return true;
                    }
                    else if (gameboard.verticalPathIsClear(row1, row2, cToRight) &&
                        ((cToRight < col2 && gameboard.horizontalPathIsClear(col2 - 1, cToRight, row2)) ||
                        (cToRight > col2 && gameboard.horizontalPathIsClear(col2 + 1, cToRight, row2))))
                    {
                        gameboard.addPointToPendingConnection(row1, cToRight);
                        gameboard.addPointToPendingConnection(row2, cToRight);
                        gameboard.addPointToPendingConnection(row2, col2);
                        return true;
                    }
                }
                cToRight++;
            }
            if (cToLeft >= -1) {
                if (gameboard.horizontalPathIsClear(col1 - 1, cToLeft, row1)) {
                    if (cToLeft == col2 &&
                        ((row2 > row1 && gameboard.verticalPathIsClear(row1, row2 - 1, cToLeft)) ||
                        (row2 < row1 && gameboard.verticalPathIsClear(row1, row2 + 1, cToLeft))))
                    {
                        // Right angle
                        gameboard.addPointToPendingConnection(row1, cToLeft);
                        gameboard.addPointToPendingConnection(row2, col2);
                        return true;
                    }
                    else if (gameboard.verticalPathIsClear(row1, row2, cToLeft) &&
                        ((cToLeft < col2 && gameboard.horizontalPathIsClear(col2 - 1, cToLeft, row2)) ||
                        (cToLeft > col2 && gameboard.horizontalPathIsClear(col2 + 1, cToLeft, row2))))
                    {
                        gameboard.addPointToPendingConnection(row1, cToLeft);
                        gameboard.addPointToPendingConnection(row2, cToLeft);
                        gameboard.addPointToPendingConnection(row2, col2);
                        return true;
                    }
                }
                cToLeft--;
            }
            if (rBelow <= gameboard.rowCnt) {
                if (gameboard.verticalPathIsClear(row1 + 1, rBelow, col1)) {
                    if (rBelow == row2 &&
                        ((col2 > col1 && gameboard.horizontalPathIsClear(col1, col2 - 1, rBelow)) ||
                        (col2 < col1 && gameboard.horizontalPathIsClear(col1, col2 + 1, rBelow))))
                    {
                        // Right angle
                        gameboard.addPointToPendingConnection(rBelow, col1);
                        gameboard.addPointToPendingConnection(row2, col2);
                        return true;
                    }
                    else if (gameboard.horizontalPathIsClear(col1, col2, rBelow) &&
                        ((rBelow < row2 && gameboard.verticalPathIsClear(row2 - 1, rBelow, col2)) ||
                        (rBelow > row2 && gameboard.verticalPathIsClear(row2 + 1, rBelow, col2))))
                    {
                        gameboard.addPointToPendingConnection(rBelow, col1);
                        gameboard.addPointToPendingConnection(rBelow, col2);
                        gameboard.addPointToPendingConnection(row2, col2);
                        return true;
                    }
                }
                rBelow++;
            }
            if (rAbove >= -1) {
                if (gameboard.verticalPathIsClear(row1 - 1, rAbove, col1)) {
                    if (rAbove == row2 &&
                        ((col2 > col1 && gameboard.horizontalPathIsClear(col1, col2 - 1, rAbove)) ||
                        (col2 < col1 && gameboard.horizontalPathIsClear(col1, col2 + 1, rAbove))))
                    {
                        // Right angle
                        gameboard.addPointToPendingConnection(rAbove, col1);
                        gameboard.addPointToPendingConnection(row2, col2);
                        return true;
                    }
                    else if (gameboard.horizontalPathIsClear(col1, col2, rAbove) &&
                        ((rAbove < row2 && gameboard.verticalPathIsClear(row2 - 1, rAbove, col2)) ||
                        (rAbove > row2 && gameboard.verticalPathIsClear(row2 + 1, rAbove, col2))))
                    {
                        gameboard.addPointToPendingConnection(rAbove, col1);
                        gameboard.addPointToPendingConnection(rAbove, col2);
                        gameboard.addPointToPendingConnection(row2, col2);
                        return true;
                    }
                }
                rAbove--;
            }
        }
    
        return false;
    }
    click() {
        if (stageMechanics.executingDualFalling) return;

        if (!selectedTile) {
            // nothing is selected - select
            selectedTile = this;
        }
        else if (selectedTile !== this) {
            // another tiles is already selected
            if (this.canPairWith(selectedTile, this)) {
                this.eliminate(selectedTile, this);
                return;
            }
            else {
                gameboard.pendingConnectionPathPoints = null;
                gameboard.remainingSeconds -= 4;
                let tile = selectedTile;
                selectedTile = null;
                tile.draw();
            }
        }
        else {
            // this tile is already selected - deselect
            selectedTile = null;
        }
        this.draw();
    }
    col() {
        return gameboard.revertPosition(this.position).c;
    }
    draw() {
        c.fillStyle = selectedTile === this ? 'yellow' : 'sienna';
        c.fillRect(
            this.position.x + this.margin,
            this.position.y + this.margin,
            this.width - 2 * this.margin,
            this.height - 2 * this.margin
        );
        c.fillStyle = selectedTile === this ? 'yellow' : 'peru';
        c.fillRect(
            this.position.x + this.margin + this.padding,
            this.position.y + this.margin + this.padding,
            this.width - 2 * (this.margin + this.padding),
            this.height - 2 * (this.margin + this.padding)
        );
        c.drawImage(this.img,
            this.position.x + this.margin + this.padding,
            this.position.y + this.margin + this.padding,
            this.width - 2 * (this.margin + this.padding),
            this.height - 2 * (this.margin + this.padding)
        );
    }
    eliminate() {
        gameboard.remainingSeconds += gameboard.proportionalTimeGain();
        
        gameboard.drawConnection();

        tiles.splice(tiles.indexOf(this), 1);
        tiles.splice(tiles.indexOf(selectedTile), 1);
        selectedTile = null;

        if (!tiles.length) {
            gameboard.advanceStage();
            return;
        }

        stageMechanics.applyMechanics();
    }
    fall() {
        // let tile accelerate toward a resting position (either another block or baselevel)

        const rest = this.restPosition;
        const pos = this.position;
        
        if (pos.y > rest.y) {
            if (pos.y - rest.y >= this.velocity.y) {
                this.position.y -= this.velocity.y;
                this.velocity.y += gravity.y;
            } else {
                this.position.y = rest.y;
            }
        }
        else if (pos.y < rest.y) {
            if (rest.y - pos.y >= this.velocity.y) {
                this.position.y += this.velocity.y;
                this.velocity.y += gravity.y;
            } else {
                this.position.y = rest.y;
            }
        }

        if (pos.x > rest.x) {
            if (pos.x - rest.x >= this.velocity.x) {
                this.position.x -= this.velocity.x;
                this.velocity.x += gravity.x;
            } else {
                this.position.x = rest.x;
            }
        }
        else if (pos.x < rest.x) {
            if (rest.x - pos.x >= this.velocity.x) {
                this.position.x += this.velocity.x;
                this.velocity.x += gravity.x;
            } else {
                this.position.x = rest.x;
            }
        }

        if (this.position.y === rest.y) this.velocity.y = 0;
        if (this.position.x === rest.x) this.velocity.x = 0;

        this.toggleFall = !(this.position.x === rest.x && this.position.y === rest.y);
        this.draw();
    }
    getTileAbove() {
        return gameboard.getTileAbove(this.row(), this.col());
    }
    getTileBelow() {
        return gameboard.getTileBelow(this.row(), this.col());
    }
    getTileToLeft() {
        return gameboard.getTileToLeft(this.row(), this.col());
    }
    getTileToRight() {
        return gameboard.getTileToRight(this.row(), this.col());
    }
    row() {
        return gameboard.revertPosition(this.position).r;
    }
}


function delay(milliseconds){
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
function drawAnimation(i) {
    if (i >= tiles.length) return 0;

    tiles[i++].draw();
    window.requestAnimationFrame(() => drawAnimation(i));
}
function fallAnimation() {
    if (!tiles.some(tile => tile.toggleFall)) {
        if (!gameboard.canPairAny()) gameboard.rearrange();
        return;
    }
    
    c.clearRect(0, 0, board.width, board.height);
    tiles.forEach(tile => tile.fall());
    window.requestAnimationFrame(fallAnimation);
}
function timerTick() {
    gameboard.remainingSeconds -= 2;
    backdrop.style.opacity = `${gameboard.proportionalTime() * 100}%`;
    if (backdrop.style.opacity <= 0) {
        backdrop.style.opacity = '100%';
        gameboard.reset();
    }
}

board.addEventListener('click', gameboard.onClick, false);
gameboard.reset();
setInterval(timerTick, 2000);
