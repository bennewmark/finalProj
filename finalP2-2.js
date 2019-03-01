/*
* Ben Newmark
* CS 4731
* Final Project Part 1
*
* EXTRA CREDIT BITS:
* I implemented a small little thing for testing that might work for extra credit - you can slow the speed of everything's
* rotation using 'v', and speed it up with 'b'. Even if it's not worth extra credit, then it's still probably helpful to know
* for testing and grading.
*
* */

var canvas;
var gl;

var numTimesToSubdivide = 4;

var index = 0;

var near = -10;
var far = 10;

var left = -3.0;
var right = 3.0;
var ytop = 3.0;
var bottom = -3.0;

let distance = 8;

//mess around with those, eye coordinates
//after viewer is at 0,0,0
//could put it right behind viewer
var curOtPos = vec3(2.5, -3.5, -distance * 2);
var lightPosition = vec4(2.5, -0.5, -distance, 1.0);
var lightAmbient = vec4(0.3, 0.3, 0.3, 1.0);
var lightDiffuse = vec4(0.9, 0.9, 0.9, 1.0);
var lightSpecular = vec4(0.8, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var materialDiffuse = vec4(0.8, 0.8, 0.8, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 20.0;


var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, angleLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);


var program;
var fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio
var stack = [];
var aColor = [];

var delayInMilliseconds = 0;

let sAngle = 0.37;

//create cubes and spheres, set modifiers for theta
let aCube;
let aSphere;


var m;
var fColor;
var texCoordsArray = [];
var texture;

var minT = -1.0;
var maxT = 2.0;
var texCoord = [
    vec2(minT, minT),
    vec2(minT, maxT),
    vec2(maxT, maxT),
    vec2(maxT, minT)
];
var vTexCoord;
var tBuffer;

let depthMax = 2;

let shadowsOn = 1;
let texturebackOn = 1;
let reflectionsOn = 0.0;
let refractionsOn = 0;

let grayC = vec4(0.4, 0.4, 0.4, 1.0);
let blueC = vec4(0.1, 0.3, 1.0, 1.0);

var red = new Uint8Array([255, 0, 0, 255]);
var blue = new Uint8Array([0, 0, 255, 255]);
var green = new Uint8Array([0, 255, 0, 255]);
var cyan = new Uint8Array([0, 255, 255, 255]);
var magenta = new Uint8Array([255, 0, 255, 255]);
var yellow = new Uint8Array([255, 255, 0, 255]);
let images = [];

let refraDegree = 0.54;
let light;

//on loadup, do all of the one-time setups: gathering variable locations, one-time calculations for global variables, etc
window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    aspect = canvas.width / canvas.height;


    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);
    var ambientProduct = mult(lightAmbient, materialAmbient);


    gl.uniform4fv(gl.getUniformLocation(program,
        "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "lightPosition"), flatten(lightPosition));
    gl.uniform3fv(gl.getUniformLocation(program,
        "lightGoingPosition"), flatten(curOtPos));
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);
    gl.uniform1f(gl.getUniformLocation(program,
        "angle"), sAngle);
    gl.uniform1f(gl.getUniformLocation(program,
        "isBackground"), 1.0);


    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    angleLoc = gl.getUniformLocation(program, "angle");

    //fun with colors! Make a random color that isn't /too/ bright
    aColor = new Array(15);
    for (let i = 0; i < 15; i++) {
        let r = Math.random();
        let g = Math.random();
        let b = Math.random();

        let tColor = vec4(r, g, b, 1.0);
        while ((r + g + b > 1.3) || (tColor === grayC) || (tColor === blueC)) {
            r = Math.random();
            g = Math.random();
            b = Math.random();
            tColor = vec4(r, g, b, 1.0);
        }
        aColor[i] = tColor;
    }

    //create cubes and spheres, set modifiers for theta
    aCube = cube();
    aSphere = sphere(va, vb, vc, vd, numTimesToSubdivide);

    tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);


    gl.uniform1f(gl.getUniformLocation(program,
        "reflects"), reflectionsOn);


    light = vec3(-lightPosition[0], lightPosition[1], lightPosition[2]);
    m = mat4();
    // m[3][3] = 0;
    m[3][2] = -1 / lightPosition[2];
    fColor = gl.getUniformLocation(program, "fColor");


    loadImages([
        "resources/stones.bmp",
        "resources/grass.bmp",
    ], texturesSetup);

};
// lookup the sampler locations.
var wallTextLoc;
var floorTextLoc;
var cubemapLoc;
var textures = [];

