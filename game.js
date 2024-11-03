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

const brickHeight = 30;
const brickWidth = 30;
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
}


function create() {
    // Create the paddle
    paddle = this.physics.add.image(config.width/2, config.height-50, null).setDisplaySize(100, 20).setImmovable(true);
    paddle.body.allowGravity = false;
    paddle.setDepth(1);
    paddle.setTint(0x000000); // Black paddle

    // Create the ball using the generated texture
    ball = this.physics.add.image(config.width/2, config.height-70, 'ball');
    ball.setDisplaySize(20, 20); // Set size to look like a circle
    ball.setCollideWorldBounds(true);
    ball.setBounce(1); // Reflective bounce
    ball.setData('type', "black")
    ball.setDepth(1);
    // Initial ball velocity
    ball.setVelocity(500, -500);


    ball2 = this.physics.add.image(config.width/2, 70, 'ballWhite');
    ball2.setDisplaySize(20, 20); // Set size to look like a circle
    ball2.setCollideWorldBounds(true);
    ball2.setBounce(1); // Reflective bounce
    ball2.setData('type', "white")
    ball2.setDepth(1);
    // I2nitial ball velocity
    ball2.setVelocity(500, -500);

    // Create bricks
    bricks = this.physics.add.staticGroup();
    for (let y = brickHeight/2; y < config.height-brickHeight/2; y += brickHeight) {
        for (let x = brickWidth/2; x < config.width-brickWidth/2; x += brickWidth) {
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

    // Collision between ball and paddle
    this.physics.add.collider(ball, paddle, hitPaddle, null, this);

    // Collision between ball and bricks
    this.physics.add.collider(ball, bricks, hitBrick, processCollision, this);
    this.physics.add.collider(ball2, bricks, hitBrick, processCollision, this);

    // Keyboard controls for paddle
    cursors = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });
}

function update() {
    // Paddle movement
    if (cursors.left.isDown) {
        paddle.setVelocityX(-1000);
    } else if (cursors.right.isDown) {
        paddle.setVelocityX(1000);
    } else {
        paddle.setVelocityX(0);
    }
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
        } else {
            brick.setFillStyle(0x000000);
            brick.setData("type", "black");
        }
    }
    else{
        return;
    }
}

function processCollision(ball, brick) {
    return ball.getData('type') == brick.getData('type');
}