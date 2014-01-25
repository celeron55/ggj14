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

var m = "|mask=#808080"
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

var y0 = 24+32+16
var names = ["icon_absorb", "icon_growth", "icon_life"]
names.forEach(function(name, i){
	h1e.def_sprite(name, "guggenheim"+m, [[8*i,y0,8,8]], [0,0])
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

function pad(n, d, w, z) // number, precision, width, padchar
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

function DieTimerComponent(game, frames){
	this.on_update = function(entity){
		frames--
		if(frames <= 0)
			game.delete_entity(entity)
	}
}

function SpriteVisualComponent(game, sprite){
	this.sprite = sprite
}

function StatVisualComponent(game, statrows){
	this.statrows = statrows // [{icon:"sprite", text:"+1"}, ...]
}

function PositionComponent(game, x, y){
	this.x = x
	this.y = y
}

function GenesComponent(game, current_genes){
	h1e.checkobject(current_genes)
	this.current = current_genes
	this.umodified_age = 0

	this.on_update = function(entity){
		this.unmodified_age++
	}
}

function PlantComponent(game, interval_frames){
	var that = this

	// kannattaa tehdä vähentämällä nollaan, koska voi varioida timeriä
	this.timer = interval_frames
	this.placeable = false

	// Initialisoidaan ensimmäisellä updatella kun entiteetti on täysissä voimissaan
	this.life = undefined // frameja
	this.growth = undefined // kasvunopeus (frameja?)
	this.absorb = undefined // veden imukyky

	this.should_blink = function(entity){
		return this.placeable
	}

	this.on_update = function(entity){
		if(this.life === undefined){
			h1e.checkobject(entity.genes)
			h1e.checkobject(entity.genes.current)
			h1e.checkfinite(entity.genes.current.life)
			this.life = entity.genes.current.life
		}
		if (this.life !== undefined && this.life<=0) {
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
					var tile = game.tiles.get(x, y)
					if(tile === undefined){
						game.message = "Cannot place here"
						return
					}
					h1e.checkobject(tile_properties)
					var prop = tile_properties[tile.name]
					if(prop === undefined){
						game.message = "Cannot place here"
						return
					}
					var current_genes = entity.genes.current
					//console.log("current_genes: "+h1e.dump(current_genes))
					var new_genes = current_genes.clone()
					//console.log("new_genes: "+h1e.dump(new_genes))
					new_genes.mutate(prop.genes)
					var e1 = create_seed_entity(game, x, y, 2*FPS, new_genes)
					game.entities.push(e1)
					that.placeable = false
					// saat laittaa uudelleen jos kasvi elää niin kauan
					// (ilman vesimekaniikkaa ja geenejä, elää aina siihen asti)
					that.timer = 6*FPS
					// Create stat visualization entity
					var d_life = pad((new_genes.life - current_genes.life)/100, 0)
					var d_growth = pad((new_genes.growth - current_genes.growth)*100, 0)
					var d_absorb = pad((new_genes.absorb - current_genes.absorb)*100, 0)
					var statrows = [
						{icon:"icon_life", text:(d_life>0?"+":"")+d_life},
						{icon:"icon_growth", text:(d_growth>0?"+":"")+d_growth},
						{icon:"icon_absorb", text:(d_absorb>0?"+":"")+d_absorb},
					]
					game.entities.push(create_stat_entity(game, x, y, statrows))
				}
			}
		}
	}
}

function SeedComponent(game, interval_frames){
	var that = this

	this.timer = 0

	this.should_blink = function(entity){
		return this.placeable
	}

	this.on_update = function(entity){
		if(this.timer >= 0){
			this.timer++
			if(this.timer == interval_frames-30){
				entity.visual = new SpriteVisualComponent(game, "halfgrown")
			}
			if(this.timer >= interval_frames){
				//this.timer = 0 // Restart timer
				this.timer = -1 // Disable timer
				this.grow(entity)
			}
		}
	}

	this.grow = function(entity){
		entity.visual = new SpriteVisualComponent(game, "flower")
		entity.seed = false
		entity.plant = new PlantComponent(game, 2*FPS)
	}
}

