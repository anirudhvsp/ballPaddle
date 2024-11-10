class SpectatorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SpectatorScene' });
        this.previousState = null;
        this.currentState = null;
        this.interpolationTime = 0;
        this.lastFrameTime = 0;
    }

    preload() {
        // Same preload code as in game.js
        this.graphics = this.add.graphics();
        this.graphics.fillStyle(0x000000, 1);
        this.graphics.fillCircle(5, 5, 5);
        this.graphics.generateTexture('ball', 10, 10);
        this.graphics.destroy();

        this.graphics = this.add.graphics();
        this.graphics.fillStyle(0xFFFFFF, 1);
        this.graphics.fillCircle(5, 5, 5);
        this.graphics.generateTexture('ballWhite', 10, 10);
        this.graphics.destroy();

        this.graphics = this.add.graphics();
        this.graphics.fillStyle(0x000000, 1);
        this.graphics.fillRect(0, 0, 150, 25);
        this.graphics.generateTexture('paddleBlack', 150, 25);
        this.graphics.destroy();

        this.graphics = this.add.graphics();
        this.graphics.fillStyle(0xFFFFFF, 1);
        this.graphics.fillRect(0, 0, 150, 25);
        this.graphics.generateTexture('paddleWhite', 150, 25);
        this.graphics.destroy();
    }

    create() {
        this.paddles = {};
        this.balls = [];
        this.bricks = new Phaser.GameObjects.Group(this);
        
        // Create score text
        this.blackScoreText = this.add.text(15, config.height - 55, '0', 
            { fontSize: '32px', fill: '#000000' }).setDepth(1);
        this.whiteScoreText = this.add.text(config.width - 75, 10, '0', 
            { fontSize: '32px', fill: '#FFFFFF' }).setDepth(1);

        // Setup WebSocket
        const roomId = window.location.pathname.split('/')[2];
        this.ws = new WebSocket(`ws://${window.location.host}/${roomId}`);
        this.ws.onmessage = this.handleWebSocketMessage.bind(this);
    }

    handleWebSocketMessage(event) {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.type === 'gameState') {
            this.previousState = this.currentState;
            this.currentState = data.state;
            this.interpolationTime = 0;
            
            // Sync local frame rate with master client
            if (this.currentState && this.previousState) {
                const frameDelta = this.currentState.frame - this.previousState.frame;
                const timeDelta = this.currentState.timestamp - this.previousState.timestamp;
                if (timeDelta > 0) {
                    this.game.loop.targetFps = Math.min(60, 1000 / (timeDelta / frameDelta));
                }
            }
        }
    }

    update(time, delta) {
        if (!this.currentState || !this.previousState) return;

        // Calculate interpolation factor
        this.interpolationTime += delta;
        const frameTime = 1000 / this.currentState.fps;
        const alpha = Math.min(1, this.interpolationTime / frameTime);

        // Interpolate positions
        this.interpolateGameState(alpha);
    }

    interpolateGameState(alpha) {
        // Interpolate paddles
        Object.entries(this.currentState.paddles).forEach(([type, paddle]) => {
            const prevPaddle = this.previousState.paddles[type];
            if (!this.paddles[type]) {
                this.paddles[type] = this.add.image(
                    paddle.x,
                    paddle.y,
                    type === 'black' ? 'paddleBlack' : 'paddleWhite'
                ).setDepth(1); // Set depth for z ordering
            }
            this.paddles[type].x = this.lerp(prevPaddle.x, paddle.x, alpha);
            this.paddles[type].y = this.lerp(prevPaddle.y, paddle.y, alpha);
        });

        // Interpolate balls
        this.currentState.balls.forEach((ball, i) => {
            const prevBall = this.previousState.balls[i];
            if (!this.balls[i]) {
                this.balls[i] = this.add.image(ball.x, ball.y, 
                    ball.type === 'black' ? 'ball' : 'ballWhite')
                    .setDisplaySize(20, 20).setDepth(1); // Set depth for z ordering
            }
            if (prevBall) {
                this.balls[i].x = this.lerp(prevBall.x, ball.x, alpha);
                this.balls[i].y = this.lerp(prevBall.y, ball.y, alpha);
            }
        });

        // Update scores immediately (no interpolation needed)
        if (this.currentState.scores.black !== this.previousState.scores.black ||
            this.currentState.scores.white !== this.previousState.scores.white) {
            this.updateScores();
        }

        // Update bricks only when they change
        if (JSON.stringify(this.currentState.bricks) !== JSON.stringify(this.previousState.bricks)) {
            this.updateBricks();
        }
    }

    lerp(start, end, alpha) {
        return start + (end - start) * alpha;
    }

    updateBricks() {
        this.bricks.clear(true, true);
        this.currentState.bricks.forEach(brick => {
            const brickSprite = this.add.rectangle(
                brick.x,
                brick.y,
                60,
                30,
                brick.type === 'black' ? 0x000000 : 0xFFFFFF
            ).setDepth(0); // Set depth for z ordering
            this.bricks.add(brickSprite);
        });
    }

    updateScores() {
        this.blackScoreText.setText(this.currentState.scores.black);
        this.whiteScoreText.setText(this.currentState.scores.white);
    }
} 