function texturesSetup() {
    // create 2 textures
    textures = [];
    for (var ii = 0; ii < 2; ++ii) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[ii]);

        // add the texture to the array of textures.
        textures.push(texture);
    }// lookup the sampler locations.
    wallTextLoc = gl.getUniformLocation(program, "wallTexture");
    floorTextLoc = gl.getUniformLocation(program, "floorTexture");
    cubemapLoc = gl.getUniformLocation(program, "texMap");


    configureCubeMap();

    gl.uniform1i(cubemapLoc, 2);  // texture unit 2 (temp)
    loadCubeMapImages();

    render();
}

//sphere default dimensions
var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);


let theta = 0;
let mvMatrix;
let mode = 'g';
let rate = 0.01;
let tRate = 1;
let paused = 1;

// render: ran once per animation frame, sets up the view matrix before calling drawObjects() to summon all the items
// also handles keyboard commands
function render() {

    ndx = 0;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0, 0, 0);

    modelViewMatrix = lookAt(eye, at, up);


    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));


    gl.uniform1f(angleLoc, sAngle);

    mvMatrix = lookAt(vec3(0, 0, 0), at, up);


    let pMatrix = perspective(fovy, aspect, 0.1, 20);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(pMatrix));


    if (texturebackOn)
        gl.enableVertexAttribArray(vTexCoord);
    //draw walls and floor using texture stuff
    gl.uniform1f(gl.getUniformLocation(program, "isBackground"), 1.0);
    drawBackground();

    gl.disableVertexAttribArray(vTexCoord);
    //draw all the objects, possibly cubemapped
    gl.uniform1f(gl.getUniformLocation(program, "isBackground"), 0.0);
    drawObjects();

    theta += tRate;


    window.onkeypress = function (event) {
        var key = event.key;
        let labels = document.getElementById("toggleTable").rows[0].cells;
        switch (key) {
            case 'p': //Increase spotlight cut off angle (increase cone angle)
                if ((sAngle + rate) <= 1.0) {
                    sAngle += rate;
                    console.log("sAngle: " + sAngle);
                }
                break;
            case 'P': // Decrease spotlight cut off angle (decrease cone angle)
            case 'i':
                if (sAngle >= rate) {
                    sAngle -= rate;
                    console.log("sAngle: " + sAngle);
                }
                break;
            case 'm': // The scene is shaded using Gouraud lighting (smooth shading)
                mode = 'g';
                labels[0].innerHTML = "Lighting: <span style=\"color: dodgerblue; \">Gouraud</span>";
                break;
            case 'M': // The scene is shaded using flat shading
            case 'n':
                mode = 'f';
                labels[0].innerHTML = "Lighting: <span style=\"color: saddlebrown; \">Flat</span>";
                break;
            case 'b':
                tRate += 0.1;
                break;
            case 'v':
                if (tRate >= 0.1)
                    tRate -= 0.1;
                break;
            case 'A':
                shadowsOn = Math.abs(shadowsOn - 1);
                //console.log("Shadows toggled to " + shadowsOn);
                if (shadowsOn === 0)
                    labels[1].innerHTML = "Shadows: <span style=\"color: red; \">Off</span>";
                else
                    labels[1].innerHTML = "Shadows: <span style=\"color: green; \">On";

                break;
            case 'B':
                texturebackOn = Math.abs(texturebackOn - 1);
                //console.log("background textures toggled to " + texturebackOn);
                if (texturebackOn === 0)
                    labels[2].innerHTML = "Background textures: <span style=\"color: red; \">Off</span>";
                else
                    labels[2].innerHTML = "Background textures: <span style=\"color: green; \">On</span>";
                break;
            case 'C':
                reflectionsOn = Math.abs(reflectionsOn - 1.0);
                //console.log("reflections toggled to " + reflectionsOn);
                if (reflectionsOn === 0)
                    labels[3].innerHTML = "Reflections: <span style=\"color: red; \">Off</span>";
                else
                    labels[3].innerHTML = "Reflections: <span style=\"color: green; \">On</span>";
                break;
            case 'D':
                refractionsOn = Math.abs(refractionsOn - 1);
                //console.log("refraction toggled to " + refractionsOn);
                if (refractionsOn === 0)
                    labels[4].innerHTML = "Refraction: <span style=\"color: red; \">Off</span>";
                else
                    labels[4].innerHTML = "Refraction: <span style=\"color: green; \">On</span>";
                break;
            case 'T':
                paused = Math.abs(paused - 1);
                if (paused === 0)
                    requestAnimationFrame(render);
                break;
        }
    };

    delayInMilliseconds = 0;
    if (paused === 0) {
        setTimeout(function () {
            requestAnimationFrame(render);
        }, delayInMilliseconds);
    }
}

