var canvas;
var gl;

var numTimesToSubdivide = 4;

var index = 0;

var pointsArray = [];
var normalsArray = [];


var near = -10;
var far = 10;

var left = -3.0;
var right = 3.0;
var ytop = 3.0;
var bottom = -3.0;

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.0, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(0.3, 0.3, 0.3, 1.0);
var lightSpecular = vec4(1.0, 0.3, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.3, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 20.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);


var program;
var fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio
var stack = [];
var origins = [];
var aColor = [];

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

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
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    origins = new Array(3);
    for (let i = 0; i < 4; i++) {
        origins[i] = new Array(i + 1);

    }

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

let transAmount = 0;
let theta = 0;
let mDir = 1;
let distance = 8;
let mvMatrix;

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0, 0, 0);

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);


    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    pMatrix = perspective(fovy, aspect, .1, 20);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(pMatrix));

    mvMatrix = lookAt(vec3(0, 0, 0), at, up);

    doEverything();

    if (mDir === 1) {
        transAmount += 0.01;
        if (transAmount >= 1)
            mDir = -1;
    }
    if (mDir === -1) {

        transAmount -= 0.01;
        if (transAmount <= 0) {
            mDir = 1;
        }
    }

    theta += 1;

    var delayInMilliseconds = 0; //1 second
    id = requestAnimationFrame(render);
    setTimeout(function () {
        //id = requestAnimationFrame(render);
    }, delayInMilliseconds);
}

let aCube = cube();
let aSphere = sphere(getSphereVecs(0, 0, 0, 1), numTimesToSubdivide);
let spot = 2;

