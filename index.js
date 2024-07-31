const world = new CANNON.World();
world.gravity.set(0, -10, 0)

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
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

let skyGraphic = createGraphics(1000, 1000);
let roofGraphic = createGraphics(1000, 1000);
let skyBackground;
let roofBackground;
let stars = [];
let rocket = {
  x: 500,
  y: 1000,
  rot: random(-25, 25),
  particles: []
};
function drawStars(ctx) {
  for (let i = 0; i < stars.length; i++) {
    let star = stars[i];

    ctx.strokeWeight(abs(sin(star[2]) * 2));
    ctx.stroke(random(80, 175), random(200, 255), random(200, 255));
    ctx.point(star[0], star[1]);
    star[2] += star[3];
  }
}
function drawClouds(ctx) {
  ctx.autoUpdateDynamics();
  let width = ctx.get.width;
  ctx.loadPixels();
  let pixels = ctx.get.imageData.data;
  for (let i = 0; i < pixels.length; i += 4) {
    let x = (i >> 2) % width;
    let y = ((i >> 2) / width) | 0;

    if (x > width / 2) x = width - x;

    let b = perlin.get(x / 200, y / 100) * 25;
    pixels[i] += b;
    pixels[i + 1] += b;
    pixels[i + 2] += b;
  }
  ctx.updatePixels();
}
// credit: https://www.khanacademy.org/computer-programming/i/5437326180794368
function drawRocket(ctx) {
  // particles [
  rocket.particles.push({
    x: rocket.x + random(-5, 5),
    y: rocket.y + random(-5, 5),
    w: random(3, 7),
    o: 255,
    r: random(0, 365),
    xv: random(-0.5, 0.5),
    yv: random(1, 3),
  });

  for (var i = 0; i < rocket.particles.length; i++) {
    var p = rocket.particles[i];
    ctx.noStroke();
    ctx.fill(random(200, 255), random(50, 255), 10, p.o);
    ctx.pushMatrix();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.scale(0.15);
    for (let j = 0; j < 3; j++) {
      ctx.rect(random(-5, 5), random(-5, 5), p.w, p.w);
    }
    ctx.popMatrix();

    p.x += cos(rocket.rot + 90);
    p.y += sin(rocket.rot + 90);
    p.o -= 8;
    p.r += 3;
  }

  for (var i = rocket.particles.length - 1; i > 0; i--) {
    if (rocket.particles[i].o <= 0) {
      rocket.particles.splice(i, 1);
    }
  }

  // ]

  // rocket [
  ctx.pushMatrix();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(rocket.rot);
  ctx.translate(0, 15);
  ctx.scale(0.15);
  ctx.fill(255, 10, 10);

  rocket.x += cos(rocket.rot + 90 + 180);
  rocket.y += sin(rocket.rot + 90 + 180);

  if (rocket.y < -100) {
    rocket.x = 500;
    rocket.y = 1000;
    rocket.rot = random(-25, 25);
  }
  if (rocket.x > 1100) {
    rocket.x = -100;
  }
  if (rocket.x < -100) {
    rocket.x = 100;
  }

  // nose cone
  ctx.beginShape();
  ctx.vertex(-25, -250);
  ctx.bezierVertex(-10, -290, 10, -290, 25, -250);
  ctx.endShape();

  // left fin
  ctx.beginShape();
  ctx.vertex(-25, -140);
  ctx.vertex(-25, -50);
  ctx.bezierVertex(-25, -50, -40, -51, -54, -5);
  ctx.vertex(-72, -5);
  ctx.bezierVertex(-71, -79, -30, -104, -25, -100);
  ctx.endShape();

  // right fin
  ctx.beginShape();
  ctx.vertex(25, -140);
  ctx.vertex(25, -50);
  ctx.bezierVertex(25, -50, 40, -51, 54, -5);
  ctx.vertex(72, -5);
  ctx.bezierVertex(71, -79, 30, -104, 25, -100);
  ctx.endShape();

  // body
  ctx.fill(255);
  ctx.beginShape();
  ctx.vertex(-25, -250);
  ctx.vertex(25, -250);
  ctx.bezierVertex(50, -150, 50, -150, 25, -50);
  ctx.vertex(-25, -50);
  ctx.bezierVertex(-50, -150, -50, -150, -25, -250);
  ctx.endShape();

  // window
  ctx.fill(117, 204, 255);
  ctx.ellipse(0, -169, 40, 40);

  // rocket nozzle
  ctx.fill(133, 133, 133);
  ctx.quad(-25, -50, 25, -50, 23, -45, -23, -45);
  ctx.fill(105, 105, 105);
  ctx.quad(-25, -40, 25, -40, 23, -45, -23, -45);

  // center fin
  ctx.fill(255, 10, 10);
  ctx.rect(-3, -95, 6, 90);
  ctx.popMatrix();
}
// credit: https://www.khanacademy.org/computer-programming/i/6204162995863552
function drawUFO(ctx, x, y, rot) {
  ctx.noStroke();
  ctx.pushMatrix();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(0.3);
  ctx.translate(-310, -250);
  //Window 
  //Dark Side   
  ctx.fill(199, 76, 230);
  ctx.arc(313, 212, 100, 106, 180, 360);
  //Light Side      
  ctx.fill(222, 104, 252);
  ctx.arc(303, 212, 82, 89, 180, 360);
  //Minor Details 
  ctx.fill(252, 164, 242, 100);
  ctx.ellipse(293, 184, 24, 18);
  //Connector from window to base 
  //Base of Connector
  ctx.fill(166, 166, 166);
  ctx.quad(262, 208.4, 363, 208, 363 + 19, 228, 262 - 19, 228);                     //Detail    
  ctx.fill(224, 224, 224);
  ctx.quad(262 - 19, 228, 262 + 102, 228, 353, 215, 256, 215);
  //Base  
  //Top Part 

  //Main
  ctx.fill(127, 14, 158);
  ctx.quad(380, 227, 246, 227, 246 - 60, 248, 374 + 60, 248);
  //Detail
  //Main Detail  
  ctx.fill(149, 54, 168, 150);
  ctx.quad(244, 227, 244 - 60, 247, 208, 248, 252 + 14, 227);
  //Minor Detail  
  ctx.fill(103, 13, 128);
  ctx.quad(380, 227, 374 + 60, 248, 407, 248, 347, 227);
  //Bottom Part(Rectangular)  
  //Main    
  ctx.fill(87, 4, 112);//color of bottom base  
  ctx.rect(183, 247, 257, 22, 10);
  //Detail    
  //1(left detail)
  ctx.fill(227, 95, 201, 100);
  ctx.rect(184, 247, 223, 11, 10);
  //2(right detail 
  ctx.fill(119, 14, 145, 150);
  ctx.rect(206, 247, 233, 11, 20);
  //Windows  
  for (var i = 0; i < 8; i++) {
    ctx.fill(252, 202, 63);
    ctx.ellipse(217 + i * 30, 252, 5, 5);
  }
  //Bottom(Abduction Laser Tool)  
  //White Laser Tool   
  ctx.fill(224, 224, 224);
  ctx.quad(269, 270, 352, 270, 341, 290, 281, 290);
  //Detail(Grey 
  ctx.fill(201, 199, 201);
  ctx.quad(286, 270, 353, 270, 341, 290, 281 + 14, 290);
  //Pink Laser Tool 
  ctx.fill(250, 103, 250, 100);
  ctx.quad(294, 290, 327, 290, 322, 300, 299, 300);                          //Detail  
  ctx.fill(255, 140, 255, 50);
  ctx.quad(296, 294, 325, 294, 321, 300, 299, 300);
  //Laser(Light out of bottom of ufo  
  ctx.rectMode(CENTER); //makes it easier to create the laster          
  //loop will Creates the laser      
  for (var i = 0; i < 45; i++) {
    //Outermost light/laser
    ctx.fill(255, 99, 156, 100 - i * 2.2);
    ctx.rect((299 + 322) / 2, 302 + i * 5, (322 - 299) + i * 2, 5);
    //Middle Light/Laser 
    ctx.fill(255, 99, 156, 100 - i * 2.5);
    ctx.rect((299 + 322) / 2, 302 + i * 5, (322 - 299) / 2 + i * 2 / 2, 5);
    //Inner Most Laser 
    ctx.fill(255, 168, 255, 150 - i * 4);
    ctx.rect((299 + 322) / 2, 302 + i * 4, (322 - 299) / 5 + i * 2 / 4, 4);
  }
  ctx.rectMode(CORNER); // fixes the things messed up by the rectmode change earilier 
  ctx.popMatrix();
}
// Credit: https://www.khanacademy.org/computer-programming/i/4870333859315712
function drawGalaxy(ctx) {
  ctx.pushMatrix();
  ctx.translate(250, -50);
  ctx.rotate(23);
  ctx.scale(0.8);

  ctx.noStroke();
  for (var i = 0; i < 360; i++) {
    ctx.pushMatrix();

    ctx.translate(300, 200);
    ctx.scale(0.6, 0.15);
    ctx.rotate(i);

    ctx.fill(194, 19, 188, 20);
    ctx.ellipse(random(0, 12), random(30, 366), 120, 20);
    ctx.fill(255, 241, 38, 20);
    ctx.ellipse(random(0, 12), random(-200, -5), 120, 40);
    ctx.fill(255, 241, 38, 200);
    ctx.ellipse(random(0, 12), random(1, 0), 12, 4);
    ctx.fill(51, 0, 255, 20);
    ctx.translate(0, 130);
    ctx.ellipse(random(0, 12), random(0, 326), 120, 40);
    ctx.fill(255, 255, 255, 170);
    ctx.ellipse(random(0, 12), random(0, 900), 3, 3);
    ctx.fill(255, 255, 255, 10);
    ctx.ellipse(random(0, 12), random(-500, 0), 120, 40);

    ctx.popMatrix();
  }
  ctx.popMatrix();
}
{
  let width = skyGraphic.width, height = skyGraphic.height;

  for (let i = 0; i < 800; i++) {
    stars.push([random(0, width), random(0, height), random(0.2, 2), random(-8, 8)]);
  }

  // roofGraphic
  roofGraphic.background(0, 0, 0);
  drawClouds(roofGraphic);
  roofBackground = roofGraphic.snip();

  // skyGraphic
  skyGraphic.background(0, 0, 0);
  skyGraphic.noStroke();
  let c1 = color(0, 0, 0);
  let c2 = color(64, 5, 115);
  for (let i = 0; i < height; i++) {
    skyGraphic.fill(lerpColor(c1, c2, min(i / 500 - 0.35, 1)));
    skyGraphic.rect(0, i, width, 2);
  }

  drawClouds(skyGraphic);
  drawGalaxy(skyGraphic);

  skyBackground = skyGraphic.snip();
}

