const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#ffffff',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let paddle;
let ball;
let ball2;
let bricks;
let cursors;
let balls = [];
let paddles = [];

let paddleConfigs = [
    { x: config.width / 2, y: config.height - 25, texture: 'paddleBlack', type: 'black' },
    { x: config.width / 2, y: 25, texture: 'paddleWhite', type: 'white' }
];

let ballConfigs = [
    { x: config.width / 2, y: config.height - 70, texture: 'ball', type: 'black' },
    { x: config.width / 2, y: 70, texture: 'ballWhite', type: 'white' }
];


const brickHeight = 30;
const brickWidth = 60;

// Add game state object
const gameState = {
    paddles: {
        black: { x: 0, y: 0, width: 150, height: 25 },
        white: { x: 0, y: 0, width: 150, height: 25 }
    },
    balls: [],
    bricks: [],
    scores: {
        black: 0,
        white: 0
    },
    hits : 0,
    mouseX: 0
};

function preload() {
    // Create a graphics object to use as the ball
    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillCircle(5, 5, 5);  // Create a 10x10 black circle
    this.graphics.generateTexture('ball', 10, 10);
    this.graphics.destroy();


    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0xFFFFFF, 1);
    this.graphics.fillCircle(5, 5, 5);  // Create a 10x10 black circle
    this.graphics.generateTexture('ballWhite', 10, 10);
    this.graphics.destroy();
    // Add paddle texture generation
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

    // Add yellow brick texture
    this.graphics = this.add.graphics();
    this.graphics.fillStyle(0xFFFF00, 1);
    this.graphics.fillRect(0, 0, brickWidth, brickHeight);
    this.graphics.generateTexture('yellowBrick', brickWidth, brickHeight);
    this.graphics.destroy();
}


function create() {
    // Initialize paddle positions in state
    this.blackScore = 0; // Initialize black score
    this.whiteScore = 0; // Initialize white score
    this.blackScoreText = this.add.text(15, config.height - 55, '0', { fontSize: '32px', fill: '#000000' }); // Bottom left
    this.whiteScoreText = this.add.text(config.width - 75, 10, ' 0', { fontSize: '32px', fill: '#FFFFFF' }); // Top right
    this.whiteScoreText.setDepth(1);
    this.blackScoreText.setDepth(1);



    paddleConfigs.forEach(config => {
        gameState.paddles[config.type].x = config.x;
        gameState.paddles[config.type].y = config.y;
        
        let paddle = this.physics.add.image(config.x, config.y, config.texture)
            .setImmovable(true);
        paddle.body.allowGravity = false;
        paddle.setDepth(1);
        paddle.setData('type', config.type);
        paddles.push(paddle);
    });

    // Update mouse handler to modify state instead of paddle directly
    this.input.on('pointermove', function (pointer) {
        gameState.mouseX = pointer.x;
    });

    // Initialize balls in state
    ballConfigs.forEach(config => {
        const ballState = {
            x: config.x,
            y: config.y,
            velocityX: 500,
            velocityY: config.type === 'white' ? 500 : -500,
            type: config.type
        };
        gameState.balls.push(ballState);
        balls.push(createBall(this, ballState));
    });

    // Initialize bricks in state
    for (let y = brickHeight/2; y < config.height-brickHeight/2; y += brickHeight) {
        for (let x = brickWidth/2; x < config.width-brickWidth/3; x += brickWidth) {
            var type,color;
            if(y > config.height/2){
                type = "white"
                color = 0xFFFFFF
            } 
            else{
                type = "black"
                color = 0x000000
            }
            const brickState = {
                x: x,
                y: y,
                type: type,
                color :color
                
            };
            
            gameState.bricks.push(brickState);
        }
    }
    bricks = this.physics.add.staticGroup();
    for(i in gameState.bricks){
        let brick = this.add.rectangle(gameState.bricks[i].x,gameState.bricks[i].y,brickWidth, brickHeight, gameState.bricks[i].color);
        brick.setData('type', gameState.bricks[i].type);
        bricks.add(brick);
    }
    balls.forEach(ball => {
        paddles.forEach(paddle => {
            this.physics.add.collider(ball, paddle, hitPaddle, null, this);
        });
        this.physics.add.collider(ball, bricks, hitBrick, processCollision, this);
    });
    // // Keyboard controls for paddle
    // cursors = this.input.keyboard.addKeys({
    //     left: Phaser.Input.Keyboard.KeyCodes.A,
    //     right: Phaser.Input.Keyboard.KeyCodes.D
    // });
}