function doEverything() {
    spot = 2;
    //console.log("At depth " + depth + ", type " + type);
    //if-push statements are just for clarity of the stack, should have been removed before I submitted (whoops)
    //base level, one object
    mvMatrix = setScale(0.75);
    mvMatrix = mult(translate(0, 0.5, 0), mvMatrix); //move because that's the camera

    if (stack.push(mvMatrix)) {
        mvMatrix = mult(translate(0, 1.0, -distance), mvMatrix); //move because that's the camera

        mvMatrix = mult(mvMatrix, rotateY(theta / 2)); //rotate around origin
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
        draw(aCube, aColor[0], 36);
        mvMatrix = mult(translate(0, -0.5, 0), mvMatrix);
    }
    mvMatrix = stack.pop();


    mvMatrix = setScale(0.65); //smaller than before
    if (stack.push(mvMatrix)) {//AXIS
        mvMatrix = mult(translate(-1.5, 0, 0), mvMatrix);
        mvMatrix = mult(rotateY(theta), mvMatrix); //rotate around origin
        mvMatrix = mult(translate(0, 0, -distance), mvMatrix); //move because that's the camera
        mvMatrix = setScale(0.65); //smaller than before
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
        draw(aSphere, aColor[1], 12 * Math.pow(4, numTimesToSubdivide));
        drawLine(2.5);
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

    if (stack.push(mvMatrix)) {//AXIS
        mvMatrix = mult(translate(1.5, 0, 0), mvMatrix);
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

function makeChildren(depth, type) {
    //console.log("At depth " + depth + ", type " + type);
    let thetaMod = 1;
    spot++;
    if (depth % 2 === 0)
        thetaMod = -1;
    if (stack.push(mvMatrix)) {
        mvMatrix = setScale(0.7); //smaller than before

        mvMatrix = mult(mvMatrix, rotateY(thetaMod * 2 * theta)); //rotate around origin
        if (stack.push(mvMatrix)) { //LEFT-er
            mvMatrix = mult(mvMatrix, translate(type * 1.75, 0, 0));
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
            if (type === -1)
                drawLine();
            draw(aCube, aColor[spot], 36);

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


    /*
    //level 2, two limbs and four objects total
    mvMatrix = setScale(0.7);
    if (stack.push(mvMatrix)) {//ENTERING LEVEL 2
        mvMatrix = mult(translate(0, -0.5, 0), mvMatrix);
        if (stack.push(mvMatrix)) { //LEFT SIDE OF LEVEL 2
            mvMatrix = mult(translate(-1.5, 0, 0), mvMatrix);
            mvMatrix = mult(rotateY(-theta), mvMatrix); //rotate around origin

            if (stack.push(mvMatrix)) {//axis
                mvMatrix = mult(translate(0, 0, -distance), mvMatrix); //move because that's the camera
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                draw(blueCube, vec4(0.0, 0.0, 1.0, 1.0), 36);

                mvMatrix = mult(translate(0, -0.75, 0), mvMatrix);

                //level 3
                mvMatrix = setScale(0.7);
                mvMatrix = mult(mvMatrix, rotateY(2 * theta)); //rotate around origin
                if (stack.push(mvMatrix)) { //LEFT-er
                    mvMatrix = mult(mvMatrix, translate(-1.5, 0, 0));
                    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                    draw(greenCube, vec4(0.0, 1.0, 0.0, 1.0), 36);

                    //LEVEL 4-l
                    mvMatrix = mult(translate(0, -0.5, 0), mvMatrix);
                    mvMatrix = setScale(0.7);
                    mvMatrix = mult(mvMatrix, rotateY(-2 * theta)); //rotate around origin
                    if (stack.push(mvMatrix)) { //LEFT-er
                        mvMatrix = mult(mvMatrix, translate(-1.5, 0, 0));
                        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                        draw(redCube, vec4(1.0, 0.0, 0.0, 1.0), 36);
                    }
                    mvMatrix = stack.pop();

                    if (stack.push(mvMatrix)) { //RIGHT-er
                        mvMatrix = mult(mvMatrix, translate(1.5, 0, 0));
                        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                        draw(redCube, vec4(1.0, 0.0, 0.0, 1.0), 36);
                    }
                    mvMatrix = stack.pop();
                }
                mvMatrix = stack.pop();

                if (stack.push(mvMatrix)) { //RIGHT-er
                    mvMatrix = mult(mvMatrix, translate(1.5, 0, 0));
                    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                    draw(greenCube, vec4(0.0, 1.0, 0.0, 1.0), 36);


                    //LEVEL 3
                    mvMatrix = mult(translate(0, -0.5, 0), mvMatrix);
                    mvMatrix = setScale(0.7);
                    mvMatrix = mult(mvMatrix, rotateY(-2 * theta)); //rotate around origin
                    if (stack.push(mvMatrix)) { //LEFT-er
                        mvMatrix = mult(mvMatrix, translate(-1.5, 0, 0));
                        //mvMatrix = mult(rotateY(theta), mvMatrix); //rotate around origin
                        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                        draw(redCube, vec4(1.0, 0.0, 0.0, 1.0), 36);
                    }
                    mvMatrix = stack.pop();

                    if (stack.push(mvMatrix)) { //RIGHT-er
                        mvMatrix = mult(mvMatrix, translate(1.5, 0, 0));
                        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                        draw(redCube, vec4(1.0, 0.0, 0.0, 1.0), 36);
                    }
                    mvMatrix = stack.pop();
                }
                mvMatrix = stack.pop();
            }
            mvMatrix = stack.pop();

        }//end of left side, pop back to level 2
        mvMatrix = stack.pop();

        //---------------------------------
        if (stack.push(mvMatrix)) { //RIGHT SIDE OF LEVEL 2
            mvMatrix = mult(translate(1.5, 0, 0), mvMatrix);
            mvMatrix = mult(rotateY(-theta), mvMatrix); //rotate around origin

            if (stack.push(mvMatrix)) {//AXIS
                mvMatrix = mult(translate(0, 0, -distance), mvMatrix); //move because that's the camera
                gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                draw(blueCube, vec4(0.0, 0.0, 1.0, 1.0), 36);

                mvMatrix = mult(translate(0, -0.75, 0), mvMatrix);

                //level 3
                mvMatrix = setScale(0.7);
                mvMatrix = mult(mvMatrix, rotateY(2 * theta)); //rotate around origin
                if (stack.push(mvMatrix)) { //LEFT-er
                    mvMatrix = mult(mvMatrix, translate(-1.5, 0, 0));
                    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                    draw(greenCube, vec4(0.0, 1.0, 0.0, 1.0), 36);

                    //LEVEL 4-l
                    mvMatrix = mult(translate(0, -0.5, 0), mvMatrix);
                    mvMatrix = setScale(0.7);
                    mvMatrix = mult(mvMatrix, rotateY(-2 * theta)); //rotate around origin
                    if (stack.push(mvMatrix)) { //LEFT-er
                        mvMatrix = mult(mvMatrix, translate(-1.5, 0, 0));
                        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                        draw(redCube, vec4(1.0, 0.0, 0.0, 1.0), 36);
                    }
                    mvMatrix = stack.pop();

                    if (stack.push(mvMatrix)) { //RIGHT-er
                        mvMatrix = mult(mvMatrix, translate(1.5, 0, 0));
                        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                        draw(redCube, vec4(1.0, 0.0, 0.0, 1.0), 36);
                    }
                    mvMatrix = stack.pop();
                }
                mvMatrix = stack.pop();

                if (stack.push(mvMatrix)) { //RIGHT-er
                    mvMatrix = mult(mvMatrix, translate(1.5, 0, 0));
                    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                    draw(greenCube, vec4(0.0, 1.0, 0.0, 1.0), 36);


                    //LEVEL 3
                    mvMatrix = mult(translate(0, -0.5, 0), mvMatrix);
                    mvMatrix = setScale(0.7);
                    mvMatrix = mult(mvMatrix, rotateY(-2 * theta)); //rotate around origin
                    if (stack.push(mvMatrix)) { //LEFT-er
                        mvMatrix = mult(mvMatrix, translate(-1.5, 0, 0));
                        //mvMatrix = mult(rotateY(theta), mvMatrix); //rotate around origin
                        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                        draw(redCube, vec4(1.0, 0.0, 0.0, 1.0), 36);
                    }
                    mvMatrix = stack.pop();

                    if (stack.push(mvMatrix)) { //RIGHT-er
                        mvMatrix = mult(mvMatrix, translate(1.5, 0, 0));
                        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
                        draw(redCube, vec4(1.0, 0.0, 0.0, 1.0), 36);
                    }
                    mvMatrix = stack.pop();
                }
                mvMatrix = stack.pop();
            }
            mvMatrix = stack.pop();

        }//end of left side, pop back to level 2
        mvMatrix = stack.pop();


    }//end of level 2, pop back to general
    mvMatrix = stack.pop();

    if (stack.push(mvMatrix)) {
        mvMatrix = mult(translate(1.5, -1.5, 1), mvMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));
        //draw(greenCube, vec4(0.0, 1.0, 0.0, 1.0), 36);
    }
    mvMatrix = stack.pop();

    if (stack.push(mvMatrix)) {
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix));

        var thing = Math.pow(4, numTimesToSubdivide);
        //console.log("4^" + numTimesToSubdivide + ": " + thing);
        thing *= 12;
        //console.log("sphere index: " + thing);
        //draw(ambSphere, vec4(1.0, 0.5, 0.5, 1.0), thing);
    }
    mvMatrix = stack.pop();
    }

    mvMatrix = stack.pop();
    */


}

function draw(objectArr, color, count) {
    var object = objectArr[0];
    var objNorm = objectArr[1];

    var fragColors = [];

    for (var i = 0; i < object.length; i++) {
        fragColors.push(color);
    }

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
    gl.bufferData(gl.ARRAY_BUFFER, flatten(objNorm), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);


    gl.drawArrays(gl.TRIANGLES, 0, count);
}


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

    var vColor = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);


    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), 10000000000);
    gl.drawArrays(gl.LINE_STRIP, 0, lines.length);
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);
}