let skyboxPlaneGeometry = new THREE.PlaneGeometry(1000, 1000);
let skyboxTex = new THREE.CanvasTexture(skyGraphic.canvas);
let roofTex = new THREE.CanvasTexture(roofGraphic.canvas);
let skyboxMat = new THREE.MeshBasicMaterial({ map: skyboxTex, side: THREE.DoubleSide });
let roofMat = new THREE.MeshBasicMaterial({ map: roofTex, side: THREE.DoubleSide });

let skyboxWallData = [
  0, 500, skyboxMat,
  500, 0, skyboxMat,
  0, -500, skyboxMat,
  -500, 0, skyboxMat,
  0, 0, roofMat
];
let skybox = [];

// create skybox
for (let i = 0; i < skyboxWallData.length / 3; i++) {
  let x = skyboxWallData[i * 3];
  let z = skyboxWallData[i * 3 + 1];
  let mat = skyboxWallData[i * 3 + 2];
  let plane = new THREE.Mesh(skyboxPlaneGeometry, mat);

  // walls
  plane.position.x = x;
  plane.position.y = 0;
  plane.position.z = z;
  plane.rotation.y = radians(i * 90);

  // roof
  if (i === 4) {
    plane.position.y = 500;
    plane.rotation.x = radians(-90);
  }

  skybox.push(plane);
  scene.add(plane);
}