//set modifiers for theta
let spot;
let mod = [0, 0, 2, 8];

function drawBackground() {
    let walls = quad(0, 1, 2, 3); //wall
    let floor = quad(0, 4, 1, 5); //floor

    //WALL PART
    if (stack.push(mvMatrix)) {
        mvMatrix = setScale(10);
        //left wall
        if (stack.push(mvMatrix)) {
            mvMatrix = mult(rotateY(45), mvMatrix);
            mvMatrix = mult(translate(-6.0, 0.0, -distance - 12), mvMatrix);
            mvMatrix = mult(mvMatrix, scalem(2, 2, 1));
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
            draw(walls, blueC, 6, 'w');
        }
        mvMatrix = stack.pop();
        //right wall
        if (stack.push(mvMatrix)) {
            mvMatrix = mult(translate(6.0, 0.0, 0.0), mvMatrix);
            mvMatrix = mult(rotateY(-45), mvMatrix);
            mvMatrix = mult(translate(6.0, 0.0, -distance - 12), mvMatrix);
            mvMatrix = mult(mvMatrix, scalem(2, 2, 1));
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
            draw(walls, blueC, 6, 'w');
        }
        mvMatrix = stack.pop();
        //  console.log("done with walls");
    }
    mvMatrix = stack.pop();


    //FLOOR PART
    if (stack.push(mvMatrix)) {

        mvMatrix = setScale(13);
        //floor
        if (stack.push(mvMatrix)) {
            mvMatrix = mult(rotateX(1), mvMatrix);
            mvMatrix = mult(translate(0.0, -14.50, -distance - 12), mvMatrix);
            mvMatrix = setScale(1.5);
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
            draw(floor, grayC, 6, 'f');
        }
        mvMatrix = stack.pop();
        //  console.log("done with floors");
    }
    mvMatrix = stack.pop();
}

// drawObjects: creates the single top object and its two children before calling drawChildren() to handle everything else
function drawObjects() {
    spot = 2;

    //handle the spotlight angle
    gl.uniform1f(angleLoc, sAngle);


    //nice and small
    mvMatrix = setScale(0.75);
    mvMatrix = mult(translate(0, 0.5, 0), mvMatrix); //move because that's the camera

    //if-push statements are for clarity of the stack, have no actual effect
    if (stack.push(mvMatrix)) {

        mvMatrix = mult(translate(0, 0.0, -distance), mvMatrix);

        mvMatrix = mult(mvMatrix, rotateY(-theta));

        if (stack.push(mvMatrix)) {
            mvMatrix = mult(translate(0, 1.0, 0), mvMatrix);

            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
            draw(aCube, aColor[0], 36); //creating the base object
        }
        mvMatrix = stack.pop();

        mvMatrix = setScale(0.65); //smaller than before

        if (stack.push(mvMatrix)) { //creating the line for the base and its two children
            mvMatrix = mult(translate(-1.5, 0, distance), mvMatrix);
            mvMatrix = mult(mvMatrix, rotateY(theta));
            mvMatrix = mult(rotateY(theta), mvMatrix);
            mvMatrix = mult(translate(0, 0, -distance), mvMatrix);
            mvMatrix = setScale(0.65); //smaller than before
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
            drawLine(2.5);
        }
        mvMatrix = stack.pop();

        if (stack.push(mvMatrix)) {//LEFT AXIS
            mvMatrix = mult(translate(-1.5, 0, distance), mvMatrix);
            mvMatrix = mult(mvMatrix, rotateY(-theta)); //rotate around origin
            mvMatrix = mult(rotateY(theta), mvMatrix); //rotate around origin
            mvMatrix = mult(translate(0, 0, -distance), mvMatrix); //move because that's the camera
            mvMatrix = setScale(0.65); //smaller than before
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
            draw(aSphere, aColor[1], 12 * Math.pow(4, numTimesToSubdivide));
            mvMatrix = setScale(1 / 0.65); //smaller than before

            mvMatrix = mult(translate(0, -.75, 0), mvMatrix);
            if (stack.push(mvMatrix)) {//AXIS
                makeChildren(2, 1);
            }
            mvMatrix = stack.pop();
            if (stack.push(mvMatrix)) {//AXIS
                makeChildren(2, -1);
            }
            mvMatrix = stack.pop();
        }
        mvMatrix = stack.pop();

        if (stack.push(mvMatrix)) {//RIGHT AXIS
            mvMatrix = mult(translate(1.5, 0, distance), mvMatrix);
            mvMatrix = mult(mvMatrix, rotateY(-theta)); //rotate around origin
            mvMatrix = mult(rotateY(theta), mvMatrix); //rotate around origin
            mvMatrix = mult(translate(0, 0, -distance), mvMatrix); //move because that's the camera
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
            draw(aCube, aColor[2], 36);

            mvMatrix = mult(translate(0, -.75, 0), mvMatrix);
            if (stack.push(mvMatrix)) {//AXIS
                makeChildren(2, 1);
            }
            mvMatrix = stack.pop();
            if (stack.push(mvMatrix)) {//AXIS
                makeChildren(2, -1);
            }
            mvMatrix = stack.pop();
        }
        mvMatrix = stack.pop();
    }
    mvMatrix = stack.pop();


}

