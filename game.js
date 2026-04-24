const Game = {
    COLS: 10,
    ROWS: 20,
    CELL_SIZE: 30,
    SYNC_WINDOW: 500,
    
    SHAPES: [
        [[1, 1, 1, 1]],
        [[1, 1], [1, 1]],
        [[1, 1, 1], [0, 1, 0]],
        [[1, 1, 1], [1, 0, 0]],
        [[1, 1, 1], [0, 0, 1]],
        [[1, 1, 0], [0, 1, 1]],
        [[0, 1, 1], [1, 1, 0]]
    ],
    
    COLORS: {
        left: {
            normal: ['#00bcd4', '#4fc3f7', '#2196f3', '#03a9f4', '#00acc1', '#0097a7', '#00838f'],
            ghost: 'rgba(0, 188, 212, 0.3)',
            obstacle: 'rgba(255, 100, 100, 0.6)',
            obstacleCrack: 'rgba(255, 50, 50, 0.8)'
        },
        right: {
            normal: ['#e91e63', '#f06292', '#ec407a', '#d81b60', '#c2185b', '#ad1457', '#880e4f'],
            ghost: 'rgba(233, 30, 99, 0.3)',
            obstacle: 'rgba(100, 200, 255, 0.6)',
            obstacleCrack: 'rgba(50, 150, 255, 0.8)'
        }
    },
    
    init: function() {
        this.canvasLeft = document.getElementById('board-left');
        this.canvasRight = document.getElementById('board-right');
        this.ctxLeft = this.canvasLeft.getContext('2d');
        this.ctxRight = this.canvasRight.getContext('2d');
        this.effectsLeft = document.getElementById('effects-left').getContext('2d');
        this.effectsRight = document.getElementById('effects-right').getContext('2d');
        this.nextLeft = document.getElementById('next-left').getContext('2d');
        this.nextRight = document.getElementById('next-right').getContext('2d');
        
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.linesEl = document.getElementById('lines');
        this.syncStatus = document.getElementById('sync-status');
        this.syncTimer = document.getElementById('sync-timer');
        this.gameOverEl = document.getElementById('game-over');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverScore = document.getElementById('game-over-score').querySelector('span');
        this.syncEffectEl = document.getElementById('sync-effect');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        
        this.isRunning = false;
        this.isPaused = false;
        this.gameLoop = null;
        this.lastDropTime = 0;
        this.dropInterval = 1000;
        
        this.syncWindowActive = false;
        this.syncTimerStart = null;
        this.lastClearSide = null;
        this.syncAnimationId = null;
        
        this.lineClearEffects = [];
        this.obstacleCracks = [];
        
        this.setupEvents();
        this.reset();
    },
    
    reset: function() {
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        
        this.boardLeft = this.createEmptyBoard();
        this.boardRight = this.createEmptyBoard();
        
        this.obstacleBoardLeft = this.createEmptyBoard();
        this.obstacleBoardRight = this.createEmptyBoard();
        
        this.currentPieceLeft = null;
        this.currentPieceRight = null;
        this.nextPieceLeft = this.generatePiece();
        this.nextPieceRight = this.generatePiece();
        
        this.gameOverEl.classList.add('hidden');
        this.syncEffectEl.classList.add('hidden');
        
        this.updateUI();
        this.draw();
    },
    
    createEmptyBoard: function() {
        return Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
    },
    
    generatePiece: function() {
        const shapeIndex = Math.floor(Math.random() * this.SHAPES.length);
        const shape = this.SHAPES[shapeIndex];
        return {
            shape: shape,
            colorIndex: shapeIndex,
            x: Math.floor((this.COLS - shape[0].length) / 2),
            y: 0
        };
    },
    
    spawnPiece: function() {
        if (this.currentPieceLeft === null) {
            this.currentPieceLeft = this.nextPieceLeft;
            this.nextPieceLeft = this.generatePiece();
            this.currentPieceLeft.x = Math.floor((this.COLS - this.currentPieceLeft.shape[0].length) / 2);
            this.currentPieceLeft.y = 0;
        }
        
        if (this.currentPieceRight === null) {
            this.currentPieceRight = this.nextPieceRight;
            this.nextPieceRight = this.generatePiece();
            this.currentPieceRight.x = Math.floor((this.COLS - this.currentPieceRight.shape[0].length) / 2);
            this.currentPieceRight.y = this.ROWS - this.currentPieceRight.shape.length;
        }
        
        if (this.checkCollision(this.boardLeft, this.currentPieceLeft, 0, 0) ||
            this.checkCollision(this.boardRight, this.currentPieceRight, 0, 0)) {
            return false;
        }
        
        return true;
    },
    
    checkCollision: function(board, piece, offsetX, offsetY) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const newX = piece.x + col + offsetX;
                    const newY = piece.y + row + offsetY;
                    
                    if (newX < 0 || newX >= this.COLS || newY < 0 || newY >= this.ROWS) {
                        return true;
                    }
                    
                    if (board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    },
    
    movePiece: function(dx, dy) {
        if (!this.isRunning || this.isPaused) return;
        if (!this.currentPieceLeft || !this.currentPieceRight) return;
        
        const mirrorDx = -dx;
        
        if (!this.checkCollision(this.boardLeft, this.currentPieceLeft, dx, dy) &&
            !this.checkCollision(this.boardRight, this.currentPieceRight, mirrorDx, -dy)) {
            this.currentPieceLeft.x += dx;
            this.currentPieceLeft.y += dy;
            this.currentPieceRight.x += mirrorDx;
            this.currentPieceRight.y += -dy;
            this.draw();
        }
    },
    
    rotatePiece: function() {
        if (!this.isRunning || this.isPaused) return;
        if (!this.currentPieceLeft || !this.currentPieceRight) return;
        
        const rotatedLeft = this.rotateShape(this.currentPieceLeft.shape);
        const rotatedRight = this.rotateShape(this.currentPieceRight.shape, true);
        
        const originalLeft = this.currentPieceLeft.shape;
        const originalRight = this.currentPieceRight.shape;
        
        this.currentPieceLeft.shape = rotatedLeft;
        this.currentPieceRight.shape = rotatedRight;
        
        const needsKickLeft = this.checkCollision(this.boardLeft, this.currentPieceLeft, 0, 0);
        const needsKickRight = this.checkCollision(this.boardRight, this.currentPieceRight, 0, 0);
        
        if (needsKickLeft) {
            if (!this.checkCollision(this.boardLeft, this.currentPieceLeft, -1, 0)) {
                this.currentPieceLeft.x -= 1;
            } else if (!this.checkCollision(this.boardLeft, this.currentPieceLeft, 1, 0)) {
                this.currentPieceLeft.x += 1;
            } else if (!this.checkCollision(this.boardLeft, this.currentPieceLeft, -2, 0)) {
                this.currentPieceLeft.x -= 2;
            } else if (!this.checkCollision(this.boardLeft, this.currentPieceLeft, 2, 0)) {
                this.currentPieceLeft.x += 2;
            } else {
                this.currentPieceLeft.shape = originalLeft;
            }
        }
        
        if (needsKickRight) {
            if (!this.checkCollision(this.boardRight, this.currentPieceRight, -1, 0)) {
                this.currentPieceRight.x -= 1;
            } else if (!this.checkCollision(this.boardRight, this.currentPieceRight, 1, 0)) {
                this.currentPieceRight.x += 1;
            } else if (!this.checkCollision(this.boardRight, this.currentPieceRight, -2, 0)) {
                this.currentPieceRight.x -= 2;
            } else if (!this.checkCollision(this.boardRight, this.currentPieceRight, 2, 0)) {
                this.currentPieceRight.x += 2;
            } else {
                this.currentPieceRight.shape = originalRight;
            }
        }
        
        this.draw();
    },
    
    rotateShape: function(shape, mirror = false) {
        const rows = shape.length;
        const cols = shape[0].length;
        const rotated = [];
        
        for (let col = 0; col < cols; col++) {
            rotated[col] = [];
            for (let row = rows - 1; row >= 0; row--) {
                rotated[col][rows - 1 - row] = shape[row][col];
            }
        }
        
        if (mirror) {
            return rotated.map(row => [...row].reverse());
        }
        
        return rotated;
    },
    
    hardDrop: function() {
        if (!this.isRunning || this.isPaused) return;
        if (!this.currentPieceLeft || !this.currentPieceRight) return;
        
        let dropDistanceLeft = 0;
        let dropDistanceRight = 0;
        
        while (!this.checkCollision(this.boardLeft, this.currentPieceLeft, 0, 1)) {
            this.currentPieceLeft.y++;
            dropDistanceLeft++;
        }
        
        while (!this.checkCollision(this.boardRight, this.currentPieceRight, 0, -1)) {
            this.currentPieceRight.y--;
            dropDistanceRight++;
        }
        
        this.score += (dropDistanceLeft + dropDistanceRight) * 2;
        this.lockPiece();
    },
    
    lockPiece: function() {
        this.lockPieceToBoard(this.boardLeft, this.currentPieceLeft);
        this.lockPieceToBoard(this.boardRight, this.currentPieceRight);
        
        this.currentPieceLeft = null;
        this.currentPieceRight = null;
        
        const clearedLeft = this.clearLines(this.boardLeft, 'left');
        const clearedRight = this.clearLines(this.boardRight, 'right');
        
        if (clearedLeft.length > 0) {
            this.addLineClearEffect('left', clearedLeft);
            this.handleLineClear('left', clearedLeft.length);
        }
        
        if (clearedRight.length > 0) {
            this.addLineClearEffect('right', clearedRight);
            this.handleLineClear('right', clearedRight.length);
        }
        
        if (!this.spawnPiece()) {
            this.gameOver();
        }
        
        this.updateUI();
        this.draw();
    },
    
    lockPieceToBoard: function(board, piece) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const boardY = piece.y + row;
                    const boardX = piece.x + col;
                    if (boardY >= 0 && boardY < this.ROWS && boardX >= 0 && boardX < this.COLS) {
                        board[boardY][boardX] = piece.colorIndex + 1;
                    }
                }
            }
        }
    },
    
    clearLines: function(board, side) {
        const clearedLines = [];
        const obstacleBoard = side === 'left' ? this.obstacleBoardLeft : this.obstacleBoardRight;
        
        for (let row = 0; row < this.ROWS; row++) {
            let hasObstacle = false;
            let fullLine = true;
            
            for (let col = 0; col < this.COLS; col++) {
                if (obstacleBoard[row][col]) {
                    hasObstacle = true;
                }
                if (!board[row][col] && !obstacleBoard[row][col]) {
                    fullLine = false;
                    break;
                }
            }
            
            if (fullLine) {
                if (hasObstacle) {
                    for (let col = 0; col < this.COLS; col++) {
                        if (obstacleBoard[row][col]) {
                            obstacleBoard[row][col]--;
                            if (obstacleBoard[row][col] <= 0) {
                                obstacleBoard[row][col] = 0;
                            }
                        }
                    }
                } else {
                    clearedLines.push(row);
                }
            }
        }
        
        for (let i = clearedLines.length - 1; i >= 0; i--) {
            const line = clearedLines[i];
            board.splice(line, 1);
            board.unshift(Array(this.COLS).fill(0));
            
            obstacleBoard.splice(line, 1);
            obstacleBoard.unshift(Array(this.COLS).fill(0));
        }
        
        return clearedLines;
    },
    
    handleLineClear: function(side, linesCount) {
        const points = [0, 100, 300, 500, 800];
        this.score += points[linesCount] * this.level;
        this.lines += linesCount;
        
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
        }
        
        const otherSide = side === 'left' ? 'right' : 'left';
        this.addObstacles(otherSide, linesCount);
        
        this.checkSyncClear(side);
    },
    
    addObstacles: function(side, count) {
        const obstacleBoard = side === 'left' ? this.obstacleBoardLeft : this.obstacleBoardRight;
        const board = side === 'left' ? this.boardLeft : this.boardRight;
        
        for (let i = 0; i < count; i++) {
            const col = Math.floor(Math.random() * this.COLS);
            
            if (side === 'left') {
                for (let row = this.ROWS - 1; row >= 0; row--) {
                    if (!board[row][col] && !obstacleBoard[row][col]) {
                        obstacleBoard[row][col] = 2;
                        this.addCrackEffect(side, row, col);
                        break;
                    }
                }
            } else {
                for (let row = 0; row < this.ROWS; row++) {
                    if (!board[row][col] && !obstacleBoard[row][col]) {
                        obstacleBoard[row][col] = 2;
                        this.addCrackEffect(side, row, col);
                        break;
                    }
                }
            }
        }
    },
    
    addCrackEffect: function(side, row, col) {
        this.obstacleCracks.push({
            side: side,
            row: row,
            col: col,
            startTime: Date.now(),
            duration: 500
        });
    },
    
    addLineClearEffect: function(side, lines) {
        lines.forEach(line => {
            this.lineClearEffects.push({
                side: side,
                line: line,
                startTime: Date.now(),
                duration: 300
            });
        });
    },
    
    checkSyncClear: function(side) {
        const now = Date.now();
        
        if (!this.syncWindowActive) {
            this.syncWindowActive = true;
            this.lastClearSide = side;
            this.syncTimerStart = now;
            this.syncStatus.textContent = '同步窗口开启!';
            this.syncStatus.classList.add('active');
            this.updateSyncTimer();
        } else {
            if (this.lastClearSide !== side) {
                this.triggerSyncEffect();
                return;
            }
        }
    },
    
    updateSyncTimer: function() {
        if (!this.syncWindowActive) {
            this.syncTimer.textContent = '';
            return;
        }
        
        const now = Date.now();
        const elapsed = now - this.syncTimerStart;
        const remaining = Math.max(0, this.SYNC_WINDOW - elapsed);
        
        if (remaining <= 0) {
            this.closeSyncWindow();
            return;
        }
        
        this.syncTimer.textContent = (remaining / 1000).toFixed(1) + 's';
        
        this.syncAnimationId = requestAnimationFrame(() => this.updateSyncTimer());
    },
    
    closeSyncWindow: function() {
        this.syncWindowActive = false;
        this.lastClearSide = null;
        this.syncStatus.textContent = '准备就绪';
        this.syncStatus.classList.remove('active');
        this.syncTimer.textContent = '';
        
        if (this.syncAnimationId) {
            cancelAnimationFrame(this.syncAnimationId);
            this.syncAnimationId = null;
        }
    },
    
    triggerSyncEffect: function() {
        this.closeSyncWindow();
        
        this.score += 10000;
        
        this.boardLeft = this.createEmptyBoard();
        this.boardRight = this.createEmptyBoard();
        this.obstacleBoardLeft = this.createEmptyBoard();
        this.obstacleBoardRight = this.createEmptyBoard();
        
        this.syncEffectEl.classList.remove('hidden');
        
        setTimeout(() => {
            this.syncEffectEl.classList.add('hidden');
        }, 2000);
        
        this.updateUI();
    },
    
    gameOver: function() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        this.gameOverScore.textContent = this.score;
        this.gameOverEl.classList.remove('hidden');
    },
    
    updateUI: function() {
        this.scoreEl.textContent = this.score;
        this.levelEl.textContent = this.level;
        this.linesEl.textContent = this.lines;
    },
    
    drop: function() {
        if (!this.isRunning || this.isPaused) return;
        if (!this.currentPieceLeft || !this.currentPieceRight) return;
        
        const canDropLeft = !this.checkCollision(this.boardLeft, this.currentPieceLeft, 0, 1);
        const canDropRight = !this.checkCollision(this.boardRight, this.currentPieceRight, 0, -1);
        
        if (canDropLeft) {
            this.currentPieceLeft.y++;
        }
        
        if (canDropRight) {
            this.currentPieceRight.y--;
        }
        
        if (!canDropLeft && !canDropRight) {
            this.lockPiece();
        }
        
        this.draw();
    },
    
    draw: function() {
        this.drawBoard(this.ctxLeft, this.boardLeft, this.obstacleBoardLeft, 'left', this.currentPieceLeft);
        this.drawBoard(this.ctxRight, this.boardRight, this.obstacleBoardRight, 'right', this.currentPieceRight);
        this.drawNextPiece(this.nextLeft, this.nextPieceLeft, 'left');
        this.drawNextPiece(this.nextRight, this.nextPieceRight, 'right');
        this.drawEffects();
    },
    
    drawBoard: function(ctx, board, obstacleBoard, side, currentPiece) {
        ctx.clearRect(0, 0, this.canvasLeft.width, this.canvasLeft.height);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let row = 0; row <= this.ROWS; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * this.CELL_SIZE);
            ctx.lineTo(this.COLS * this.CELL_SIZE, row * this.CELL_SIZE);
            ctx.stroke();
        }
        for (let col = 0; col <= this.COLS; col++) {
            ctx.beginPath();
            ctx.moveTo(col * this.CELL_SIZE, 0);
            ctx.lineTo(col * this.CELL_SIZE, this.ROWS * this.CELL_SIZE);
            ctx.stroke();
        }
        
        const colors = this.COLORS[side];
        
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (obstacleBoard[row][col]) {
                    const x = col * this.CELL_SIZE;
                    const y = row * this.CELL_SIZE;
                    
                    ctx.fillStyle = colors.obstacle;
                    ctx.fillRect(x + 1, y + 1, this.CELL_SIZE - 2, this.CELL_SIZE - 2);
                    
                    ctx.strokeStyle = colors.obstacleCrack;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + 5, y + 5);
                    ctx.lineTo(x + this.CELL_SIZE - 10, y + this.CELL_SIZE - 8);
                    ctx.moveTo(x + this.CELL_SIZE - 8, y + 8);
                    ctx.lineTo(x + 8, y + this.CELL_SIZE - 10);
                    ctx.stroke();
                } else if (board[row][col]) {
                    const colorIndex = board[row][col] - 1;
                    this.drawCell(ctx, col, row, colors.normal[colorIndex], side);
                }
            }
        }
        
        if (currentPiece) {
            let ghostY = currentPiece.y;
            
            if (side === 'left') {
                while (!this.checkCollision(board, currentPiece, 0, ghostY - currentPiece.y + 1)) {
                    ghostY++;
                }
            } else {
                while (!this.checkCollision(board, currentPiece, 0, ghostY - currentPiece.y - 1)) {
                    ghostY--;
                }
            }
            
            ctx.globalAlpha = 0.3;
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        this.drawCell(ctx, ghostY + row, currentPiece.x + col, colors.normal[currentPiece.colorIndex], side, true);
                    }
                }
            }
            ctx.globalAlpha = 1;
            
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        this.drawCell(ctx, currentPiece.x + col, currentPiece.y + row, colors.normal[currentPiece.colorIndex], side);
                    }
                }
            }
        }
    },
    
    drawCell: function(ctx, x, y, color, side, isGhost = false) {
        const px = x * this.CELL_SIZE;
        const py = y * this.CELL_SIZE;
        const padding = 2;
        const size = this.CELL_SIZE - padding * 2;
        
        if (isGhost) {
            ctx.globalAlpha = 0.3;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(px + padding, py + padding, size, size);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(px + padding, py + padding, size, 3);
        ctx.fillRect(px + padding, py + padding, 3, size);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(px + padding, py + padding + size - 3, size, 3);
        ctx.fillRect(px + padding + size - 3, py + padding, 3, size);
        
        ctx.globalAlpha = 1;
    },
    
    drawNextPiece: function(ctx, piece, side) {
        ctx.clearRect(0, 0, 120, 120);
        
        if (!piece) return;
        
        const colors = this.COLORS[side];
        const cellSize = 25;
        const shape = piece.shape;
        
        const offsetX = (120 - shape[0].length * cellSize) / 2;
        const offsetY = (120 - shape.length * cellSize) / 2;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const px = offsetX + col * cellSize;
                    const py = offsetY + row * cellSize;
                    const padding = 2;
                    const size = cellSize - padding * 2;
                    
                    ctx.fillStyle = colors.normal[piece.colorIndex];
                    ctx.fillRect(px + padding, py + padding, size, size);
                    
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.fillRect(px + padding, py + padding, size, 2);
                    ctx.fillRect(px + padding, py + padding, 2, size);
                    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.fillRect(px + padding, py + padding + size - 2, size, 2);
                    ctx.fillRect(px + padding + size - 2, py + padding, 2, size);
                }
            }
        }
    },
    
    drawEffects: function() {
        const now = Date.now();
        
        this.effectsLeft.clearRect(0, 0, this.canvasLeft.width, this.canvasLeft.height);
        this.effectsRight.clearRect(0, 0, this.canvasRight.width, this.canvasRight.height);
        
        this.lineClearEffects = this.lineClearEffects.filter(effect => {
            const progress = (now - effect.startTime) / effect.duration;
            if (progress >= 1) return false;
            
            const ctx = effect.side === 'left' ? this.effectsLeft : this.effectsRight;
            const y = effect.line * this.CELL_SIZE;
            const alpha = 1 - progress;
            const scale = 1 + progress * 2;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = effect.side === 'left' ? '#4fc3f7' : '#e91e63';
            
            const centerY = y + this.CELL_SIZE / 2;
            const height = this.CELL_SIZE * scale;
            ctx.fillRect(0, centerY - height / 2, this.COLS * this.CELL_SIZE, height);
            
            ctx.restore();
            return true;
        });
        
        this.obstacleCracks = this.obstacleCracks.filter(crack => {
            const progress = (now - crack.startTime) / crack.duration;
            if (progress >= 1) return false;
            
            const ctx = crack.side === 'left' ? this.effectsLeft : this.effectsRight;
            const x = crack.col * this.CELL_SIZE;
            const y = crack.row * this.CELL_SIZE;
            const alpha = 1 - progress;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = crack.side === 'left' ? '#e91e63' : '#4fc3f7';
            ctx.lineWidth = 3;
            ctx.shadowColor = crack.side === 'left' ? '#e91e63' : '#4fc3f7';
            ctx.shadowBlur = 10 * (1 - progress);
            
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 5);
            ctx.lineTo(x + this.CELL_SIZE - 10, y + this.CELL_SIZE - 8);
            ctx.moveTo(x + this.CELL_SIZE - 8, y + 8);
            ctx.lineTo(x + 8, y + this.CELL_SIZE - 10);
            ctx.stroke();
            
            ctx.restore();
            return true;
        });
    },
    
    start: function() {
        if (this.isRunning) return;
        
        this.reset();
        this.isRunning = true;
        this.isPaused = false;
        this.lastDropTime = Date.now();
        
        if (!this.spawnPiece()) {
            this.gameOver();
            return;
        }
        
        this.startBtn.textContent = '重新开始';
        this.gameLoop = requestAnimationFrame(() => this.update());
    },
    
    update: function() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        
        if (now - this.lastDropTime >= this.dropInterval) {
            this.drop();
            this.lastDropTime = now;
        }
        
        this.drawEffects();
        this.gameLoop = requestAnimationFrame(() => this.update());
    },
    
    togglePause: function() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.syncStatus.textContent = '已暂停';
        } else {
            this.syncStatus.textContent = this.syncWindowActive ? '同步窗口开启!' : '准备就绪';
            this.lastDropTime = Date.now();
        }
    },
    
    setupEvents: function() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
                case 'r':
                case 'R':
                    this.start();
                    break;
            }
        });
        
        this.startBtn.addEventListener('click', () => this.start());
        this.restartBtn.addEventListener('click', () => {
            this.gameOverEl.classList.add('hidden');
            this.start();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