function updateSkybox() {
  // update sky walls
  skyGraphic.image(skyBackground, 0, 0);
  drawStars(skyGraphic);
  drawRocket(skyGraphic);
  drawUFO(skyGraphic, 500 + cos(get.frameCount / 4) * 300, 400 + sin(get.frameCount / 4) * 300, cos(get.frameCount / 2) * 8);

  // update roof
  roofGraphic.image(roofBackground, 0, 0);
  drawStars(roofGraphic);

  // tell three.js to update texture
  skyboxTex.needsUpdate = true;
  roofTex.needsUpdate = true;
}
updateSkybox();

/*************************/

let floorGraphic = createGraphics(4000, 4000);
{
  let cubeSz = 4000 / 20;
  floorGraphic.strokeWeight(40);
  floorGraphic.stroke(0, 100);
  for (let x = 0; x < 20; x++) {
    for (let y = 0; y < 20; y++) {
      floorGraphic.fill(random(20, 100));
      floorGraphic.rect(x * cubeSz, y * cubeSz, cubeSz, cubeSz);
    }
  }
}
const FLOOR_TEXTURE = new THREE.CanvasTexture(floorGraphic.canvas);
// const FLOOR_MATERIAL = new THREE.MeshPhongMaterial({ map: FLOOR_TEXTURE });