// makeChildren: a recursive function to create a child of whatever called it
// it starts with the grandchildren of the base, and goes through the depth specified (where the top is depth 0)
// first calls all "right" children, then recursively each left child to better take advantage of the stack's pushes
// and pops
function makeChildren(depth, type) {

    let thetaMod = 1;
    spot++;
    if (depth % 2 === 0) //thetaMod is for rotation direction
        thetaMod = -1;

    if (stack.push(mvMatrix)) {
        mvMatrix = setScale(0.7); //smaller than before

        mvMatrix = mult(mvMatrix, rotateY(thetaMod * 0.5 * mod[depth] * theta)); //rotate around origin
        if (stack.push(mvMatrix)) { //LEFT-er
            mvMatrix = mult(mvMatrix, translate(type * 1.75, 0, 0));

            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
            if (type === -1) { //left child will draw the line for its sibling and parent
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                drawLine();
                mvMatrix = setScale(0.65); //smaller than before
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                draw(aSphere, aColor[spot], 12 * Math.pow(4, numTimesToSubdivide));
                mvMatrix = setScale(1 / 0.65); //smaller than before
            } else {
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                draw(aCube, aColor[spot], 36);
            }

            mvMatrix = mult(translate(0, -0.5, 0), mvMatrix);
            if (depth < depthMax) {
                if (stack.push(mvMatrix)) {
                    makeChildren(depth + 1, 1);
                    makeChildren(depth + 1, -1);
                }
                mvMatrix = stack.pop();
            }
        }
        mvMatrix = stack.pop();
    }
    mvMatrix = stack.pop();
}

// draw: takes objectArr, which is a 2d array holding vertices ([0]) and normals ([1]), color, which is a color, and
// count, which is the number of vertices. Using them, it draws an object
function draw(objectArr, color, count, image = 'n') {
    var object = objectArr[0];
    var objNorm = objectArr[1];
    var fragColors = [];
    let modNorms = [];

    for (let i = 0; i < object.length; i++) {
        fragColors.push(color);
    }
    for (let i = 2; i < object.length; i++) {
        let flatNorm = newellNormal([object[i - 1], object[i - 2], object[i]]);
        modNorms.push(flatNorm);
        modNorms.push(flatNorm);
        modNorms.push(flatNorm);
    }

    gl.uniform1f(angleLoc, sAngle);

    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(object), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(fragColors), gl.STATIC_DRAW);


    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer2);
    if (mode === 'f')
        gl.bufferData(gl.ARRAY_BUFFER, flatten(modNorms), gl.STATIC_DRAW);
    else
        gl.bufferData(gl.ARRAY_BUFFER, flatten(objNorm), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    gl.uniform1f(gl.getUniformLocation(program,
        "textNum"), 0.5);
    gl.uniform1f(gl.getUniformLocation(program,
        "reflects"), Math.max(reflectionsOn, refractionsOn));

    if ((image !== 'n') && (texturebackOn === 1)) {
        // set which texture units to render with.
        gl.uniform1i(wallTextLoc, 0);  // texture unit 0
        gl.uniform1i(floorTextLoc, 1);  // texture unit 1

        // Set each texture unit to use a particular texture.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, textures[1]);

        if (image === 'w')
            gl.uniform1f(gl.getUniformLocation(program,
                "textNum"), 0.0);
        else
            gl.uniform1f(gl.getUniformLocation(program,
                "textNum"), 1.0);
    }
    for (let i = 0; i < count; i += 3) {
        gl.drawArrays(gl.TRIANGLES, i, 3);
    }

    if ((count > 6) && (shadowsOn === 1)) {
        let toOrigMat = translate(light[0], light[1], light[2]);
        let returnMat = translate(-light[0], -light[1], -light[2]);
        let M = mult(toOrigMat, m);
        M = mult(M, returnMat);
        let T = mat4(1);
        T[2][3] = -8;
        //TODO figure out how to calculate T[2][3] - should be distance from z = 0 to the back wall (need to figure out back wall!)

        let baseShadow = mult(M, mvMatrix);
        let trueShadow = mult(T, baseShadow);

        /*      //all the testing messages for shadows
                console.log("to origin:");
                console.log(toOrigMat);
                console.log("m:");
                console.log(m);
                console.log("return:");
                console.log(returnMat);
                console.log("M:");
                console.log(M);
                console.log("modelview:");
                console.log(modelViewMatrix);
                console.log("M * A:");
                console.log(baseShadow);
                console.log("T * M * A:");
                console.log(trueShadow);
        */

        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(trueShadow));

        gl.disableVertexAttribArray(vColor);

        gl.uniform4fv(fColor, flatten(vec4(0.0, 0.0, 0.0, 1.0)));

        for (let j = 0; j < count; j += 3) {
            gl.drawArrays(gl.TRIANGLES, j, 3);
        }

    }
}

