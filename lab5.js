/*
Randy Parisi
Lab5
*/


var canvas;
var gl;

var numVertices  = 12;

var pointsArray = [];
var normalsArray = [];

var vertices = [
		vec4( 4.0,  -4.0, 3.0, 1.0 ),//0
		vec4( 0.0, 4.0, 0.0, 1.0 ),//1
        vec4( -4.0, -4.0, 3.0, 1.0 ),//2
        vec4( 0.0, -4.0, -5.0, 1.0 ),//3
];

var lightPosition = vec4(0, 15, -15, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.8 , 0.0, 0.8, 1.0 );
var materialDiffuse = vec4( 1.0, 0.1, 1, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];
var speed = 0;

var thetaLoc;

var flag = true;

var leftarrow = 37;
var uparrow = 38;
var  rightarrow = 39;
var downarrow = 40;
var numpadzero = 96;

var black;
var eye, at, up;
var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var currentlyPressedKeys = {};


//			  1
//          / |\
//         /  | \
//        /   3  \
//       /  /   \  \
//      2--------0

// 012
// 031
// 321
// 032


function tri(a, b, c) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[b], vertices[c]);
     var normal = cross(t1, t2);
     var normal = vec3(normal);

     pointsArray.push(vertices[a]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[b]); 
     normalsArray.push(normal); 
     pointsArray.push(vertices[c]); 
     normalsArray.push(normal);  
}

function colorTri()
{
    tri( 2, 0, 1);
	tri( 0, 3, 1);
    tri( 3, 2, 1);
	tri( 0, 3, 2);
}

window.onload = function init() {
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    at = vec3(0.0, 0.0, 0.0);
    up = vec3(0.0, 1.0, 0.0);
    eye = vec3(1.0, 1.0, 1.0);
		
	m = mat4();
    m[3][3] = 0;
    m[3][1] = -1/lightPosition[1];
	black = vec4(0.0, 0.0, 0.0, 1.0);
	
	//Keys
	document.onkeydown = handleKeyDown;
	document.onkeyup = handleKeyUp;
	
    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
	shadowProgram = initShaders( gl, "shadow-vertex-shader", "shadow-fragment-shader" );
    gl.useProgram( program );
    
    colorTri();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "theta"); 
    
    viewerPos = vec3(0.0, 0.0, -20.0 );

	projection = ortho(-8, 8, -8, 8, -200, 200);
    
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );	
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),
       false, flatten(projection));
    
    render();
}

function handleKeyDown(event) {
	currentlyPressedKeys[event.keyCode] = true;
	if (event.keyCode == rightarrow) {
		axis = yAxis;
		speed = -.5;
	}
	if (event.keyCode == leftarrow) {
		axis = yAxis;
		speed = .5;
	}
	if (event.keyCode == downarrow) {
		axis = xAxis;
		speed = -.5;
	}
	if (event.keyCode == uparrow) {
		axis = xAxis;
		speed = .5;
	}
	if (event.keyCode == numpadzero) {
		flag = !flag;
	}
}

function handleKeyUp(event) {
	currentlyPressedKeys[event.keyCode] = false;
}

var render = function(){
            
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
           
    if(flag) theta[axis] += speed;
            
	//Model View matrix for 3D Obj
    modelView = mat4();
    modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0] ));
    modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0] ));
    modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1] ));
    
    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "modelViewMatrix"), false, flatten(modelView) );

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
	
	//Shadow
	modelViewMatrix = lookAt(eye, at, up);

	lightPosition[0] = 1;
	lightPosition[2] = 1;

	//Model View matrix for shadow
	modelViewMatrix = mult(modelViewMatrix, translate(lightPosition[0], lightPosition[1], lightPosition[2]));
	modelViewMatrix = mult(modelViewMatrix, m);
	modelViewMatrix = mult(modelViewMatrix, translate(-lightPosition[0], -lightPosition[1], -lightPosition[2]));
	
	//Change Shaders
	gl.useProgram( shadowProgram );
	
	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
	//gl.uniform4fv(fColor, flatten(black));
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
	         
    requestAnimFrame(render);
}