const clock = new THREE.Clock();
let colors = {
  color: "#191919",
  edgeColor: "#670eb5"
}
const tuniform = {
  iResolution: { value: new THREE.Vector2() },
  iTime: { type: 'f', value: 0.1 },
  thickness: {
    // value: Math.sqrt(Math.pow(camera.position.x,2) + Math.pow(camera.position.y,2)) * 10
    value: 20
  },
  color: {
    value: new THREE.Color(colors.color)
  },
  edgeColor: {
    value: new THREE.Color(colors.edgeColor)
  },
};

tuniform.iResolution.value.set(window.innerWidth, window.innerHeight);

const FLOOR_MATERIAL = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  uniforms: tuniform,
  vertexShader: `
    attribute vec3 in_Position;
    varying vec2 fragCoord;
    varying vec2 vUv; 
    void main()
    {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
        fragCoord = position.xy;
    }
  `,
  fragmentShader: `
uniform float iTime;
uniform sampler2D iChannel0;
uniform vec2 iMouse;
uniform vec2 iResolution;
varying vec2 vUv;
varying vec2 fragCoord;
        
 const float cellSize = 0.1;
// colors
const vec4 col0 = vec4(0.5, 0.5, 0.5, 1.0);
const vec4 col1 = vec4(0.7, 0.7, 0.7, 1.0);

const float fac = 1.0 / 15.0; // make the grid 15x15
const float invFac = 1.0 / fac;
const float clrChange = 2.0;

void main() {
	// const float pairSize = cellSize * 2.0;

 //    bool a = mod(fragCoord.x, pairSize) < cellSize;
 //    bool b = mod(fragCoord.y, pairSize) < cellSize;
    
	// gl_FragColor = ((a && !b) || (!a && b)) ? col0 : col1;

    float xx = vUv.x * 1.0;
    float yy = vUv.y * 1.0;
    
    float d1 = mod(xx, fac) * invFac;
    float d2 = mod(-xx, fac) * invFac;
    float d3 = mod(yy, fac) * invFac;
    float d4 = mod(-yy, fac) * invFac;
    float d = max(max(d1, d2), max(d3, d4));

    float o = min(pow(d, 0.6), 1.0);
    o -= float(o < 0.985) * 0.45; // mild tomfoolery to avoid GPU branching

    vec3 col = 0.5 + 0.5 * cos(iTime + vec3(yy*clrChange, xx*clrChange, yy*clrChange) + vec3(0,10,20));
    
    gl_FragColor = vec4(o*col, 1.0);
}

  `
});

