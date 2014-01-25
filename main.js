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
var TILES_W = fl(SCREEN_W/GRID_W)
var TILES_H = fl(SCREEN_H/GRID_H)

h1e.bgstyle = "#000000"
h1e.init($("#main_canvas")[0], SCREEN_W, SCREEN_H, FPS)

h1e.add_image("background", "background.png")
h1e.add_image("sprites", "sprites.png")
h1e.add_image("font", "font.png")
h1e.add_image("guggenheim", "guggenheim2.png")
h1e.add_image("special", "special.png")

var m = "|mask=#000000"
h1e.def_sprite("background", "background"+m, [[0,0,480,360]])
h1e.def_sprite("shadow", "special", [[0,0,24,24], [12,12]])

var y0 = 0
var names = ["flower","tree1","tree2","seed","halfgrown","vine"]
names.forEach(function(name, i){
	h1e.def_sprite(name, "guggenheim"+m, [[24*i,y0,24,24]], [12,12])
})

var y0 = 24+32
var names = ["tile_brown", "tile_red", "tile_grey"]
names.forEach(function(name, i){
	h1e.def_sprite(name, "guggenheim"+m, [[16*i,y0,16,16]], [0,0])
})

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

function GenesComponent(game, current_genes){
	h1e.checkobject(current_genes)
	this.current = current_genes
}

function SeedSpawner(game, interval_frames){
	var that = this

	// kannattaa tehdä vähentämällä nollaan, koska voi varioida timeriä
	this.timer = interval_frames
	this.placeable = false
	
	// periytyviä attribuutteja
	// ilmeisesti flowerspawner saa nämä ja välittää eteenpäin
	this.life = 15*FPS // elinikä, TODO: geenien laiffi + veden määrä
	this.growth = 1	// kasvunopeus
	this.absorb = 1 // veden imukyky

	this.should_blink = function(entity){
		return this.placeable
	}

	this.on_update = function(entity){
		if (this.life !== undefined && this.life==0) {
			// miten entityn tappaminen toimii ja thisin ei?!?!?!?!?!
			game.delete_entity(entity)
			return
		}
		// okei, this ei ehkä viittaa siihen mihin luulen... 
		this.life--
		
		if(this.timer > 0){
			this.timer--
			if(this.timer == 0){
				//this.timer = 0 // Restart timer
				this.timer = -1 // Disable timer
				this.placeable = true
			}
		}
		
		this.on_click = function(entity){
			if(this.placeable){
				game.message = "Click to place"
				game.place_tooltip_sprite = "seed"
				game.on_click_anything = function(mx, my){
					game.message = undefined
					game.place_tooltip_sprite = undefined
					var x = rn((mx-GRID_W/2)/GRID_W)
					var y = rn((my-GRID_H/2)/GRID_H)
					if(game.get_entity_at(x, y)){
						game.message = "Cannot place on existing entity"
						return
					}
					h1e.checkobject(entity.genes)
					var e1 = create_seed_entity(game, x, y, 2*FPS,
							entity.genes.current)
					game.entities.push(e1)
					that.placeable = false
					// saat laittaa uudelleen jos kasvi elää niin kauan
					// (ilman vesimekaniikkaa ja geenejä, elää aina siihen asti)
					that.timer = 6*FPS
				}
			}
		}
	}
}

function FlowerSpawner(game, interval_frames){
	var that = this

	this.timer = 0

	this.should_blink = function(entity){
		return this.placeable
	}

	this.on_update = function(entity){
		if(this.timer >= 0){
			this.timer++
			if(this.timer == interval_frames-30){
				entity.visual = new Visual(game, "halfgrown")
			}
			if(this.timer >= interval_frames){
				//this.timer = 0 // Restart timer
				this.timer = -1 // Disable timer
				this.grow(entity)
			}
		}
	}

	this.grow = function(entity){
		entity.visual = new Visual(game, "flower")
		entity.flower_spawner = false
		entity.seed_spawner = new SeedSpawner(game, 2*FPS)
	}
}

function create_flower_entity(game, x, y, interval_frames, genes){
	h1e.checkobject(genes)
	return {
		visual: new Visual(game, "flower"),
		position: new Position(game, x, y),
		seed_spawner: new SeedSpawner(game, interval_frames),
		genes: new GenesComponent(game, genes),
	}
}

function create_seed_entity(game, x, y, interval_frames, genes){
	h1e.checkobject(genes)
	return {
		visual: new Visual(game, "seed"),
		position: new Position(game, x, y),
		flower_spawner: new FlowerSpawner(game, interval_frames),
		genes: new GenesComponent(game, genes),
	}
}

function Game(){
	var that = this
	var game = this

	// Game-wide publicly settable callbacks and stuff
	this.on_click_anything = undefined // Cleared before calling
	this.place_tooltip_sprite = undefined
	this.message = undefined

	// Entities or whatever
	this.entities = []
	// Create initial entity
	var genes = new Genes(Math.random()*2, Math.random()*2, Math.random()*2)
	this.entities.push(create_flower_entity(game, 15, 15, 1*FPS, genes))

	// Other resources
	this.tiles = new Tiles(TILES_W, TILES_H)
	generate_ground(this.tiles, Date.now())

	// End condition variables and whatever

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

	this.delete_entity = function(entity){
		// oletetaan, ettei ole tapettu jo
		// varmaan voisi tehdä bufferin, ettei skipata seuraavaa elementtiä
		this.entities.splice(this.entities.indexOf(entity), 1);
	}
}

function GameSection(game){
	var that = this
	game = game ? game : new Game()

	var some_text = "FOO"

	this.draw = function(h1e){
		var now = Date.now() // Time in ms (for blinking and whatever)
		// Background
		h1e.draw_sprite(0, 0, "background")
		var green_y = 160
		h1e.draw_rect(0, green_y, 480, 320-green_y, "#335522")
		// Tiles
		for(var y=0; y<TILES_H; y++)
		for(var x=0; x<TILES_W; x++)
		{
			var t = game.tiles.get(x, y)
			if(t.name == "empty")
				continue
			//var prop = tile_properties[t.name] // Unused here
			h1e.draw_sprite(x*GRID_W, y*GRID_H, "tile_"+t.name)
		}
		// Entities
		game.entities.forEach(function(entity){
			if(entity.visual === undefined)
				return
			var visual = entity.visual
			var p = entity.position
			var show = true
			if(entity.__blink && fl(now/100)%2==0)
				show = false
			if(show){
				h1e.draw_sprite(p.x*GRID_W, p.y*GRID_H, "shadow")
				h1e.draw_sprite(p.x*GRID_W+GRID_W/2, p.y*GRID_H-2,
						visual.sprite)
			}
		})

		// UI stuff
		if(game.place_tooltip_sprite){
			var mx = h1e.mousex()
			var my = h1e.mousey()
			h1e.draw_sprite(mx, my-12, game.place_tooltip_sprite)
		}
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
			
			if (my<SCREEN_H/2) return true
			
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
				//var r = GRID_W/2 // One grid tile
				var r = GRID_W*0.7 // A bit larger area
				if(Math.abs(mx - p.x*GRID_W - GRID_W/2) <= r &&
						Math.abs(my - p.y*GRID_H) <= r){
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

