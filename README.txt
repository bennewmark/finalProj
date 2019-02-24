Ben Newmark
CS 4731
Final Project Part 1

FILES: 
	- finalP1.js has all of the javascript code for the final version of Part 1. Functions are described below.
	- finalP1.html is the accompanying HTML file for finalP1.js, and has the shader calculations.
	- orig.js is an older version of the code that lacks a spotlight or other details, but shows my original method for creating all of the objects and has a slightly more functional flat/Gouraud shading ability.
	- orig.html is orig.js's accompanying HTML file.


	When first started, finalP1.js runs an init function to load up everything that doesn't change past initialization - the diffuse product, ambient product, shininess, object colors, etc. When done, it calls render().
	When render() is called, it clears the previous buffer before anything else. It then sets up (or updates) everything that needs changing, like the spotlight angle or view/projection matrices. When done, it calls drawEverything() to handle the drawing of everything. After that's done, it increments theta (the spotlight angle) by one, sets up the keyboard listeners, and calls requestAnimationFrame() to repeat itself.
	drawEverything() is the initializer for the drawing functions. It draws the top level object and its two children using pushes and pops. After each child is made, each child calls makeChildren() twice - once for its own left child, once for its right child.
	makeChildren() is a recursive function to create objects. It takes in the current depth and whether it should make a left or right child. If it's a left child, then it creates the parent/children connection line between itself, its sibling, and its brother, and then makes a sphere using draw(). If it's a right child, it only creates a cube using draw(). When an object is done being made, it checks the depth. If the depth is below a threshold, it recursively runs makeChildren() again with depth increased twice, once for its own left and right children.
	draw() takes objectArr, which is a 2d array holding vertices ([0]) and normals ([1]), color, which is a color, and count, which is the number of vertices for the object. It's pretty much the standard draw() function used in previous projects. It does have some special code for using normals for flat versus Gouraud shading, but it's... kinda broken, and doesn't really work.
	The spotlight for the scene is set to the right, off-center, and coming from the foreground and towards the background. 