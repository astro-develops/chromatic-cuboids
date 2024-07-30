
// canvases
const canvas3d = document.getElementById("canvas-3d");
const canvas2d = document.getElementById("canvas-2d");

const DL = Drawlite(canvas2d);
window.DL = DL;
const {
    PI, TWO_PI, EPSILON, CORNER, CORNERS, LEFT, RIGHT, TOP, CENTER, BOTTOM, BASELINE, RADIUS, DEGREES, RADIANS, POINTS, LINES, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN, QUADS, QUAD_STRIP, CLOSE, ROUND, PROJECT, SQUARE, BEVEL, MITER, RGB, HSB, NATIVE, canvas, Color, PerlinNoise, PRNG, vec3, ctx, size, angleMode, noloop, loop, frameRate, min, max, floor, round, ceil, abs, constrain, sq, sqrt, pow, sin, cos, tan, asin, acos, atan, atan2, log, random, dist, map, lerp, radians, degrees, color, lerpColor, fill, stroke, strokeWeight, strokeCap, strokeJoin, noStroke, noFill, beginShape, vertex, curveVertex, bezierVertex, bezierPoint, bezierTangent, splineTightness, splineVertex, splinePoint, splineTangent, lerpSpline, endShape, spline, snip, imageMode, image, loadImage, font, textSize, textAlign, textWidth, textAscent, textDescent, textLeading, text, background, point, line, rectMode, rect, triangle, quad, arc, circle, ellipseMode, ellipse, bezier, get, autoUpdateDynamics, pushMatrix, popMatrix, resetMatrix, scale, translate, rotate, loadPixels, updatePixels, colorMode, enableContextMenu, millis, second, minute, hour, day, month, year, smooth, nosmooth, createGraphics, getProperties, Touch
} = DL;
autoUpdateDynamics(); // this will be the default in the next vr

// set dimensions
canvas3d.width = canvas2d.width = window.innerWidth;
canvas3d.height = canvas2d.height = window.innerHeight;

// setup 3.js stuff
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
window.camera = camera; // for debugging
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas3d
});
renderer.setSize(window.innerWidth, window.innerHeight);

// create skybox
const loader = new THREE.CubeTextureLoader();
const perlin = new PerlinNoise();
loadPixels();
let pixels = get.imageData.data;
console.log(get.imageData)
for (let i = 0; i < pixels.length; i += 4) {
    pixels[i++] = 0;
    pixels[i++] = 100;
    pixels[i++] = 100;
    pixels[i++] = 255;
}
updatePixels();
const texture = new THREE.CanvasTexture(canvas2d);
scene.background = texture;

const keys = {};
document.body.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});
document.body.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});

const FLOOR_MATERIAL = new THREE.MeshBasicMaterial({ color: new Color(0, 75, 0).toInt() });

// So that each user can look different
const SKINS = [
    new THREE.MeshBasicMaterial({ color: new Color(0, 200, 0).toInt() }),
];

// All other cubes are instances of this geometry
const CUBE = new THREE.BoxGeometry(1, 1, 1);

const PLAYERS = [];

const LEVELS = [
    [
        "               ",
        "       1       ",
        "       0       ",
        "      000      ",
        "0000       0000",
        "              0",
        "     0  0000  0",
        "           0 00",
        "0     0    0  0",
        "00    0    00 0",
        "      000  0  0",
        "   1       0 00",
        " 000000 0000  0",
        "              0",
        "000000000000000"
    ]
];

let secondsFromPrevFrame = 0;

class User {
    px; py; pz;
    x; y; z;
    xVel = 0; yVel = 0; zVel = 0;
    xTheta = 0;
    yTheta = 0;
    speed = 5;
    jumping = false;
    canJump = true;
    skin;
    mesh;
    isClient = false;

    constructor(x, y, z) {
        this.px = this.x = x;
        this.py = this.y = y;
        this.pz = this.z = z;

        this.skin = SKINS[0];
        this.mesh = new THREE.Mesh(CUBE, this.skin);

        scene.add(this.mesh);
    }