const WALL_MATERIAL = new THREE.ShaderMaterial({
  uniforms: tuniform,
  vertexShader: `
    attribute vec3 in_Position;
    varying vec2 fragCoord;
    varying vec2 vUv; 
    void main()
    {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
        gl_Position = projectionMatrix * mvPosition;
        fragCoord = position.xy;
    }
  `,
  fragmentShader: `
uniform float iTime;
uniform sampler2D iChannel0;
uniform vec2 iMouse;
uniform vec2 iResolution;
varying vec2 vUv;
varying vec2 fragCoord;
uniform float thickness;

    // uniform vec3 color;
    // uniform vec3 edgeColor;
   	
    float edgeFactor(vec2 p){
    	vec2 grid = abs(fract(p - 0.5) - 0.5) / fwidth(p) / thickness;
  		return min(grid.x, grid.y);
    }

    void main() {
 
      float a = clamp(edgeFactor(vUv), 0.0, 1.0);

       float xx = vUv.x * 1.0;
        float yy = vUv.y * 1.0;
        vec3 color = vec3(0.12, 0.12 ,0.12);
        const float clrChange = 2.0;
      vec3 col = 0.5 + 0.5 * cos(iTime + vec3(yy*clrChange, xx*clrChange, yy*clrChange) + vec3(0,10,20));
    
      vec3 c = mix(col, color, a);
      
      gl_FragColor = vec4(c, 1.0);

    }

  `
});

// So that each user can look different
const BULLET_MAT = new THREE.MeshPhongMaterial({ color: color(255, 255, 255).toInt() });
const SKINS = [
  new THREE.MeshPhongMaterial({ color: color(0, 100, 0).toInt() }),
];

function createSkin(clr1, clr2, name, fxn) {
    let gfx = create
}

createSkin(color(255, 255, 0), color(255, 230, 0), "WinstonWinner000", function(ctx) {
    // sz determines the dimensions of the character
    // sz / 2 is the center of the character
    
    ctx.pushMatrix();
    // Try not to mess with eye positioning
    
    ctx.translate(sz / 10 * 3, sz / 10 * 3);
    
    ctx.fill(0, 0, 0);
    ctx.ellipse(0, 0, sz / 5, sz / 5); // Left Eye
    
    ctx.translate(sz / 5 * 2, 0);
    
    ctx.ellipse(0, 0, sz / 5, sz / 5); // Right eye
    ctx.popMatrix();
    
    ctx.strokeWeight(sz / 45 * 2); // The strokeweight I use for a lot of the character graphics
    ctx.noFill();
    ctx.stroke(0, 0, 0);
    ctx.fill(255, 0, 0);
    ctx.ellipse(sz / 2, sz / 4 * 3, sz / 3, sz / 3); // Mouth
    ctx.noStroke();
});

scene.background = new THREE.Color('#001A32');

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

const boxBody = new CANNON.Body({
  mass: 1,
  shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1))
})

boxBody.position.set(-4, 12, 10);
boxBody.quaternion.set(Math.PI / 2, Math.PI / 2, 0, 1);
world.addBody(boxBody);
const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
const boxMaterial = new THREE.MeshPhongMaterial({ color: 0xfafafa, });
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
scene.add(boxMesh);