// drawLine: draws the connecting line between two children and their parent
function drawLine(mod = 1) {
    let lines = [
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(1.75 * mod, 1.0, 0.0, 1.0),
        vec4(1.75 * mod, 1.5 * mod, 0.0, 1.0),
        vec4(1.75 * mod, 1.0, 0.0, 1.0),
        vec4(3.5 * mod, 1.0, 0.0, 1.0),
        vec4(3.5 * mod, 0.0, 0.0, 1.0),
    ];
    let colors = [
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
        vec4(0, 0, 0, 1.0),
    ];

    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(lines), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    // gl.uniform4fv(fColor, vec4(0.0, 0.0, 0.0, 1.0));
    gl.uniform1f(gl.getUniformLocation(program,
        "textNum"), 0.5);
    gl.drawArrays(gl.LINE_STRIP, 0, lines.length);
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);
}

// setScale: a quick, cheap helper function to save myself some typing
function setScale(scale) {
    return mult(mvMatrix, scalem(scale, scale, scale));
}

// cube: returns a 2d array where [0] is the vertices and [1] is the normals
function cube() {
    var cubePoints = [
        quad(0, 1, 2, 3), //front face
        quad(0, 2, 4, 6), //left face
        quad(4, 6, 5, 7), //back face
        quad(1, 5, 3, 7), //right face
        quad(0, 4, 1, 5), //top face
        quad(7, 6, 3, 2), //bot face


    ];

    let points = [], norms = [];
    for (let i = 0; i < 6; i++) {
        points = points.concat(cubePoints[i][0]);
        norms.push(cubePoints[i][1]);
    }

    /*
    console.log("Points and norms:");
    console.log(points);
    console.log(norms);
    */

    return [points, norms];
}

// returns six points, to make the two triangles that make up a square
function quad(a, b, c, d) {
    var verts = [];
    var norms = [];


    var vertices = [
        vec4(-0.5, 0.5, 0.5, 1.0), //0
        vec4(0.5, 0.5, 0.5, 1.0), //1
        vec4(-0.5, -0.5, 0.5, 1.0), //2
        vec4(0.5, -0.5, 0.5, 1.0), //3
        vec4(-0.5, 0.5, -0.5, 1.0), //4
        vec4(0.5, 0.5, -0.5, 1.0), //5
        vec4(-0.5, -0.5, -0.5, 1.0), //6
        vec4(0.5, -0.5, -0.5, 1.0) //7
    ];

    var indices = [a, c, b, d, b, c];

    //console.log("QUAD STUFF:");
    for (var i = 0; i < indices.length; ++i) {
        //console.log("Quad: \n\t- i: " + i + "\n\t- indices[i]: " + indices[i]);// + "\n\t- vertices[ind[i]]: " + vertices[indices[i]]);
        var hold = vertices[indices[i]];
        //console.log(hold);
        verts.push(hold);
        norms.push(vertices[indices[i]][0]);
        norms.push(vertices[indices[i]][1]);
        norms.push(vertices[indices[i]][2]);
        norms.push(0.0);
    }
    if (texCoordsArray.length < 6) {
        texCoordsArray.push(texCoord[0]);
        texCoordsArray.push(texCoord[1]);
        texCoordsArray.push(texCoord[3]);
    }
    //console.log(verts);
    //console.log(norms);
    return [verts, norms];
}

