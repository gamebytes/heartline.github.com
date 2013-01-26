//Canvas Dimension Constants
var W=800; var H=512;
//Key Code Constants
var UP=38,DOWN=40,LEFT=37,RIGHT=39, Z=90, X=88, C=67, SHIFT=16, ENTER=13, SPACE=32, M=77;

//StateManager Stuff
var States = {
	STATE_MENU: 0,
	STATE_LEVELSELECT: 1,
	STATE_PLAY: 2,
	STATE_ENDING: 3
};
var state = States.STATE_PLAY;

var musicOn = true;

var assetManager = new AssetManager();
var canvas;
var context;
var tileSet;

var roomID;
var currRoom;

var entityManager;
var player;

var CAMERA_SHAKE_FACTOR = 10;
var camera = {
	x: 0,
	y: 0,
	minZoom: 0.5,//calculate this at beginning of each room.
	zoom: 1,
	shake: 0, //0 is normal, > 0 is a timer for shaking,
	setZoom: function(z) {
		this.zoom = z;
		if(this.zoom < this.minZoom) {
			this.zoom = this.minZoom;
		}
	},
	moveTo: function(tx, ty) {
		this.x = (tx - this.x)*0.1 + this.x;
		this.y = (ty - this.y)*0.1 + this.y;
	}
};

var loadNextRoom = function() {
	currRoom = assetManager.rooms[roomID];
	if(currRoom === undefined) {
		//we're done!
		state = States.STATE_ENDING;
		return;
	}
	roomID++;
	if(player==undefined)
		player = new Player(currRoom, 0, 0);
	
	controller1.addEventListener(controller1.JUMP_PRESS_EVENT, function() {player.jumpPress()});
	controller1.addEventListener(controller1.JUMP_RELEASE_EVENT, function() {player.jumpRelease()});

	entityManager.clear();
	currRoom.loadEntities(entityManager, player);
	player.room =currRoom;
	//Calculate the minimum zoom based on room dimensions.
	var a = W / (currRoom.width * TILE_SIZE); 
	var b = H / (currRoom.height * TILE_SIZE);
	if(a > b)
		camera.minZoom = a;
	else
		camera.minZoom = b;
		
	if(currRoom.cutscenes !== undefined && currRoom.cutscenes.length > 0) {
		cutScene = new Cutscene(currRoom.cutscenes);
	}
	else {
		cutScene = new Cutscene();
	}
	player.health = PLAYER_MAX_HEALTH;
}
var tryAgain = function() {
	roomID--;
	entityManager = new EntityManager();
	player = undefined;
	loadNextRoom();
};

var controller1 =
	new keyboard_controller(defaultPlayer1);
	

var game_logic = function() {
	controller1.poll();
	if(controller1.dir.x < 0)
		player.moveLeft();
	else if (controller1.dir.x > 0)
		player.moveRight();
	
	if(keyPressed['G'.charCodeAt(0)])
		entityManager.showBoundingBoxes = true
	else if (keyPressed['H'.charCodeAt(0)])
		entityManager.showBoundingBoxes = false
	if (keyPressed['C'.charCodeAt(0)])
	{
		if (navigator.webkitGetGamepads()[0] != null)
		{
			controller1.detach()
			controller1 = new gamepad_controller(0, null)
			controller1.addEventListener(controller1.JUMP_PRESS_EVENT, function() {player.jumpPress()});
			controller1.addEventListener(controller1.JUMP_RELEASE_EVENT, function() {player.jumpRelease()});
		}
	}
	entityManager.update();
};
var game_draw = function() {
	if(currRoom === undefined)
		return;
	context.fillStyle = "gray";
	context.fillRect(0, 0, W, H);
	
	context.save();
	context.scale(camera.zoom, camera.zoom);
	if(camera.shake > 0) {
		context.translate(-camera.x + (Math.random() - 0.5)*CAMERA_SHAKE_FACTOR, -camera.y + (Math.random() - 0.5)*CAMERA_SHAKE_FACTOR);
		camera.shake--;
	}
	else {
		context.translate(-camera.x + W/(2*camera.zoom), -camera.y + H/(2*camera.zoom));
	}
	if(!player.dead) {
		currRoom.draw(context);
		entityManager.draw(context);
		context.restore();
	}
	else {
		context.restore();
	
		player.draw(context);
	}
};


var step = function() {
	switch(state) {
		case States.STATE_PLAY:
			game_logic();
			game_draw();
		break;
	}
	camera.moveTo(player.x, player.y);
};

var initialize_game = function() {
	tileSet = assetManager.getTileset("gfx/tileset.png");
	roomID = 0;
	entityManager = new EntityManager();
	loadNextRoom();
	continueMenu = 0;
	
	return setInterval(step, 20); 
};

window.onload = function() {
	canvas = document.getElementById("gamecanvas");
	context = canvas.getContext("2d");
	context.font = "12pt Calibri";
	
	context.fillStyle = "#6666aa";
	context.fillRect(0, 0, W, H);

	// downloadAll ( success, fail, complete )
	assetManager.downloadAll( function(path){
					console.log("Loaded: " + path);
					context.fillStyle = "white";
					
					context.fillText(path, Math.floor((11+(assetManager.successCount + assetManager.errorCount)*11) / H) * W/4, 6+((assetManager.successCount + assetManager.errorCount)*11)%H);
					
					//LOADING BAR
					context.beginPath();
					context.rect(100, H/2-25, W-200, 50);
					context.lineWidth=2;
					context.strokeStyle = "black";
					context.stroke();
					
					var ratio = assetManager.successCount / assetManager.getNumAssets();
					context.beginPath();
					context.rect(100, H/2-25, (W-200)*ratio, 50);
					context.fillStyle = "white";
					context.fill();
					context.lineWidth=2;
					context.strokeStyle = "black";
					context.stroke();
					
				}, function(path){
					console.log("!! Failed to load: " + path);
					context.fillStyle = "red";
					context.fillText(path, Math.floor((11+(assetManager.successCount + assetManager.errorCount)*11) / H) * W/4, 6+((assetManager.successCount + assetManager.errorCount)*11)%H);
					
					//LOADING BAR
					context.beginPath();
					context.rect(100, H/2-25, W-200, 50);
					context.lineWidth=2;
					context.strokeStyle = "black";
					context.stroke();
					
					var ratio = assetManager.successCount / assetManager.getNumAssets();
					context.beginPath();
					context.rect(100, H/2-25, (W-200)*ratio, 50);
					context.fillStyle = "white";
					context.fill();
					context.lineWidth=2;
					context.strokeStyle = "black";
					context.stroke();
					
				}, function() {
					initialize_game();
				});
};