// generate level
let currLevelMap = LEVELS[0];
let level = [];
let currLevelWidth = currLevelMap[0].length * 5;
let currLevelLength = currLevelMap.length * 5;
let blockSize = 5;
for (let z = 0; z < currLevelMap.length; z++) {
  let row = currLevelMap[z];
  for (let x = 0; x < row.length; x++) {
    switch (row[x]) {
      case "0": {
        let voxel = new THREE.Mesh(CUBE, WALL_MATERIAL);
        voxel.position.x = x * 5 - currLevelWidth / 2 + blockSize / 2;
        voxel.position.y = 3;
        voxel.position.z = z * 5 - currLevelLength / 2 + blockSize / 2;

        voxel.scale.x = blockSize;
        voxel.scale.y = blockSize;
        voxel.scale.z = blockSize;


        let voxbody = new CANNON.Body({
          mass: 0,
          shape: new CANNON.Box(new CANNON.Vec3(blockSize / 2, blockSize / 2, blockSize / 2))
        });
        voxbody.position.copy(voxel.position)
        voxbody.quaternion.copy(voxel.quaternion)
        world.addBody(voxbody);

        voxel.rotation.x = radians(((Math.random() * 4) | 0) * 90);
        voxel.rotation.y = radians(((Math.random() * 4) | 0) * 90);

        scene.add(voxel);
        level.push(voxel);
        break;
      }
    }
  }
}

let secondsFromPrevFrame = 0;

window.username = "User#" + Math.random().toString().replace(".", "").slice(0, 3);
window.token = "";
window.latency = 0;

const bullets = [];

class User {
  name;
  px; py; pz;
  x; y; z;
  w = 1; h = 1;
  xVel = 0; yVel = 0; zVel = 0;
  xTheta = 0;
  yTheta = 0;
  speed = 18;
  jumping = false;
  canJump = true;
  skin;
  mesh;
  nametagGfx; nametagMesh; nametagTex; nametagMat;
  isClient = false;
  health = 24;

  static nametagGeometry = new THREE.PlaneGeometry(2, 0.5);