var vertsToAdd;
var normsToAdd;

// sphere: a slightly modified version of tetrahedron from class, returns a 2d array where [0] is the vertices and [1] is the normals
function sphere(a, b, c, d, n) {
    vertsToAdd = new Array(0);
    normsToAdd = new Array(0);


    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);

    return [vertsToAdd, normsToAdd];
}

// same as from class, divides triangles to have a smoother-looking sphere
function divideTriangle(a, b, c, count) {
    if (count > 0) {

        var ab = mix(a, b, 0.5);
        var ac = mix(a, c, 0.5);
        var bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    } else {
        triangle(a, b, c);
    }
}

//same as from class, adds the points and normals to the list
function triangle(a, b, c) {
    vertsToAdd.push(a);
    vertsToAdd.push(b);
    vertsToAdd.push(c);

    // normals are vectors

    normsToAdd.push(a[0], a[1], a[2], 0.0);
    normsToAdd.push(b[0], b[1], b[2], 0.0);
    normsToAdd.push(c[0], c[1], c[2], 0.0);

    index += 3;

}


function loadImage(url, callback) {
    var image = new Image();
    image.src = url;
    image.onload = callback;
    return image;
}

function loadImages(urls, callback) {
    images = [];
    var imagesToLoad = urls.length;

    // Called each time an image finished
    // loading.
    var onImageLoad = function () {
        --imagesToLoad;
        // If all the images are loaded call the callback.
        if (imagesToLoad === 0) {
            callback(images);
        }
    };

    for (var ii = 0; ii < imagesToLoad; ++ii) {
        var image = loadImage(urls[ii], onImageLoad);
        images.push(image);
    }
}

var cubeMap;

function configureCubeMap() {
    cubeMap = gl.createTexture();

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, red);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, blue);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, yellow);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, cyan);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, magenta);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, green);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 0);

}

let cubeFaces = [];

function loadCubeMapImages() {
    cubeFaces = [];
    let urls = ["posx", "posy", "posz", "negx", "negy", "negz"];
    var imagesToLoad = urls.length;

    // Called each time an image finished
    // loading.
    var onImageLoad = function () {
        --imagesToLoad;
        // If all the images are loaded call the callback.
        if (imagesToLoad === 0) {
            configureCubeMapImage();
        }
    };

    for (var ii = 0; ii < imagesToLoad; ++ii) {
        var image = loadImage("resources/nv" + urls[ii] + ".bmp", onImageLoad);
        cubeFaces.push(image);
    }

}

function configureCubeMapImage() {
    cubeMap = gl.createTexture();

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    /*
    let posX = new Image();
    posX.crossOrigin = "";
    posX.src = "resources/nvposx.bmp";
    posX.onload = function () {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, posX);
    var posY = new Image();
    posY.crossOrigin = "";
    posY.src = "resources/nvposy.bmp";
    posY.onload = function () {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, posY);
    };
    var posZ = new Image();
    posZ.crossOrigin = "";
    posZ.src = "resources/nvposz.bmp";
    posZ.onload = function () {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, posZ);
    };
    var negX = new Image();
    negX.crossOrigin = "";
    negX.src = "resources/nvnegx.bmp";
    negX.onload = function () {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, negX);
    };
    var negY = new Image();
    negY.crossOrigin = "";
    negY.src = "resources/nvnegy.bmp";
    negY.onload = function () {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, negY);
    };
    var negZ = new Image();
    negZ.crossOrigin = "";
    negZ.src = "resources/nvnegz.bmp";
    negZ.onload = function () {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, negZ);
    };*/

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeFaces[0]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeFaces[1]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeFaces[2]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeFaces[3]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeFaces[4]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, cubeFaces[5]);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.uniform1i(cubemapLoc, 3);  // texture unit 3
}

// newellNormal()
// takes in one of my triangles (three point polygon) and calculates the normal for it
function newellNormal(p) {
    var normal = [0, 0, 0];
    let v1 = p[0];
    let v2 = p[1];
    let v3 = p[2];

    let U = subtract(v2, v1);
    let V = subtract(v3, v1);

    normal[0] += U[1] * V[2] - (U[2] * V[1]);
    normal[1] += U[2] * V[0] - (U[0] * V[2]);
    normal[2] += U[0] * V[1] - (U[1] * V[1]);
    return normalize(normal);
}