    move() {
        if (this.isClient) {
            // foreward
            if (keys["w"]) {
                user.xVel = sin(user.yTheta) * user.speed;
                user.zVel = cos(user.yTheta) * user.speed;
            }

            // backward
            if (keys["s"]) {
                user.xVel = -sin(user.yTheta) * user.speed;
                user.zVel = -cos(user.yTheta) * user.speed;
            }

            // left
            if (keys["a"]) {
                user.xVel = sin(user.yTheta - 90) * user.speed;
                user.zVel = cos(user.yTheta - 90) * user.speed;
            }

            // right
            if (keys["d"]) {
                user.xVel = -sin(user.yTheta - 90) * user.speed;
                user.zVel = -cos(user.yTheta - 90) * user.speed;
            }

            user.x += user.xVel * secondsFromPrevFrame;
            user.z += user.zVel * secondsFromPrevFrame;

             // slow down user
            user.xVel *= constrain(0.00011 / secondsFromPrevFrame, 0, 1);
            user.zVel *= constrain(0.00011 / secondsFromPrevFrame, 0, 1);

            // jump
            if (keys[" "] && !user.jumping && user.canJump) {
                user.yVel = 5;
                user.jumping = true;
            }
            
            user.y += user.yVel * secondsFromPrevFrame;

            // temporarily simulate floor until proper physics is implemented
            //astro will implement cannon.js physics later
            if (user.y < 1) {
                user.y = 1;
                user.yVel = 0;
                user.jumping = false;
                user.canJump = true;
            } else {
                user.canJump = false;                
                user.yVel -= 0.25;
            }
            
        }
    }

    update() {
        this.mesh.position.x = this.x;
        this.mesh.position.y = this.y;
        this.mesh.position.z = this.z;
    }
}

let user = new User(5, 0, 5);
user.isClient = true;
window.user = user; //debugging
PLAYERS.push(user);

let level = [];

// generate level
for (let z = 0; z < LEVELS[0].length; z++) {
    let row = LEVELS[0][z];
    for (let x = 0; x < row.length; x++) {
        switch (row[x]) {
            case "0": {
                let voxel = new THREE.Mesh(CUBE, FLOOR_MATERIAL);
                voxel.position.x = x;
                voxel.position.y = 0;
                voxel.position.z = z;
                scene.add(voxel);
                level.push(voxel);
                break;
            }
        }
    }
}

camera.velocity = { x: 0, y: 0, z: 0 };

let prevFrameTimestamp = 0;
frameRate(NATIVE);
DL.draw = function() {
    let ms = Date.now();
    secondsFromPrevFrame = (ms - prevFrameTimestamp) / 1000;
    prevFrameTimestamp = ms;

    noStroke();
    fill(255, 128);
    rect(0, 0, 200, 220);

    fill(0);
    textAlign(LEFT, TOP);
    textSize(18);
    text([
        `x: ${user.x.toFixed(2)}`,
        `y: ${user.y.toFixed(2)}`,
        `z: ${user.z.toFixed(2)}`,
        `xVel: ${user.xVel.toFixed(2)}`,
        `yVel: ${user.yVel.toFixed(2)}`,
        `zVel: ${user.zVel.toFixed(2)}`,
        `xTheta: ${user.xTheta.toFixed(2)}`,
        `yTheta: ${user.yTheta.toFixed(2)}`,
        `keys: ${Object.keys(keys).filter(k => keys[k])}`,
    ].join("\n"), 8, 8);
    
    for (let i = 0; i < PLAYERS.length; i++) {
        PLAYERS[i].move();
        PLAYERS[i].update();
    }

    camera.velocity.x = (user.x - camera.position.x) / 10;
    camera.velocity.y = (user.y + 2 - camera.position.y) / 10;
    camera.velocity.z = (user.z + 5 - camera.position.z) / 10;
    
    camera.position.x += camera.velocity.x;
    camera.position.y += camera.velocity.y;
    camera.position.z += camera.velocity.z;

    renderer.render(scene, camera);
};