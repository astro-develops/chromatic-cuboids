// canvases
const canvas3d = document.getElementById("canvas-3d"),
canvas2d = document.getElementById("canvas-2d");

const DL = Drawlite(canvas2d);
window.DL = DL;
const {
    PI, TWO_PI, EPSILON, CORNER, CORNERS, LEFT, RIGHT, TOP, CENTER, BOTTOM, BASELINE, RADIUS, DEGREES, RADIANS, POINTS, LINES, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN, QUADS, QUAD_STRIP, CLOSE, ROUND, PROJECT, SQUARE, BEVEL, MITER, RGB, HSB, NATIVE, canvas, Color, PerlinNoise, PRNG, vec3, ctx, size, angleMode, noloop, loop, frameRate, min, max, floor, round, ceil, abs, constrain, sq, sqrt, pow, sin, cos, tan, asin, acos, atan, atan2, log, random, dist, map, lerp, radians, degrees, color, lerpColor, fill, stroke, strokeWeight, strokeCap, strokeJoin, noStroke, noFill, beginShape, vertex, curveVertex, bezierVertex, bezierPoint, bezierTangent, splineTightness, splineVertex, splinePoint, splineTangent, lerpSpline, endShape, spline, snip, imageMode, image, loadImage, font, textSize, textAlign, textWidth, textAscent, textDescent, textLeading, text, background, point, line, rectMode, rect, triangle, quad, arc, circle, ellipseMode, ellipse, bezier, get, autoUpdateDynamics, pushMatrix, popMatrix, resetMatrix, scale, translate, rotate, loadPixels, updatePixels, colorMode, enableContextMenu, millis, second, minute, hour, day, month, year, smooth, nosmooth, createGraphics, getProperties, Touch
} = DL;
autoUpdateDynamics(); // this will be the default in the next version of Drawlite

// setup 3.js stuff
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight , 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: canvas3d
});

window.camera = camera; // for debugging
// set dimensions
renderer.setSize(window.innerWidth, window.innerHeight);
size(window.innerWidth, window.innerHeight);

let width = get.width, height = get.height;
const perlin = new PerlinNoise();
perlin.setDetail(3, 0.5);

let keys = {};
let mouseSensitivity = 0.45;

// create skybox

let skyGraphic = createGraphics(500, 500);
skyGraphic.pushMatrix();
    skyGraphic.translate(0, 30);
    skyGraphic.scale(width/400);
    
    skyGraphic.background(0, 0, 0);
    
    skyGraphic.noStroke();
    for(var i = 0; i < 6000; i++){
        var s = random(50);
        skyGraphic.fill(0, 0, 255, 1);
        skyGraphic.ellipse(random(-10, 410), random(-40, 410), s, s);
    }
    for(var i = 0; i < 6000; i++){
        var s = random(50);
        skyGraphic.fill(0, 255, 255, 1);
        skyGraphic.ellipse(random(-10, 410), random(-40, 410), s, s);
    }
    for(var i = 0; i < 6000; i++){
        var s = random(50);
        skyGraphic.fill(255, 0, 0, 1);
        skyGraphic.ellipse(random(-10, 410), random(-40, 410), s, s);
    }
    
    skyGraphic.noFill();
    for(var s = 600; s > 0; s--){
        skyGraphic.stroke(0, 150, 255, 70-s/7);
        skyGraphic.ellipse(200, 175, s, s);
    }
    
    skyGraphic.fill(255, 255, 255);
    var ss = [1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,3,3,3,5,7,9];
    for(var i = 0; i < 300; i++){
        var pos = [random(0, 600), random(-30, 370)];
        if(dist(pos[0], pos[1], 300, 175) > 170/2){
            var s = ss[floor(random(0, ss.length-1))];
            skyGraphic.ellipse(pos[0], pos[1], s, s);
        }
        
    }
skyGraphic.popMatrix();
let skyboxPlaneGeometry = new THREE.PlaneGeometry(1000, 1000);
let skyboxTex = new THREE.CanvasTexture(skyGraphic.canvas);
let skyboxMat = new THREE.MeshBasicMaterial({ map: skyboxTex, side: THREE.DoubleSide });
let skybox = [
    new THREE.Mesh(skyboxPlaneGeometry, skyboxMat), 0, 500,
    new THREE.Mesh(skyboxPlaneGeometry, skyboxMat), 500, 0,
    new THREE.Mesh(skyboxPlaneGeometry, skyboxMat), 0, -500,
    new THREE.Mesh(skyboxPlaneGeometry, skyboxMat), -500, 0,
];
for (let i = 0; i < skybox.length; i += 3) {
    skybox[i].position.x = skybox[i + 1];
    skybox[i].position.y = 200;
    skybox[i].position.z = skybox[i + 2];
    skybox[i].rotation.y = radians(i * 90);
    scene.add(skybox[i]);
}
let roof = new THREE.Mesh(skyboxPlaneGeometry, skyboxMat);
roof.position.y = 500;
roof.rotation.x = radians(90);
skybox.push(roof);

