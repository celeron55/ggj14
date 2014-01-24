var h1e = h1edpi_module
var fl = Math.floor
var rand = Math.random

var FPS = 60
var TICK_LENGTH = 1000/FPS
var SCREEN_W = 480
var SCREEN_H = 320

h1e.bgstyle = "#000000"
h1e.init($("#main_canvas")[0], SCREEN_W, SCREEN_H, FPS)

h1e.add_image("background", "background.png")
h1e.add_image("sprites", "sprites.png")
h1e.add_image("font", "font.png")

var m = "|mask=#000000"
h1e.def_sprite("background", "background"+m, [[0,0,480,360]])
h1e.def_sprite("thing", "sprites"+m, [[0,0,16,16],[16,0,16,16]], [8,8])

var font_frames = []
for(var i=0; i<128; i++){
	var xi = i%16
	var yi = fl(i/16)
	font_frames.push([xi*5, yi*8, 5, 8])
}
h1e.def_sprite("font", "font", font_frames)

function draw_text(h1e, x, y, text, fontname)
{
	if(typeof(h1e) != "object")
		throw "h1e not object"
	if(!h1e.isstring(text))
		text = "Invalid string"
	fontname = fontname || "font"
	text = text.toUpperCase()
	var x1 = x
	var y1 = y
	for(var i in text){
		if(text.charCodeAt(i) == 10){
			x1 = x
			y1 += 8
			continue
		}
		h1e.draw_sprite(x1, y1, fontname, {frame: text.charCodeAt(i)})
		x1 += 5
	}
}

function pad(n, w, z, d)
{
	w = w || 1
	if(typeof(n) == "number"){
		dn = Math.pow(10, d||0)
		n = Math.round(n*dn)/dn
	}
	z = z || ' ';
	n = n + '';
	return n.length >= w ? n : new Array(w - n.length + 1).join(z) + n;
}

// Make numbers prettier by rounding them; eg. 36274 -> 36000
function roundify(v)
{
	if(typeof(v) != "number")
		return v
	var l = (''+Math.round(v)).length
	if(l <= 2)
		return v
	var f = Math.pow(10, l-2)
	return Math.round(v/f)*f
}

function Game(){
	var that = this
	var game = this

	// Entities or whatever
	var entities = []
	entities.push({
		type: "plantpart",
		x: 100,
		y: 100,
	})

	// Other resources
	// TODO

	// End condition variables and whatever

	this.draw = function(){
		h1e.draw_sprite(0, 0, "background")
		entities.forEach(function(entity){
			if(entity.type == "plantpart"){
				h1e.draw_sprite(entity.x, entity.y, "thing")
			}
		})
	}

	// Called every frame
	this.update = function(){
		// Return true if something changed (will be redrawn)
		return true
	}
}

function GameSection(game){
	var that = this
	game = game ? game : new Game()

	var some_text = "FOO"

	this.draw = function(h1e){
		mouse_callbacks = []
		game.draw()
		draw_text(h1e, 0, 0, some_text)
	}
	this.event = function(h1e, event){
		if(event.type == "keydown"){
			if(h1e.iskey(event.key, ["escape", "q"])){
				//h1e.remove_section(this)
				return true
			}
		}
		if(event.type == "mousedown"){
			var mx = h1e.mousex()
			var my = h1e.mousey()
			some_text = "CLICKED AT ("+mx+", "+my+")"
		}
		if(event.type == "mouseup"){
		}
	}
	this.update = function(h1e){
		// Return true if something changed (will be redrawn)
		return game.update()
	}
}

h1e.push_section(new GameSection())

function pad_stuff(){
	h1e.resize_canvas($(window).width() - 5, $(window).height() - 5)
}

$(document).ready(function(){
	pad_stuff()
	$(window).resize(function(){
		pad_stuff()
	})
	//$("#some_audio")[0].volume = 0.7
	h1e.start()
})