// Update createBall to use state
function createBall(context, ballState) {
    let ball = context.physics.add.image(ballState.x, ballState.y, 
        ballState.type === 'black' ? 'ball' : 'ballWhite');
    ball.setDisplaySize(20, 20);
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);
    ball.setData('type', ballState.type);
    ball.setDepth(1);
    ball.setVelocity(ballState.velocityX, ballState.velocityY);
    return ball;
}

// Modify update function to sync game objects with state
function update() {
    // Update black paddle position based on mouse state
    const blackPaddle = paddles.find(p => p.getData('type') === 'black');
    const clampedX = Phaser.Math.Clamp(
        gameState.mouseX, 
        blackPaddle.width/2, 
        config.width - blackPaddle.width/2
    );
    gameState.paddles.black.x = clampedX;
    blackPaddle.x = clampedX;

    // Update ball positions in state
    balls.forEach((ball, index) => {
        gameState.balls[index].x = ball.x;
        gameState.balls[index].y = ball.y;
        gameState.balls[index].velocityX = ball.body.velocity.x;
        gameState.balls[index].velocityY = ball.body.velocity.y;
    });

    // Check for temporary balls that need to be removed
    const currentTime = Date.now();
    balls = balls.filter((ball) => {
        if (ball.getData('temp10') && currentTime - ball.getData('spawnTime') > 5000) {
            // Remove from gameState.balls array
            gameState.balls = gameState.balls.filter(b => 
                !(b.temp10 && currentTime - b.spawnTime > 5000)
            );
            // Destroy the ball sprite
            ball.destroy();
            return false;
        }
        return true;
    });
}

function hitPaddle(ball, paddle) {
    let diff = ball.x - paddle.x;
    ball.setVelocityX(10 * diff); // Change angle based on hit position
}

// Modify hitBrick to update state
function hitBrick(ball, brick) {
    if(ball.getData('type') == brick.getData('type')) {
        gameState.hits++;
        
        let newType = brick.getData('type') === 'black' ? 'white' : 'black';
        
        // Update brick state
        let brickState = gameState.bricks.find(b => b.x === brick.x && b.y === brick.y);
        brickState.type = newType;
        
        // Update score in state
        if(newType === 'white') {
            gameState.scores.black++;
            this.blackScoreText.setText(gameState.scores.black);
        } else {
            gameState.scores.white++;
            this.whiteScoreText.setText(gameState.scores.white);
        }
        if (gameState.hits % 11 === 0) {
            newType = 'yellow';
            brick.setFillStyle(0xFFFF00);
        } else {
            brick.setFillStyle(newType === 'black' ? 0x000000 : 0xFFFFFF);
        }
        brick.setData('type', newType);
    }else if(brick.getData('type') === 'yellow') {
        // Split the ball into two
        const newBall = this.physics.add.image(ball.x, ball.y, ball.texture.key);
        newBall.setDisplaySize(20, 20);  // Match original ball size
        newBall.setCollideWorldBounds(true);
        newBall.setBounce(1);
        newBall.setData('type', ball.getData('type'));
        newBall.setDepth(1);
        newBall.body.setVelocityX(ball.body.velocity.x);
        newBall.body.setVelocityY(-ball.body.velocity.y);  // Reverse Y velocity for variation
        
        // Add temporary tag and timer
        newBall.setData('temp10', true);
        newBall.setData('spawnTime', Date.now());
        
        // Add colliders for the new ball
        paddles.forEach(paddle => {
            this.physics.add.collider(newBall, paddle, hitPaddle, null, this);
        });
        this.physics.add.collider(newBall, bricks, hitBrick, processCollision, this);
        
        balls.push(newBall);

        // Update game state with the new ball
        gameState.balls.push({
            x: newBall.x,
            y: newBall.y,
            velocityX: newBall.body.velocity.x,
            velocityY: newBall.body.velocity.y,
            type: ball.getData('type'),
            temp10: true,
            spawnTime: Date.now()
        });

        // Destroy the yellow brick
        brick.destroy();
    }
}

function processCollision(ball, brick) {
    return ball.getData('type') === brick.getData('type') || brick.getData('type') === 'yellow';
}