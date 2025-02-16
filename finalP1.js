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

var curOtPos = vec3(2.5, -3.5, -distance * 2);
var lightPosition = vec4(2.5, -0.5, -distance, 0.0);
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
var origins = [];
var aColor = [];

var delayInMilliseconds = 0;

let sAngle = 0.57;

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

        while (r + g + b > 1.3) {
            r = Math.random();
            g = Math.random();
            b = Math.random();
        }
        aColor[i] = vec4(r, g, b, 1.0);
    }

    render();
};

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

// render: ran once per animation frame, sets up the view matrix before calling drawEverything() to summon all the items
// also handles keyboard commands
function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0, 0, 0);

    //modelViewMatrix = lookAt(vec3(0, 0, -8), at, up);
    modelViewMatrix = lookAt(eye, at, up);


    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));


    gl.uniform1f(angleLoc, sAngle);

    mvMatrix = lookAt(vec3(0, 0, 0), at, up);

    //draw everything
    drawEverything();

    theta += tRate;


    window.onkeypress = function (event) {
        var key = event.key;
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
                break;
            case 'M': // The scene is shaded using flat shading
            case 'n':
                mode = 'f';
                break;
            case 'b':
                tRate += 0.1;
                break;
            case 'v':
                if (tRate >= 0.1)
                    tRate -= 0.1;
                break;
        }
    };

    setTimeout(function () {
        id = requestAnimationFrame(render);
    }, delayInMilliseconds);
}

//create cubes and spheres, set modifiers for theta
let aCube = cube();
let aSphere = sphere(va, vb, vc, vd, numTimesToSubdivide);
let spot;
let mod = [0, 0, 2, 8];

// drawEverything: creates the single top object and its two children before calling drawChildren() to handle everything else
function drawEverything() {
    spot = 2;

    let pMatrix = perspective(fovy, aspect, 0.1, 20);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(pMatrix));


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
            if (depth < 3) {
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
function draw(objectArr, color, count) {
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

    for (let i = 0; i < count; i += 3) {
        gl.drawArrays(gl.TRIANGLES, i, 3);
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