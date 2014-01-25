var h1e = h1edpi_module
var fl = Math.floor
var rn = Math.round
var rand = Math.random

var FPS = 60
var TICK_LENGTH = 1000/FPS
var SCREEN_W = 480
var SCREEN_H = 320
var GRID_W = 16
var GRID_H = 16

h1e.bgstyle = "#000000"
h1e.init($("#main_canvas")[0], SCREEN_W, SCREEN_H, FPS)

h1e.add_image("background", "background.png")
h1e.add_image("sprites", "sprites.png")
h1e.add_image("font", "font.png")
h1e.add_image("guggenheim", "guggenheim.png")

var m = "|mask=#000000"
h1e.def_sprite("background", "background"+m, [[0,0,480,360]])
h1e.def_sprite("thing", "guggenheim"+m, [[0,0,24,24],[24,0,24,24]], [12,12])
//h1e.def_sprite("thing2", "sprites"+m, [[0,0,24,24],[24,0,24,24]], [12,12])

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

function Visual(game, sprite){
	this.sprite = sprite
}

function Position(game, x, y){
	this.x = x
	this.y = y
}

function SeedSpawner(game, interval_frames){
	var that = this

	this.timer = 0
	this.placeable = false

	this.should_blink = function(entity){
		return this.placeable
	}

	this.on_update = function(entity){
		if(this.timer >= 0){
			this.timer++
			if(this.timer >= interval_frames){
				//this.timer = 0 // Restart timer
				this.timer = -1 // Disable timer
				this.placeable = true
			}
		}
		if(this.placeable){
			this.on_click = function(entity){
				game.message = "Click to place"
				game.on_click_anything = function(mx, my){
					var x = rn(mx/GRID_W)
					var y = rn(my/GRID_H)
					if(game.get_entity_at(x, y)){
						game.message = "Cannot place on existing entity"
						return
					}
					game.message = undefined
					var e1 = {
						visual: new Visual(game, "thing"),
						position: new Position(game, x, y),
						seed_spawner: new SeedSpawner(game, 4*FPS),
					}
					game.entities.push(e1)
					that.placeable = false
				}
			}
		}
	}
}

function Game(){
	var that = this
	var game = this

	// Game-wide publicly settable callbacks
	this.on_click_anything = undefined // Cleared before calling

	this.message = undefined

	// Entities or whatever
	this.entities = []
	var e1 = {
		visual: new Visual(this, "thing"),
		position: new Position(this, 15, 15),
		seed_spawner: new SeedSpawner(this, 1*FPS),
	}
	this.entities.push(e1)

	// Other resources
	// TODO

	// End condition variables and whatever

	this.draw = function(){
		var now = Date.now() // Time in ms
		h1e.draw_sprite(0, 0, "background")
		h1e.draw_rect(0, 240, 480, 320-240, "#335522")
		this.entities.forEach(function(entity){
			if(entity.visual === undefined)
				return
			var visual = entity.visual
			var p = entity.position
			var show = true
			if(entity.__blink && fl(now/100)%2==0)
				show = false
			if(show)
				h1e.draw_sprite(p.x*GRID_W, p.y*GRID_H, visual.sprite)
		})
	}

	// Called every frame
	this.update = function(){
		this.entities.forEach(function(entity){
			entity.__blink = undefined
			for(var component_name in entity){
				var c = entity[component_name]
				if(c && c.on_update !== undefined){
					c.on_update(entity)
				}
				if(c && c.should_blink !== undefined){
					if(c.should_blink())
						entity.__blink = true
				}
			}
		})
		// Return true if something changed (will be redrawn)
		return true
	}

	this.get_entity_at = function(x, y){
		var found_entity = undefined
		var found = game.entities.some(function(entity){
			var p = entity.position
			if(p.x == x && p.y == y){
				found_entity = entity
				return true
			}
		})
		return found_entity
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
		if(game.message)
			draw_text(h1e, 0, 10, game.message)
		// Visualize what is selected
		// TODO
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
			// First global callback
			if(game.on_click_anything){
				var cb = game.on_click_anything
				game.on_click_anything = undefined
				// Now this callback can set game.on_click_anything if it wants
				cb(mx, my)
				return true // Handled
			}
			// Else entity that is here
			var done = game.entities.some(function(entity){
				var p = entity.position
				if(p === undefined)
					return
				if(Math.abs(mx - p.x*GRID_W) <= GRID_W/2 &&
						Math.abs(my - p.y*GRID_H) <= GRID_H/2){
					for(var component_name in entity){
						var c = entity[component_name]
						if(c && c.on_click){
							c.on_click(entity)
							return true
						}
					}
				}
			})
			if(done)
				return true // Handled
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

