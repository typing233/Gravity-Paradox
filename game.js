const Game = {
    COLS: 10,
    ROWS: 20,
    CELL_SIZE: 24,
    SYNC_WINDOW: 500,
    GRAVITY_REVERSE_DURATION: 5000,
    BOND_THRESHOLD: 3,
    MAX_TOWER_LEVEL: 10,
    
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
    
    POWER_UPS: {
        GRAVITY_REVERSE: {
            id: 'gravity_reverse',
            name: '重力反转',
            icon: '↕️',
            description: '短暂解除镜像控制，自由操作单侧区域'
        },
        LINE_COPY: {
            id: 'line_copy',
            name: '行复制',
            icon: '📋',
            description: '消除一行时自动复制到对侧'
        },
        CLEAR_SINGLE: {
            id: 'clear_single',
            name: '单侧清除',
            icon: '🧹',
            description: '立即清除当前侧最下方的一行'
        }
    },
    
    BUFFS: [
        { id: 'speed_down', name: '时间减缓', icon: '⏳', description: '下落速度降低30%', type: 'buff' },
        { id: 'score_boost', name: '分数加成', icon: '⭐', description: '所有得分增加50%', type: 'buff' },
        { id: 'extra_powerup', name: '道具补给', icon: '🎁', description: '获得随机道具x2', type: 'buff' },
        { id: 'ghost_preview', name: '幽灵增强', icon: '👻', description: '幽灵方块显示更清晰', type: 'buff' }
    ],
    
    DEBUFFS: [
        { id: 'speed_up', name: '时间加速', icon: '⚡', description: '下落速度增加50%', type: 'debuff' },
        { id: 'obstacle_spawn', name: '障碍降临', icon: '🪨', description: '立即生成3个障碍', type: 'debuff' },
        { id: 'score_reduce', name: '分数削减', icon: '💔', description: '所有得分减少30%', type: 'debuff' },
        { id: 'control_invert', name: '控制反转', icon: '🔄', description: '左右控制反转10秒', type: 'debuff' }
    ],
    
    TOWER_GOALS: [
        { type: 'lines', amount: 10, description: '消除 10 行' },
        { type: 'lines', amount: 15, description: '消除 15 行' },
        { type: 'score', amount: 5000, description: '获得 5000 分' },
        { type: 'lines', amount: 20, description: '消除 20 行' },
        { type: 'combo', amount: 5, description: '达成 5 连击' },
        { type: 'lines', amount: 25, description: '消除 25 行' },
        { type: 'score', amount: 10000, description: '获得 10000 分' },
        { type: 'lines', amount: 30, description: '消除 30 行' },
        { type: 'sync', amount: 3, description: '触发 3 次同步消除' },
        { type: 'lines', amount: 50, description: '消除 50 行' }
    ],
    
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
        this.comboEl = document.getElementById('combo');
        this.syncStatus = document.getElementById('sync-status');
        this.syncTimer = document.getElementById('sync-timer');
        this.gameOverEl = document.getElementById('game-over');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverScore = document.getElementById('game-over-score').querySelector('span');
        this.syncEffectEl = document.getElementById('sync-effect');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        
        this.bondStatusEl = document.getElementById('bond-status');
        this.bondMultiplierEl = document.getElementById('bond-multiplier');
        this.gravityReverseIndicator = document.getElementById('gravity-reverse-indicator');
        this.reverseStatusEl = document.getElementById('reverse-status');
        this.reverseTimerEl = document.getElementById('reverse-timer');
        
        this.towerInfoEl = document.getElementById('tower-info');
        this.towerLevelEl = document.getElementById('tower-level');
        this.towerGoalEl = document.getElementById('tower-goal');
        this.progressFillEl = document.getElementById('progress-fill');
        this.cardSelectionEl = document.getElementById('card-selection');
        this.cardTitleEl = document.getElementById('card-title');
        this.cardSubtitleEl = document.getElementById('card-subtitle');
        this.cardsContainerEl = document.getElementById('cards-container');
        this.towerCompleteEl = document.getElementById('tower-complete');
        this.towerCompleteDescEl = document.getElementById('tower-complete-desc');
        this.towerCompleteScoreEl = document.getElementById('tower-complete-score').querySelector('span');
        this.towerRestartBtn = document.getElementById('tower-restart-btn');
        
        this.bondEffectEl = document.getElementById('bond-effect');
        this.bondEffectTitleEl = document.getElementById('bond-effect-title');
        this.bondEffectDescEl = document.getElementById('bond-effect-desc');
        this.bondEffectBonusEl = document.getElementById('bond-effect-bonus');
        
        this.powerUpEffectEl = document.getElementById('power-up-effect');
        this.powerUpEffectTitleEl = document.getElementById('power-up-effect-title');
        this.powerUpEffectDescEl = document.getElementById('power-up-effect-desc');
        
        this.modeOptions = document.querySelectorAll('.mode-option');
        
        this.isRunning = false;
        this.isPaused = false;
        this.gameLoop = null;
        this.lastDropTime = 0;
        this.dropInterval = 1000;
        this.baseDropInterval = 1000;
        
        this.syncWindowActive = false;
        this.syncTimerStart = null;
        this.lastClearSide = null;
        this.syncAnimationId = null;
        
        this.lineClearEffects = [];
        this.obstacleCracks = [];
        
        this.gameMode = 'classic';
        this.towerLevel = 1;
        this.towerProgress = 0;
        this.currentGoal = null;
        this.activeBuffs = [];
        this.activeDebuffs = [];
        this.syncClearCount = 0;
        this.maxCombo = 0;
        
        this.gravityReverseActive = false;
        this.gravityReverseSide = null;
        this.gravityReverseStart = null;
        this.gravityReverseAnimationId = null;
        
        this.bondActive = false;
        this.bondMultiplier = 1.0;
        this.bondedCells = [];
        this.combo = 0;
        this.lastClearTime = 0;
        this.COMBO_TIMEOUT = 2000;
        
        this.powerUpsLeft = {};
        this.powerUpsRight = {};
        this.lineCopyActive = false;
        this.lineCopySide = null;
        
        this.controlInverted = false;
        this.controlInvertEnd = null;
        
        this.scoreMultiplier = 1.0;
        
        this.setupEvents();
        this.reset();
    },
    
    reset: function() {
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.syncClearCount = 0;
        
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
        this.bondEffectEl.classList.add('hidden');
        this.powerUpEffectEl.classList.add('hidden');
        this.cardSelectionEl.classList.add('hidden');
        this.towerCompleteEl.classList.add('hidden');
        
        this.gravityReverseActive = false;
        this.gravityReverseSide = null;
        this.gravityReverseIndicator.classList.add('hidden');
        
        this.bondActive = false;
        this.bondMultiplier = 1.0;
        this.bondedCells = [];
        
        this.powerUpsLeft = {};
        this.powerUpsRight = {};
        this.lineCopyActive = false;
        
        this.activeBuffs = [];
        this.activeDebuffs = [];
        this.dropInterval = this.baseDropInterval;
        this.scoreMultiplier = 1.0;
        this.controlInverted = false;
        
        if (this.gameMode === 'tower') {
            this.towerLevel = 1;
            this.towerProgress = 0;
            this.towerInfoEl.classList.remove('hidden');
            this.setupTowerLevel();
        } else {
            this.towerInfoEl.classList.add('hidden');
        }
        
        this.updateUI();
        this.updatePowerUpUI();
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
        
        if (Math.random() < 0.15) {
            this.grantRandomPowerUp();
        }
        
        return true;
    },
    
    grantRandomPowerUp: function() {
        const powerUpTypes = Object.values(this.POWER_UPS);
        const powerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const side = Math.random() < 0.5 ? 'left' : 'right';
        const powerUps = side === 'left' ? this.powerUpsLeft : this.powerUpsRight;
        
        if (!powerUps[powerUp.id]) {
            powerUps[powerUp.id] = 0;
        }
        powerUps[powerUp.id]++;
        
        this.updatePowerUpUI();
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
        
        if (this.controlInverted) {
            dx = -dx;
        }
        
        if (this.gravityReverseActive) {
            this.movePieceSingleSide(dx, dy);
            return;
        }
        
        const mirrorDx = -dx;
        
        const canMoveLeft = !this.checkCollision(this.boardLeft, this.currentPieceLeft, dx, dy);
        const canMoveRight = !this.checkCollision(this.boardRight, this.currentPieceRight, mirrorDx, -dy);
        
        if (canMoveLeft && canMoveRight) {
            this.currentPieceLeft.x += dx;
            this.currentPieceLeft.y += dy;
            this.currentPieceRight.x += mirrorDx;
            this.currentPieceRight.y += -dy;
            this.draw();
        } else if (dx !== 0) {
            this.tryMoveToBoundary(dx, dy);
        }
    },
    
    tryMoveToBoundary: function(dx, dy) {
        const mirrorDx = -dx;
        
        let canMoveLeftAny = !this.checkBoardCollisionOnly(this.boardLeft, this.currentPieceLeft, dx, dy);
        let canMoveRightAny = !this.checkBoardCollisionOnly(this.boardRight, this.currentPieceRight, mirrorDx, -dy);
        
        if (!canMoveLeftAny && !canMoveRightAny) {
            return;
        }
        
        let maxLeftMove = this.calculateMaxMoveToBoundary(this.currentPieceLeft, this.boardLeft, dx, dy);
        let maxRightMove = this.calculateMaxMoveToBoundary(this.currentPieceRight, this.boardRight, mirrorDx, -dy);
        
        if (maxLeftMove === 0 && maxRightMove === 0) {
            return;
        }
        
        let moved = false;
        
        if (maxLeftMove > 0) {
            const actualDx = dx > 0 ? maxLeftMove : -maxLeftMove;
            this.currentPieceLeft.x += actualDx;
            moved = true;
        }
        
        if (maxRightMove > 0) {
            const actualDx = mirrorDx > 0 ? maxRightMove : -maxRightMove;
            this.currentPieceRight.x += actualDx;
            moved = true;
        }
        
        if (moved) {
            this.draw();
        }
    },
    
    checkBoardCollisionOnly: function(board, piece, dx, dy) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const newX = piece.x + col + dx;
                    const newY = piece.y + row + dy;
                    
                    if (newX >= 0 && newX < this.COLS && newY >= 0 && newY < this.ROWS) {
                        if (board[newY][newX]) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    },
    
    calculateMaxMoveToBoundary: function(piece, board, dx, dy) {
        if (dx === 0) return 0;
        
        let maxMove = 0;
        const stepX = dx > 0 ? 1 : -1;
        
        while (true) {
            const testX = stepX * (maxMove + 1);
            
            let willHitBoundary = false;
            let willHitBlock = false;
            
            for (let row = 0; row < piece.shape.length; row++) {
                for (let col = 0; col < piece.shape[row].length; col++) {
                    if (piece.shape[row][col]) {
                        const newX = piece.x + col + testX;
                        const newY = piece.y + row;
                        
                        if (newX < 0 || newX >= this.COLS) {
                            willHitBoundary = true;
                        }
                        
                        if (newX >= 0 && newX < this.COLS && newY >= 0 && newY < this.ROWS) {
                            if (board[newY][newX]) {
                                willHitBlock = true;
                            }
                        }
                    }
                }
            }
            
            if (willHitBlock) {
                break;
            }
            
            if (willHitBoundary) {
                if (maxMove > 0) {
                    return maxMove;
                }
                break;
            }
            
            maxMove++;
            if (maxMove >= this.COLS) break;
        }
        
        return maxMove;
    },
    
    movePieceSingleSide: function(dx, dy) {
        const side = this.gravityReverseSide;
        const piece = side === 'left' ? this.currentPieceLeft : this.currentPieceRight;
        const board = side === 'left' ? this.boardLeft : this.boardRight;
        
        const actualDy = side === 'left' ? dy : -dy;
        
        if (!this.checkCollision(board, piece, dx, actualDy)) {
            piece.x += dx;
            piece.y += actualDy;
            this.draw();
        }
    },
    
    rotatePiece: function() {
        if (!this.isRunning || this.isPaused) return;
        if (!this.currentPieceLeft || !this.currentPieceRight) return;
        
        if (this.gravityReverseActive) {
            this.rotatePieceSingleSide();
            return;
        }
        
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
    
    rotatePieceSingleSide: function() {
        const side = this.gravityReverseSide;
        const piece = side === 'left' ? this.currentPieceLeft : this.currentPieceRight;
        const board = side === 'left' ? this.boardLeft : this.boardRight;
        const isMirror = side === 'right';
        
        const rotated = this.rotateShape(piece.shape, isMirror);
        const original = piece.shape;
        
        piece.shape = rotated;
        
        const needsKick = this.checkCollision(board, piece, 0, 0);
        
        if (needsKick) {
            if (!this.checkCollision(board, piece, -1, 0)) {
                piece.x -= 1;
            } else if (!this.checkCollision(board, piece, 1, 0)) {
                piece.x += 1;
            } else if (!this.checkCollision(board, piece, -2, 0)) {
                piece.x -= 2;
            } else if (!this.checkCollision(board, piece, 2, 0)) {
                piece.x += 2;
            } else {
                piece.shape = original;
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
        
        if (this.gravityReverseActive) {
            this.hardDropSingleSide();
            return;
        }
        
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
        
        this.score += Math.floor((dropDistanceLeft + dropDistanceRight) * 2 * this.scoreMultiplier);
        this.lockPiece();
    },
    
    hardDropSingleSide: function() {
        const side = this.gravityReverseSide;
        const piece = side === 'left' ? this.currentPieceLeft : this.currentPieceRight;
        const board = side === 'left' ? this.boardLeft : this.boardRight;
        
        let dropDistance = 0;
        const dy = side === 'left' ? 1 : -1;
        
        while (!this.checkCollision(board, piece, 0, dy)) {
            piece.y += dy;
            dropDistance++;
        }
        
        this.score += Math.floor(dropDistance * 2 * this.scoreMultiplier);
        this.lockPiece();
    },
    
    lockPiece: function() {
        this.lockPieceToBoard(this.boardLeft, this.currentPieceLeft);
        this.lockPieceToBoard(this.boardRight, this.currentPieceRight);
        
        this.currentPieceLeft = null;
        this.currentPieceRight = null;
        
        this.checkBond();
        
        const clearedLeft = this.clearLines(this.boardLeft, 'left');
        const clearedRight = this.clearLines(this.boardRight, 'right');
        
        let leftCleared = clearedLeft.length > 0;
        let rightCleared = clearedRight.length > 0;
        
        if (leftCleared) {
            this.addLineClearEffect('left', clearedLeft);
            this.handleLineClear('left', clearedLeft.length);
        }
        
        if (rightCleared) {
            this.addLineClearEffect('right', clearedRight);
            this.handleLineClear('right', clearedRight.length);
        }
        
        if (leftCleared && rightCleared) {
            this.handleSyncBondClear();
        }
        
        if (!this.spawnPiece()) {
            this.gameOver();
        }
        
        this.updateUI();
        this.draw();
    },
    
    checkBond: function() {
        this.bondedCells = [];
        
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const mirrorCol = this.COLS - 1 - col;
                const mirrorRow = this.ROWS - 1 - row;
                
                if (this.boardLeft[row][col] && this.boardRight[mirrorRow][mirrorCol]) {
                    if (this.boardLeft[row][col] === this.boardRight[mirrorRow][mirrorCol]) {
                        this.bondedCells.push({
                            left: { row, col },
                            right: { row: mirrorRow, col: mirrorCol },
                            colorIndex: this.boardLeft[row][col]
                        });
                    }
                }
            }
        }
        
        const bondCount = this.bondedCells.length;
        if (bondCount >= this.BOND_THRESHOLD) {
            this.activateBond(bondCount);
        } else {
            this.deactivateBond();
        }
    },
    
    activateBond: function(bondCount) {
        this.bondActive = true;
        this.bondMultiplier = 1.0 + (bondCount - this.BOND_THRESHOLD) * 0.2;
        
        this.bondStatusEl.textContent = '羁绊激活!';
        this.bondStatusEl.classList.add('active');
        this.bondMultiplierEl.textContent = 'x' + this.bondMultiplier.toFixed(1);
    },
    
    deactivateBond: function() {
        this.bondActive = false;
        this.bondMultiplier = 1.0;
        
        this.bondStatusEl.textContent = '未羁绊';
        this.bondStatusEl.classList.remove('active');
        this.bondMultiplierEl.textContent = 'x1.0';
    },
    
    handleSyncBondClear: function() {
        if (this.bondActive) {
            const bonusPoints = Math.floor(5000 * this.bondMultiplier * this.scoreMultiplier);
            this.score += bonusPoints;
            
            this.showBondEffect('双重羁绊!', '双边同步消除触发高倍率加分', bonusPoints);
        }
    },
    
    showBondEffect: function(title, desc, bonus) {
        this.bondEffectTitleEl.textContent = title;
        this.bondEffectDescEl.textContent = desc;
        this.bondEffectBonusEl.textContent = '+' + bonus + ' 分';
        this.bondEffectEl.classList.remove('hidden');
        
        setTimeout(() => {
            this.bondEffectEl.classList.add('hidden');
        }, 1500);
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
        
        if (this.lineCopyActive && this.lineCopySide === side && clearedLines.length > 0) {
            this.copyLinesToOtherSide(side, clearedLines);
            this.lineCopyActive = false;
            this.lineCopySide = null;
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
    
    copyLinesToOtherSide: function(sourceSide, lines) {
        const targetSide = sourceSide === 'left' ? 'right' : 'left';
        const targetBoard = targetSide === 'left' ? this.boardLeft : this.boardRight;
        
        lines.forEach(line => {
            const targetLine = targetSide === 'left' ? line : (this.ROWS - 1 - line);
            
            for (let col = 0; col < this.COLS; col++) {
                if (targetLine >= 0 && targetLine < this.ROWS) {
                    targetBoard[targetLine][col] = Math.floor(Math.random() * 7) + 1;
                }
            }
        });
    },
    
    handleLineClear: function(side, linesCount) {
        const now = Date.now();
        
        if (now - this.lastClearTime < this.COMBO_TIMEOUT) {
            this.combo++;
        } else {
            this.combo = 1;
        }
        this.lastClearTime = now;
        
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        const basePoints = [0, 100, 300, 500, 800];
        let points = basePoints[Math.min(linesCount, 4)] * this.level;
        
        points *= this.scoreMultiplier;
        
        if (this.bondActive) {
            points *= this.bondMultiplier;
        }
        
        const comboMultiplier = 1 + (this.combo - 1) * 0.1;
        points *= comboMultiplier;
        
        this.score += Math.floor(points);
        this.lines += linesCount;
        
        if (this.gameMode === 'tower') {
            this.updateTowerProgress('lines', linesCount);
            this.updateTowerProgress('score', Math.floor(points));
            this.updateTowerProgress('combo', this.combo);
        }
        
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateDropInterval();
        }
        
        const otherSide = side === 'left' ? 'right' : 'left';
        this.addObstacles(otherSide, linesCount);
        
        this.checkSyncClear(side);
    },
    
    updateDropInterval: function() {
        let interval = Math.max(100, this.baseDropInterval - (this.level - 1) * 100);
        
        if (this.activeBuffs.includes('speed_down')) {
            interval = interval * 1.3;
        }
        if (this.activeDebuffs.includes('speed_up')) {
            interval = interval * 0.5;
        }
        
        this.dropInterval = Math.max(100, interval);
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
        
        const basePoints = 10000;
        let points = basePoints * this.scoreMultiplier;
        if (this.bondActive) {
            points *= this.bondMultiplier;
        }
        this.score += Math.floor(points);
        
        this.syncClearCount++;
        
        if (this.gameMode === 'tower') {
            this.updateTowerProgress('sync', 1);
        }
        
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
        this.comboEl.textContent = this.combo;
    },
    
    updatePowerUpUI: function() {
        this.updatePowerUpSlot('left', 1, this.POWER_UPS.GRAVITY_REVERSE);
        this.updatePowerUpSlot('left', 2, this.POWER_UPS.LINE_COPY);
        this.updatePowerUpSlot('left', 3, this.POWER_UPS.CLEAR_SINGLE);
        
        this.updatePowerUpSlot('right', 1, this.POWER_UPS.GRAVITY_REVERSE);
        this.updatePowerUpSlot('right', 2, this.POWER_UPS.LINE_COPY);
        this.updatePowerUpSlot('right', 3, this.POWER_UPS.CLEAR_SINGLE);
    },
    
    updatePowerUpSlot: function(side, slotNum, powerUp) {
        const powerUps = side === 'left' ? this.powerUpsLeft : this.powerUpsRight;
        const count = powerUps[powerUp.id] || 0;
        
        const iconEl = document.getElementById(`icon-${side}-${slotNum}`);
        const countEl = document.getElementById(`count-${side}-${slotNum}`);
        
        if (count > 0) {
            iconEl.textContent = powerUp.icon;
            iconEl.classList.add(powerUp.id.replace(/_/g, '-'));
        } else {
            iconEl.textContent = '';
            iconEl.classList.remove(powerUp.id.replace(/_/g, '-'));
        }
        
        countEl.textContent = count;
    },
    
    usePowerUp: function(side, slotNum) {
        if (!this.isRunning || this.isPaused) return;
        
        const powerUps = side === 'left' ? this.powerUpsLeft : this.powerUpsRight;
        let powerUp;
        
        switch(slotNum) {
            case 1:
                powerUp = this.POWER_UPS.GRAVITY_REVERSE;
                break;
            case 2:
                powerUp = this.POWER_UPS.LINE_COPY;
                break;
            case 3:
                powerUp = this.POWER_UPS.CLEAR_SINGLE;
                break;
        }
        
        if (!powerUps[powerUp.id] || powerUps[powerUp.id] <= 0) return;
        
        powerUps[powerUp.id]--;
        
        this.executePowerUp(side, powerUp);
        
        this.updatePowerUpUI();
    },
    
    executePowerUp: function(side, powerUp) {
        this.showPowerUpEffect(powerUp.name, powerUp.description);
        
        switch(powerUp.id) {
            case 'gravity_reverse':
                this.activateGravityReverse(side);
                break;
            case 'line_copy':
                this.activateLineCopy(side);
                break;
            case 'clear_single':
                this.clearSingleLine(side);
                break;
        }
    },
    
    showPowerUpEffect: function(title, desc) {
        this.powerUpEffectTitleEl.textContent = title + '!';
        this.powerUpEffectDescEl.textContent = desc;
        this.powerUpEffectEl.classList.remove('hidden');
        
        setTimeout(() => {
            this.powerUpEffectEl.classList.add('hidden');
        }, 1000);
    },
    
    activateGravityReverse: function(side) {
        this.gravityReverseActive = true;
        this.gravityReverseSide = side;
        this.gravityReverseStart = Date.now();
        
        this.gravityReverseIndicator.classList.remove('hidden');
        this.reverseStatusEl.textContent = side === 'left' ? '左侧自由操作' : '右侧自由操作';
        
        this.updateGravityReverseTimer();
    },
    
    updateGravityReverseTimer: function() {
        if (!this.gravityReverseActive) {
            return;
        }
        
        const now = Date.now();
        const elapsed = now - this.gravityReverseStart;
        const remaining = Math.max(0, this.GRAVITY_REVERSE_DURATION - elapsed);
        
        if (remaining <= 0) {
            this.deactivateGravityReverse();
            return;
        }
        
        this.reverseTimerEl.textContent = (remaining / 1000).toFixed(1) + 's';
        
        this.gravityReverseAnimationId = requestAnimationFrame(() => this.updateGravityReverseTimer());
    },
    
    deactivateGravityReverse: function() {
        this.gravityReverseActive = false;
        this.gravityReverseSide = null;
        this.gravityReverseIndicator.classList.add('hidden');
        
        if (this.gravityReverseAnimationId) {
            cancelAnimationFrame(this.gravityReverseAnimationId);
            this.gravityReverseAnimationId = null;
        }
    },
    
    activateLineCopy: function(side) {
        this.lineCopyActive = true;
        this.lineCopySide = side;
    },
    
    clearSingleLine: function(side) {
        const board = side === 'left' ? this.boardLeft : this.boardRight;
        const obstacleBoard = side === 'left' ? this.obstacleBoardLeft : this.obstacleBoardRight;
        
        const startRow = side === 'left' ? this.ROWS - 1 : 0;
        const endRow = side === 'left' ? -1 : this.ROWS;
        const step = side === 'left' ? -1 : 1;
        
        for (let row = startRow; row !== endRow; row += step) {
            let hasBlocks = false;
            for (let col = 0; col < this.COLS; col++) {
                if (board[row][col] || obstacleBoard[row][col]) {
                    hasBlocks = true;
                    break;
                }
            }
            
            if (hasBlocks) {
                for (let col = 0; col < this.COLS; col++) {
                    board[row][col] = 0;
                    obstacleBoard[row][col] = 0;
                }
                this.addLineClearEffect(side, [row]);
                
                for (let r = row; r > 0; r--) {
                    board[r] = [...board[r - 1]];
                    obstacleBoard[r] = [...obstacleBoard[r - 1]];
                }
                board[0] = Array(this.COLS).fill(0);
                obstacleBoard[0] = Array(this.COLS).fill(0);
                
                this.handleLineClear(side, 1);
                break;
            }
        }
        
        this.updateUI();
        this.draw();
    },
    
    setupTowerLevel: function() {
        if (this.towerLevel > this.MAX_TOWER_LEVEL) {
            this.towerComplete();
            return;
        }
        
        this.currentGoal = this.TOWER_GOALS[this.towerLevel - 1];
        this.towerProgress = 0;
        
        this.towerLevelEl.textContent = this.towerLevel;
        this.towerGoalEl.textContent = this.currentGoal.description;
        this.progressFillEl.style.width = '0%';
        
        if (this.towerLevel > 1 && this.towerLevel % 2 === 0) {
            this.showCardSelection();
        }
    },
    
    updateTowerProgress: function(type, amount) {
        if (!this.currentGoal || this.currentGoal.type !== type) return;
        
        this.towerProgress += amount;
        
        const progressPercent = Math.min(100, (this.towerProgress / this.currentGoal.amount) * 100);
        this.progressFillEl.style.width = progressPercent + '%';
        
        if (this.towerProgress >= this.currentGoal.amount) {
            this.towerLevel++;
            this.setupTowerLevel();
        }
    },
    
    showCardSelection: function() {
        this.isPaused = true;
        
        this.cardTitleEl.textContent = '选择一张卡牌';
        this.cardSubtitleEl.textContent = `第 ${this.towerLevel} 层奖励`;
        
        this.cardsContainerEl.innerHTML = '';
        
        const allCards = [...this.BUFFS, ...this.DEBUFFS];
        const selectedCards = [];
        
        while (selectedCards.length < 3 && allCards.length > 0) {
            const index = Math.floor(Math.random() * allCards.length);
            selectedCards.push(allCards.splice(index, 1)[0]);
        }
        
        selectedCards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = `card ${card.type}`;
            cardEl.innerHTML = `
                <div class="card-icon">${card.icon}</div>
                <div class="card-title">${card.name}</div>
                <div class="card-desc">${card.description}</div>
            `;
            
            cardEl.addEventListener('click', () => this.selectCard(card));
            this.cardsContainerEl.appendChild(cardEl);
        });
        
        this.cardSelectionEl.classList.remove('hidden');
    },
    
    selectCard: function(card) {
        if (card.type === 'buff') {
            this.applyBuff(card);
        } else {
            this.applyDebuff(card);
        }
        
        this.cardSelectionEl.classList.add('hidden');
        this.isPaused = false;
        this.lastDropTime = Date.now();
    },
    
    applyBuff: function(buff) {
        this.activeBuffs.push(buff.id);
        
        switch(buff.id) {
            case 'speed_down':
                this.updateDropInterval();
                break;
            case 'score_boost':
                this.scoreMultiplier *= 1.5;
                break;
            case 'extra_powerup':
                for (let i = 0; i < 2; i++) {
                    this.grantRandomPowerUp();
                }
                break;
            case 'ghost_preview':
                break;
        }
    },
    
    applyDebuff: function(debuff) {
        this.activeDebuffs.push(debuff.id);
        
        switch(debuff.id) {
            case 'speed_up':
                this.updateDropInterval();
                break;
            case 'obstacle_spawn':
                this.addObstacles('left', 2);
                this.addObstacles('right', 1);
                this.draw();
                break;
            case 'score_reduce':
                this.scoreMultiplier *= 0.7;
                break;
            case 'control_invert':
                this.controlInverted = true;
                this.controlInvertEnd = Date.now() + 10000;
                break;
        }
    },
    
    towerComplete: function() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        this.towerCompleteDescEl.textContent = `你已到达悖论之塔的顶端，最高连击: ${this.maxCombo}`;
        this.towerCompleteScoreEl.textContent = this.score;
        this.towerCompleteEl.classList.remove('hidden');
    },
    
    drop: function() {
        if (!this.isRunning || this.isPaused) return;
        if (!this.currentPieceLeft || !this.currentPieceRight) return;
        
        if (this.controlInverted && this.controlInvertEnd && Date.now() > this.controlInvertEnd) {
            this.controlInverted = false;
        }
        
        if (this.gravityReverseActive) {
            this.dropSingleSide();
            return;
        }
        
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
    
    dropSingleSide: function() {
        const side = this.gravityReverseSide;
        const piece = side === 'left' ? this.currentPieceLeft : this.currentPieceRight;
        const board = side === 'left' ? this.boardLeft : this.boardRight;
        const otherPiece = side === 'left' ? this.currentPieceRight : this.currentPieceLeft;
        const otherBoard = side === 'left' ? this.boardRight : this.boardLeft;
        
        const dy = side === 'left' ? 1 : -1;
        const otherDy = side === 'left' ? -1 : 1;
        
        const canDrop = !this.checkCollision(board, piece, 0, dy);
        const canDropOther = !this.checkCollision(otherBoard, otherPiece, 0, otherDy);
        
        if (canDrop) {
            piece.y += dy;
        }
        
        if (canDropOther) {
            otherPiece.y += otherDy;
        }
        
        if (!canDrop && !canDropOther) {
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
                    const isBonded = this.isCellBonded(side, row, col);
                    this.drawCell(ctx, col, row, colors.normal[colorIndex], side, false, isBonded);
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
            
            const ghostAlpha = this.activeBuffs.includes('ghost_preview') ? 0.5 : 0.3;
            ctx.globalAlpha = ghostAlpha;
            for (let row = 0; row < currentPiece.shape.length; row++) {
                for (let col = 0; col < currentPiece.shape[row].length; col++) {
                    if (currentPiece.shape[row][col]) {
                        this.drawCell(ctx, currentPiece.x + col, ghostY + row, colors.normal[currentPiece.colorIndex], side, true);
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
    
    isCellBonded: function(side, row, col) {
        return this.bondedCells.some(bond => {
            if (side === 'left') {
                return bond.left.row === row && bond.left.col === col;
            } else {
                return bond.right.row === row && bond.right.col === col;
            }
        });
    },
    
    drawCell: function(ctx, x, y, color, side, isGhost = false, isBonded = false) {
        const px = x * this.CELL_SIZE;
        const py = y * this.CELL_SIZE;
        const padding = 2;
        const size = this.CELL_SIZE - padding * 2;
        
        if (isGhost) {
            ctx.globalAlpha = 0.3;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(px + padding, py + padding, size, size);
        
        if (isBonded) {
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + padding, py + padding, size, size);
        }
        
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
        if (this.isRunning) {
            if (this.gameLoop) {
                cancelAnimationFrame(this.gameLoop);
                this.gameLoop = null;
            }
            this.closeSyncWindow();
            this.deactivateGravityReverse();
            this.isRunning = false;
        }
        
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
        
        if (Date.now() - this.lastClearTime > this.COMBO_TIMEOUT && this.combo > 0) {
            this.combo = 0;
            this.updateUI();
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
    
    setGameMode: function(mode) {
        this.gameMode = mode;
        
        this.modeOptions.forEach(option => {
            if (option.dataset.mode === mode) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        if (this.isRunning) {
            this.reset();
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
                case '1':
                    this.usePowerUp('left', 1);
                    break;
                case '2':
                    this.usePowerUp('left', 2);
                    break;
                case '3':
                    this.usePowerUp('left', 3);
                    break;
                case '7':
                    this.usePowerUp('right', 1);
                    break;
                case '8':
                    this.usePowerUp('right', 2);
                    break;
                case '9':
                    this.usePowerUp('right', 3);
                    break;
            }
        });
        
        this.startBtn.addEventListener('click', () => this.start());
        this.restartBtn.addEventListener('click', () => {
            this.gameOverEl.classList.add('hidden');
            this.start();
        });
        
        this.towerRestartBtn.addEventListener('click', () => {
            this.towerCompleteEl.classList.add('hidden');
            this.gameMode = 'tower';
            this.start();
        });
        
        this.modeOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.setGameMode(option.dataset.mode);
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