function create_flower_entity(game, x, y, interval_frames, genes){
	h1e.checkobject(genes)
	return {
		visual: new SpriteVisualComponent(game, "flower"),
		position: new PositionComponent(game, x, y),
		plant: new PlantComponent(game, interval_frames),
		genes: new GenesComponent(game, genes),
	}
}

function create_seed_entity(game, x, y, interval_frames, genes){
	h1e.checkobject(genes)
	return {
		visual: new SpriteVisualComponent(game, "seed"),
		position: new PositionComponent(game, x, y),
		seed: new SeedComponent(game, interval_frames),
		genes: new GenesComponent(game, genes),
	}
}

function create_stat_entity(game, x, y, statrows){
	h1e.checkarray(statrows)
	return {
		visual: new StatVisualComponent(game, statrows),
		position: new PositionComponent(game, x, y),
		dietimer: new DieTimerComponent(game, 3*FPS),
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
	var life = 10*FPS + Math.random()*30*FPS
	var growth = Math.random()*2
	var absorb = Math.random()*2
	var genes = new Genes(life, growth, absorb)
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

	this.get_entities_under_mouse = function(mx, my){
		var found_entities = []
		game.entities.some(function(entity){
			var p = entity.position
			if(p === undefined)
				return
			var r = GRID_W*0.7 // A bit larger area
			if(Math.abs(mx - p.x*GRID_W - GRID_W/2) <= r &&
					Math.abs(my - p.y*GRID_H) <= r){
				found_entities.push(entity)
			}
		})
		return found_entities
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
			if(entity.position === undefined)
				return
			var visual = entity.visual
			var p = entity.position
			var show = true
			if(entity.__blink && fl(now/100)%2==0)
				show = false
			if(show){
				if(visual.sprite){
					h1e.draw_sprite(p.x*GRID_W, p.y*GRID_H, "shadow")
					h1e.draw_sprite(p.x*GRID_W+GRID_W/2, p.y*GRID_H-2,
							visual.sprite)
				}
				if(visual.statrows){
					//console.log("statrows: "+h1e.dump(visual.statrows))
					var x0 = p.x*GRID_W
					var y0 = p.y*GRID_H - visual.statrows.length*8 - 10
					/*var x0 = p.x*GRID_W + 20
					var y0 = p.y*GRID_H - visual.statrows.length*8 + 10*/
					//console.log("x0="+x0+", y0="+y0)
					visual.statrows.forEach(function(row, i){
						h1e.draw_sprite(x0, y0 + i*8, row.icon)
						draw_text(h1e, x0+12, y0 + i*8, row.text)
					})
				}
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
		var mx = h1e.mousex()
		var my = h1e.mousey()
		if(game.on_click_anything){
			// Do nothing
		} else {
			// Show information about hovered entity
			var hover_info = undefined
			var hover_entities = game.get_entities_under_mouse(mx, my)
			if(hover_entities.length >= 1){
				var entity = hover_entities[0]
				if(entity.genes !== undefined){
					var genes = entity.genes.current
					hover_info = ""
					hover_info += "life  : "+pad(genes.life/FPS, 1)+" s\n"
					hover_info += "growth: "+pad(genes.growth, 3)+"\n"
					hover_info += "absorb: "+pad(genes.absorb, 3)
				}
			}
			if(hover_info){
				/*var x = 200
				var y = 30*/
				var x = mx+16
				var y = my-16
				h1e.draw_rect(x, y, 80, 8*3, "rgba(0,0,0,0.5)")
				draw_text(h1e, x, y, hover_info)
			}
		}
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
			var hover_entities = game.get_entities_under_mouse(mx, my)
			var done = hover_entities.some(function(entity){
				for(var component_name in entity){
					var c = entity[component_name]
					if(c && c.on_click){
						c.on_click(entity)
						return true
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

