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
}


function create() {
    // Update paddle creation to use textures
    paddleConfigs.forEach(config => {
        let paddle = this.physics.add.image(config.x, config.y, config.texture)
            .setImmovable(true);
        paddle.body.allowGravity = false;
        paddle.setDepth(1);
        paddle.setData('type', config.type);
        paddles.push(paddle);
    });

    // Mouse control for black paddle only
    this.input.on('pointermove', function (pointer) {
        let blackPaddle = paddles.find(p => p.getData('type') === 'black');
        blackPaddle.x = Phaser.Math.Clamp(pointer.x, blackPaddle.width/2, config.width - blackPaddle.width/2);
    });

    this.blackScore = 0; // Initialize black score
    this.whiteScore = 0; // Initialize white score
    this.blackScoreText = this.add.text(15, config.height - 55, '0', { fontSize: '32px', fill: '#000000' }); // Bottom left
    this.whiteScoreText = this.add.text(config.width - 75, 10, ' 0', { fontSize: '32px', fill: '#FFFFFF' }); // Top right
    this.whiteScoreText.setDepth(1);
    this.blackScoreText.setDepth(1);

    ballConfigs.forEach(config => {
        balls.push(createBall(this, config.x, config.y, config.texture, config.type));
    });
    // Create bricks
    bricks = this.physics.add.staticGroup();
    for (let y = brickHeight/2; y < config.height-brickHeight/2; y += brickHeight) {
        for (let x = brickWidth/2; x < config.width-brickWidth/3; x += brickWidth) {
            if(y<config.height/2){
                let brick = this.add.rectangle(x, y, brickWidth, brickHeight, 0x000000);
                brick.setData('type', "black");
                bricks.add(brick);
            }
            else{
                let brick = this.add.rectangle(x, y, brickWidth, brickHeight, 0xFFFFFF);
                brick.setData('type', "white");
                bricks.add(brick);
            }
        }
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
// Function to create a ball
function createBall(context, x, y, texture, type) {
    let ball = context.physics.add.image(x, y, texture);
    ball.setDisplaySize(20, 20); // Set size to look like a circle
    ball.setCollideWorldBounds(true);
    ball.setBounce(1); // Reflective bounce
    ball.setData('type', type);
    ball.setDepth(1);
    if (type === 'white') {
        const randomX = Phaser.Math.Between(-500, 500); // Random X velocity
        const randomY = Phaser.Math.Between(-500, -300); // Random Y velocity (upward)
        ball.setVelocity(randomX, randomY);
    } else {
        ball.setVelocity(500, -500); // Initial ball velocity for black balls
    }
    return ball;
}
function update() {
    // Paddle movement
    // if (cursors.left.isDown) {
    //     paddle.setVelocityX(-1000);
    // } else if (cursors.right.isDown) {
    //     paddle.setVelocityX(1000);
    // } else {
    //     paddle.setVelocityX(0);
    // }
}

function hitPaddle(ball, paddle) {
    let diff = ball.x - paddle.x;
    ball.setVelocityX(10 * diff); // Change angle based on hit position
}

function hitBrick(ball, brick) {
    if(ball.getData('type') == brick.getData('type')){
        if(brick.getData('type') == "black"){
            brick.setFillStyle(0xFFFFFF);
            brick.setData("type", "white");
            this.blackScore++; // Increment black score
            this.blackScoreText.setText(this.blackScore); // Update score display
        } else {
            brick.setFillStyle(0x000000);
            brick.setData("type", "black");
            this.whiteScore++; // Increment white score
            this.whiteScoreText.setText(this.whiteScore); // Update score displayd
        }
    }
    else{
        return;
    }
}

function processCollision(ball, brick) {
    return ball.getData('type') == brick.getData('type');
}