function setScale(scale) {
    return mult(mvMatrix, scalem(scale, scale, scale));
}

function cube() {
    var cubePoints = [
        quad(1, 0, 3, 2),
        quad(2, 3, 7, 6),
        quad(3, 0, 4, 7),
        quad(6, 5, 1, 2),
        quad(4, 5, 6, 7),
        quad(5, 4, 0, 1)
    ];

    let points = [], norms = [];
    for (let i = 0; i < 6; i++) {
        points = points.concat(cubePoints[i][0]);
        norms.push(cubePoints[i][1]);
    }

    /*console.log("Points and norms:");
    console.log(points);
    console.log(norms);*/

    return [points, norms];
}


function quad(a, b, c, d) {
    var verts = [];
    var norms = [];

    var vertices = [
        vec4(-0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, 0.5, 0.5, 1.0),
        vec4(0.5, 0.5, 0.5, 1.0),
        vec4(0.5, -0.5, 0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5, 0.5, -0.5, 1.0),
        vec4(0.5, 0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

    var indices = [a, b, c, a, c, d];

    for (var i = 0; i < indices.length; ++i) {
        //console.log("Quad: \n\t- i: " + i + "\n\t- indices[i]: " + indices[i] + "\n\t- vertices[ind[i]]: " + vertices[indices[i]]);
        var hold = vertices[indices[i]];
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

function sphere(vectors, n) {
    vertsToAdd = new Array(0);
    normsToAdd = new Array(0);

    let a = vectors[0];
    let b = vectors[1];
    let c = vectors[2];
    let d = vectors[3];

    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(va, d, b, n);
    divideTriangle(va, c, d, n);

    return [vertsToAdd, normsToAdd];
}


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

function getSphereVecs(x, y, z, s) {
    let basex = 0.816497;
    x = 0;
    y = 0;
    z = 0;
    let va = vec4(0.0 + x, 0.0 + y, -1.0 + z, 1);
    let vb = vec4(0.0 + x, 0.942809 + y, 0.333333 + z, 1);
    let vc = vec4(-basex + x, -0.471405 + y, 0.333333 + z, 1);
    let vd = vec4(basex + x, -0.471405 + y, 0.333333 + z, 1);

    return [va, vb, vc, vd];
}