// skyGraphic.canvas to get underlying canvas element

/*************************/

let floorGraphic = createGraphics(400, 400);
floorGraphic.autoUpdateDynamics();
floorGraphic.loadPixels();
let pixels = floorGraphic.get.imageData.data;
let floorGraphicWidth = floorGraphic.get.width;
for (let i = 0; i < pixels.length; i += 4) {
    let x = (i >> 2) % floorGraphicWidth;
    let y = ((i >> 2) / floorGraphicWidth) | 0;
    if (x > 200) x = 400 - x;
    if (y > 200) y = 400 - y;
    let n = map(perlin.get(x / 100, y / 100), 0, 1, 50, 200);
    pixels[i] = n;
    pixels[i+1] = n;
    pixels[i+2] = n;
    pixels[i+3] = 255;
}
floorGraphic.updatePixels();
const FLOOR_TEXTURE = new THREE.CanvasTexture(floorGraphic.canvas);
const FLOOR_MATERIAL = new THREE.MeshLambertMaterial({ map: FLOOR_TEXTURE });


// So that each user can look different
const SKINS = [
    new THREE.MeshPhongMaterial({ color: new Color(0, 100, 0).toInt() }),
];

scene.background = new THREE.Color( '#001A32' );

// All other cubes are instances of this geometry
const CUBE = new THREE.BoxGeometry(1, 1, 1);

window.PLAYERS = [];

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

window.username = "User#" + Math.random().toString().replace(".", "").slice(0, 3);
window.token = "";
window.latency = 0;

class User {
    name;
    px; py; pz;
    x; y; z;
    xVel = 0; yVel = 0; zVel = 0;
    xTheta = 0;
    yTheta = 0;
    speed = 18;
    jumping = false;
    canJump = true;
    skin;
    mesh;
    nametagMesh;
    isClient = false;

    static nametagGeometry = new THREE.PlaneGeometry(2, 0.5);

    constructor(name, x, y, z) {
        this.name = name;
        this.px = this.x = x;
        this.py = this.y = y;
        this.pz = this.z = z;

        this.skin = SKINS[0];
        this.mesh = new THREE.Mesh(CUBE, this.skin);
        scene.add(this.mesh);

        let nametag = createGraphics(200, 50);
        nametag.background(0, 0, 0, 0);
        nametag.font("arial", 24);
        nametag.textAlign(CENTER, CENTER);
        nametag.fill(0);
        for (let i = 0; i < 360; i += 10) {
            nametag.text(this.name, 100 + cos(i) * 3, 25 + sin(i) * 3);
        }
        nametag.fill(255);
        nametag.text(this.name, 100, 25);
        
        const Tex = new THREE.CanvasTexture(nametag.canvas);
        const Mat = new THREE.MeshPhongMaterial({
            map: Tex,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
            reflectivity: 0.2
        });
        this.nametagMesh = new THREE.Mesh(User.nametagGeometry, Mat);
        scene.add(this.nametagMesh);
    }

    move() {
        if (this.isClient) {
            // foreward
            if (keys["w"]) {
                user.xVel = -cos(user.yTheta) * user.speed;
                user.zVel = -sin(user.yTheta) * user.speed;
            }

            // backward
            if (keys["s"]) {
                user.xVel = cos(user.yTheta) * user.speed;
                user.zVel = sin(user.yTheta) * user.speed;
            }

            // left
            if (keys["a"]) {
                user.xVel = -cos(user.yTheta - 90) * user.speed;
                user.zVel = -sin(user.yTheta - 90) * user.speed;
            }

            // right
            if (keys["d"]) {
                user.xVel = cos(user.yTheta - 90) * user.speed;
                user.zVel = sin(user.yTheta - 90) * user.speed;
            }

            user.x += user.xVel * secondsFromPrevFrame;
            user.z += user.zVel * secondsFromPrevFrame;

             // slow down user
            user.xVel *= constrain(0.00011 / secondsFromPrevFrame, 0, 1);
            user.zVel *= constrain(0.00011 / secondsFromPrevFrame, 0, 1);

            // jump
            if (keys[" "] && !user.jumping && user.canJump) {
                user.yVel = 20;
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
                user.yVel -= 1.0;
            }

            if (NOT_KA) {
                socket.emit("update", {
                    token: token,
                    x: user.x,
                    y: user.y,
                    z: user.z
                });
            }
        }
    }