  constructor(name, x, y, z) {
    this.name = name;
    this.px = this.x = x;
    this.py = this.y = y;
    this.pz = this.z = z;
    this.id = random();

    this.skin = SKINS[0];
    this.mesh = new THREE.Mesh(CUBE, this.skin);
    scene.add(this.mesh);

    this.body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
    })
    this.mesh.quaternion.set(0, 0, 0, 1)

    world.addBody(this.body)

    this.nametagGfx = createGraphics(200, 50);
    let gfx = this.nametagGfx;
    gfx.background(0, 0, 0, 0);
    gfx.font("arial", 24);
    gfx.textAlign(CENTER, CENTER);
    gfx.fill(0);
    for (let i = 0; i < 360; i += 10) {
      gfx.text(this.name, 100 + cos(i) * 3, 15 + sin(i) * 3);
    }
    gfx.fill(255);
    gfx.text(this.name, 100, 15);

    gfx.strokeWeight(3);
    gfx.stroke(255);
    gfx.fill(0);
    gfx.rect(5, 35, 190, 10, 5);

    gfx.noStroke();
    gfx.fill(0, 200, 0);
    gfx.rect(5, 35, this.health / 24 * 190, 10, 5);

    this.nametagTex = new THREE.CanvasTexture(gfx.canvas);
    this.nametagMat = new THREE.MeshPhongMaterial({
      map: this.nametagTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    this.nametagMesh = new THREE.Mesh(User.nametagGeometry, this.nametagMat);
    scene.add(this.nametagMesh);
  }

  ai() {
    this.xVel = (perlin.get(this.id * 1000 + get.frameCount / 10) - 0.5) * this.speed;
    this.zVel = (perlin.get(100000 + this.id * 1000 + get.frameCount / 10) - 0.5) * this.speed;

    if (random() < 0.01 && !this.jumping && this.canJump) {
      this.yVel = 20;
      this.jumping = true;
      this.w = 0.7;
      this.h = 1.3;
    }
  }

  move() {
    if (this.isClient) {
      // foreward
      if (keys["w"]) {
        this.xVel = -cos(this.yTheta) * this.speed;
        this.zVel = -sin(this.yTheta) * this.speed;
      }

      // backward
      if (keys["s"]) {
        this.xVel = cos(this.yTheta) * this.speed;
        this.zVel = sin(this.yTheta) * this.speed;
      }

      // left
      if (keys["a"]) {
        this.xVel = -cos(this.yTheta - 90) * this.speed;
        this.zVel = -sin(this.yTheta - 90) * this.speed;
      }

      // right
      if (keys["d"]) {
        this.xVel = cos(this.yTheta - 90) * this.speed;
        this.zVel = sin(this.yTheta - 90) * this.speed;
      }

      // jump
      if (keys[" "] && !this.jumping && this.canJump) {
        this.yVel = 20;
        this.jumping = true;
        this.w = 0.7;
        this.h = 1.3;
      }
    } else {
      this.ai();
    }

    this.x += this.xVel * secondsFromPrevFrame;
    this.z += this.zVel * secondsFromPrevFrame;

    // slow down user
    this.xVel *= constrain(0.00011 / secondsFromPrevFrame, 0, 1);
    this.zVel *= constrain(0.00011 / secondsFromPrevFrame, 0, 1);

    this.y += this.yVel * secondsFromPrevFrame;

    if (this.isClient && NOT_KA) {
      socket.emit("update", {
        token: token,
        x: this.x,
        y: this.y,
        z: this.z,
        yTheta: this.yTheta
      });
    }
  }

  fire() {
    let bullet = {
      x: this.x,
      y: this.y,
      z: this.z,

      xVel: cos(this.yTheta + 180) * 2,
      yVel: sin(this.xTheta + 0.2) * 2,
      zVel: sin(this.yTheta + 180) * 2,

      mesh: new THREE.Mesh(CUBE, BULLET_MAT),

      owner: this
    };

    bullet.mesh.scale.x = 0.2;
    bullet.mesh.scale.y = 0.2;
    bullet.mesh.scale.z = 0.2;

    bullets.push(bullet);
    scene.add(bullet.mesh);
  }

  update() {
    this.w += 0.012;
    this.h -= 0.012;

    this.body.position.copy(this.mesh.position);
    this.body.quaternion.set(0, 0, 0, 1);


    // // temporarily simulate floor until proper physics is implemented
    // //astro will implement cannon.js physics later
    if (this.y < 1) {
      this.y = 1;
      this.yVel = 0;
      this.jumping = false;
      this.canJump = true;
      this.w = 1;
      this.h = 1;
    } else {
      this.canJump = false;
      this.yVel -= 1.2;
    }

    this.mesh.position.x = this.x;
    this.mesh.position.y = this.y;
    this.mesh.position.z = this.z;

    //Needs to be fixed
    this.mesh.rotation.y = radians(-this.yTheta);

    // this.mesh.scale.x = this.w;
    // this.mesh.scale.z = this.w;
    // this.mesh.scale.y = this.h;

    this.nametagMesh.position.x = this.x;
    this.nametagMesh.position.y = this.y + 1;
    this.nametagMesh.position.z = this.z;
      // rotate relative to the user
    this.nametagMesh.rotation.y = radians(90 - user.yTheta);
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
      }

      if (localPlayer !== user) {
        // update player
        localPlayer.x = serverPlayer.x;
        localPlayer.y = serverPlayer.y;
        localPlayer.z = serverPlayer.z;
        localPlayer.yTheta = serverPlayer.yTheta;
      }
    }
  });
});
// ----------------- END MULTIPLAYER STUFF -----------------

let user = new User(username, 0, 5, 0);
user.isClient = true;
window.user = user; //debugging
PLAYERS.push(user);

let floorGeo = new THREE.PlaneGeometry(1, 1);
let floorMesh = new THREE.Mesh(floorGeo, FLOOR_MATERIAL);
scene.add(floorMesh)

const light = new THREE.PointLight(0xffffff, 0.6)
light.position.set(-200, 100, -200);
light.castShadow = true;
scene.add(light)

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

floorMesh.position.set(0, 0.5, 0);
floorMesh.scale.x = LEVELS[0].length * 5;
floorMesh.scale.y = LEVELS[0][0].length * 5;
floorMesh.rotation.x = radians(90);

camera.velocity = { x: 0, y: 0, z: 0 };
camera.euler = new THREE.Euler(0, 0, 0, 'YXZ');

background(0, 0, 0, 0);
noFill();
strokeWeight(1);
let d = dist(0, 0, width, height);
for (let i = 0; i < 300; i++) {
  stroke(0, 50 - i / 3.5);
  ellipse(width / 2, height / 2, d - i, d - i);
}
let vinegar = snip();

