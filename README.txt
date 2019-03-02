Ben Newmark
CS 4731
Final Project Part 2

NOTE:
	When running the HTML file straight from Explorer, there's some Uncaught DOMException - I don't know what that is. It works perfectly fine on two different computer when ran within WebStorm, though, so I'm hoping that it'll work fine when tested. If not, I can provide screenshots or something? It should definitely run from WebStorm, though.

FILES: 
	- finalP2-2.js has all of the javascript code for the final version of Part 2. Functions are described below.
	- finalP2-2.html is the accompanying HTML file for finalP1.js, and has the shader calculations and initial GUI creation.
	- resources/ is a folder containing all the textures needed, and should be kept in the same directory as finalP2-2.* (so two files and a folder should be there).

	When first started, finalP2-2.js runs an init function to load up everything that doesn't change past initialization - the diffuse product, ambient product, shininess, object colors, etc. When done, it calls texturesLookup().
	texturesLookup() handles the image and texture creation of the wall-stone, floor-grass, and cubemaps. It does this through the different helper functions like configureCubeMap() and loadCubeMapImages(). When done, it calls render().
	When render() is called, it clears the previous buffer before anything else. It then sets up (or updates) everything that needs changing, like the spotlight angle or view/projection matrices. When done, it calls drawBackground() and drawObjects() to handle the drawing of the back walls/floor and objects respectively. After that's done, it increments theta (the spotlight angle) by one and calls requestAnimationFrame() to repeat itself.
	The keyboard listener is set up outside of a function, directly below render(). It handles listening for the toggles, as well as updating the GUI to visually help the user know about the toggle's change.
	drawBackground() is the initializer for creating the walls and floor. It creates large planes through translations, rotates, and scaling, as well as texturing them (if applicable).
	drawObjects() is the initializer for the object drawing functions. It draws the top level object and its two children using pushes and pops. After each child is made, each child calls makeChildren() twice - once for its own left child, once for its right child.
	makeChildren() is a recursive function to create objects. It takes in the current depth and whether it should make a left or right child. If it's a left child, then it creates the parent/children connection line between itself, its sibling, and its brother, and then makes a sphere using draw(). If it's a right child, it only creates a cube using draw(). When an object is done being made, it checks the depth. If the depth is below a threshold, it recursively runs makeChildren() again with depth increased twice, once for its own left and right children.
	draw() takes objectArr, which is a 2d array holding vertices ([0]) and normals ([1]), color, which is a color, and count, which is the number of vertices for the object. It's nearly the same as in Part 1, except for two main changes. The first is the texture stuff, which is a quick multi-conditional if-statement that just binds texture units as needed and tells the shader to consider them background objects (no reflection/refraction/shadows). The second is the shadow calculations, which works just like the PDF given tells us to. It does use a slightly janky system for "z" at the end, but it works well enough that I'm content handing it in.
	The spotlight for the scene is set to the right, off-center, and coming from the foreground and towards the background. 