    update() {
        this.mesh.position.x = this.x;
        this.mesh.position.y = this.y;
        this.mesh.position.z = this.z;
        this.mesh.rotation.y = radians(-this.yTheta);

        this.nametagMesh.position.x = this.x;
        this.nametagMesh.position.y = this.y + 1;
        this.nametagMesh.position.z = this.z;
        this.nametagMesh.rotation.y = radians(90-user.yTheta);
        
    }

    free() {
        scene.remove(this.mesh);
        scene.remove(this.nametagMesh);
    }
}

// ----------------- MULTIPLAYER STUFF -----------------
const NOT_KA = true;
const socket = io("https://chromatic-quadrilaterals-3d.vexcess.repl.co");

socket.on("connect", () => {
    // send self to server
    socket.emit("join", {
        name: username,
        timestamp: Date.now()
    });

    // listen for messages from server
    socket.on("auth", data => {
        token = data.token;
        latency = Date.now() - data.timestamp;
        console.log("Connected", token, latency);
    });

    socket.on("new-user", data => {
        console.log(data.name + " joined");
        window.PLAYERS.push(new User(data.name, 0, 0, 0));
    });

    socket.on("lost-user", data => {
        // find player locally and delete it
        for (let j = 0; j < PLAYERS.length; j++) {
            if (PLAYERS[j].name === data.name) {
                PLAYERS[j].free();
                PLAYERS.splice(j, 1);
            }
        }
    });

    socket.on("game-update", data => {
        const players = window.PLAYERS;

        // loops through all recieved players
        for (let i = 0; i < data.length; i++) {
            let serverPlayer = data[i];
            let localPlayer = null;

            // find player locally
            for (let j = 0; j < players.length; j++) {
                if (players[j].name === data[i].name) {
                    localPlayer = players[j];
                }
            }

            // create player if it doesn't exist
            if (localPlayer === null) {
                localPlayer = new User(serverPlayer.name, serverPlayer.x, serverPlayer.y, serverPlayer.z);
                players.push(localPlayer);
            } else if (localPlayer !== user) {
                // update player
                localPlayer.x = serverPlayer.x;
                localPlayer.y = serverPlayer.y;
                localPlayer.z = serverPlayer.z;
            }
        }
    });
});
// ----------------- END MULTIPLAYER STUFF -----------------

let user = new User(username, 0, 0, 0);
user.isClient = true;
window.user = user; //debugging
PLAYERS.push(user);

let level = [];

let floorGeo = new THREE.BoxGeometry(1,1,1);
let floorMat = new THREE.MeshPhongMaterial( {color: 0x222222} ); 
let floorMesh = new THREE.Mesh( floorGeo, floorMat);
scene.add(floorMesh)

const light = new THREE.PointLight(0xffffff,0.6)
light.position.set(-200, 100, -200);
light.castShadow = true;
scene.add(light)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

floorMesh.position.set(0, 0, 0);
floorMesh.scale.x = LEVELS[0].length*5;
floorMesh.scale.z = LEVELS[0][0].length*5;

// generate level
let currLevelMap = LEVELS[0];
let currLevelWidth = currLevelMap[0].length * 5;
let currLevelLength = currLevelMap.length * 5;
let blockSize = 5;
for (let z = 0; z < currLevelMap.length; z++) {
    let row = currLevelMap[z];
    for (let x = 0; x < row.length; x++) {
        switch (row[x]) {
            case "0": {
                let voxel = new THREE.Mesh(CUBE, FLOOR_MATERIAL);
                voxel.position.x = x*5 - currLevelWidth/2 + blockSize/2;
                voxel.position.y = 3;
                voxel.position.z = z*5 - currLevelLength/2 + blockSize/2;

                voxel.scale.x = blockSize;
                voxel.scale.y = blockSize;
                voxel.scale.z = blockSize;
                
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

    camera.velocity.x = (user.x + cos(user.yTheta) * 5 - camera.position.x) / 5;
    camera.velocity.y = (user.y + 2 - camera.position.y) / 10;
    camera.velocity.z = (user.z + sin(user.yTheta) * 5 - camera.position.z) / 5;

    camera.rotation.z += (radians(-user.xTheta + 0) -  camera.rotation.x) / 5;
    camera.rotation.y += (radians(-user.yTheta + 90) -  camera.rotation.y) / 5;
    
    camera.position.x += camera.velocity.x;
    camera.position.y += camera.velocity.y;
    camera.position.z += camera.velocity.z;

    renderer.render(scene, camera);
};

DL.mouseMoved = function(e) {
    if (document.pointerLockElement !== null) {
        user.yTheta += e.movementX * mouseSensitivity;
        user.xTheta = constrain(user.xTheta - e.movementY * mouseSensitivity, -90, 90);
    }
};

DL.mousePressed = function() {
    canvas2d.requestPointerLock();
};

document.body.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});
document.body.addEventListener("keydown", (e) => {
    keys[e.key] = true;
});