let prevFrameTimestamp = 0;
frameRate(NATIVE);
DL.draw = function() {
  if (get.frameCount % 120 === 0) {
    let ai = new User("AI - " + random(), 0, 5, 0);
    PLAYERS.push(ai);
  }

  let ms = Date.now();
  secondsFromPrevFrame = (ms - prevFrameTimestamp) / 1000;
  prevFrameTimestamp = ms;
  world.step(1 / 60);

  boxMesh.position.copy(boxBody.position);
  boxMesh.quaternion.copy(boxBody.quaternion);

  tuniform.iTime.value += clock.getDelta();
  background(0, 0, 0, 0);

  fill(255);
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
    `fps: ${frameRate()}`,
  ].join("\n"), 8, 8);

  image(vinegar, 0, 0);

    // update bullets
  for (let i = 0; i < bullets.length; i++) {
    let b = bullets[i];
    b.x += b.xVel;
    b.y += b.yVel;
    b.z += b.zVel;
    b.mesh.position.set(b.x, b.y, b.z);

      // shoot walls
    for (let j = 0; j < level.length; j++) {
      let v = level[j];
      if (DL.Touch.box_box(b.x, b.y, b.z, 0.2, 0.2, 0.2, v.position.x, v.position.y, v.position.z, 5, 5, 5)) {
        scene.remove(b.mesh);
        bullets.splice(i, 1);
        i--;
      }
    }

      // shoot people (@gurdins plz don' ban)
      for (let j = 0; j < PLAYERS.length; j++) {
          let p = PLAYERS[j];
          if (DL.Touch.box_box(b.x, b.y, b.z, 0.2, 0.2, 0.2, p.x, p.y, p.z, 1, 1, 1)) {
            scene.remove(b.mesh);
            bullets.splice(i, 1);
              p.free();
              PLAYERS.splice(j, 1);
            i--;
              j--;
          }
        }
  }

    // update players
  for (let i = 0; i < PLAYERS.length; i++) {
    PLAYERS[i].move();
    PLAYERS[i].update();
  }

    // update camera
  camera.velocity.x = (user.x + cos(user.yTheta) * 5 - camera.position.x) / 5;
  camera.velocity.y = (user.y + 2 - camera.position.y) / 10;
  camera.velocity.z = (user.z + sin(user.yTheta) * 5 - camera.position.z) / 5;

  camera.euler.x += (radians(user.xTheta) - camera.euler.x) / 3;
  camera.euler.y += (radians(-user.yTheta + 90) - camera.euler.y) / 3;
  camera.quaternion.setFromEuler(camera.euler);

  camera.position.x += camera.velocity.x;
  camera.position.y += camera.velocity.y;
  camera.position.z += camera.velocity.z;

  // crosshair
  noStroke();
  fill(255, 50, 0);
  for (let i = 0; i < 4; i++) {
    pushMatrix();
    translate(width / 2, height / 2);
    rotate(45 + i * 90)
    translate(0, -10);
    triangle(0, 0, -5, -15, 5, -15);
    popMatrix();
  }


    // update skybox every other frame to improve performance
  if (get.frameCount % 2 === 0) {
    updateSkybox();
  }

  renderer.render(scene, camera);
};

DL.mouseMoved = function(e) {
  if (document.pointerLockElement !== null) {
    user.yTheta += e.movementX * mouseSensitivity;
    user.xTheta = constrain(user.xTheta - e.movementY * mouseSensitivity, -45, 45);
  }
};
DL.mousePressed = function() {
  if (currMusic === "none") {
    currMusic = "menu";
    playMenuMusic();
  }

  canvas2d.requestPointerLock();

  user.fire();
};

document.body.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});
document.body.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

// Start button
const btn = document.getElementById("startBtn");
console.log(btn);

// btn.addEventListener("submit", (e) => {
//   // USELESS!!!!!
//   e.preventDefault();
// })