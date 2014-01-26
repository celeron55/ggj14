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
var SPEED_FACTOR = FPS // Will be set by menu to below values
var SUPERFAST_SPEED_FACTOR = FPS/3
var FAST_SPEED_FACTOR = FPS
var SLOW_SPEED_FACTOR = FPS*3

h1e.bgstyle = "#000000"
h1e.init($("#main_canvas")[0], SCREEN_W, SCREEN_H, FPS)

h1e.add_image("background", "background.png")
h1e.add_image("sprites", "sprites.png")
h1e.add_image("font", "font.png")
h1e.add_image("guggenheim", "guggenheim2.png")
h1e.add_image("special", "special.png")
h1e.add_image("cloud", "cloud...OFDOOM.png")

var m = "|mask=#808080"
h1e.def_sprite("background", "background"+m, [[0,0,480,360]])
h1e.def_sprite("shadow", "special", [[0,0,24,24]])
h1e.def_sprite("cloud", "cloud"+m, [[0,0,72,36]])

var y0 = 0
var names = ["flower","tree1","tree2","seed","halfgrown","vine","blueflower",
		"whiteflower","noobbush","blueflower_s","whiteflower_s","noobbush_s","flower_s","raindrop1","raindrop2","raindrop3"]
names.forEach(function(name, i){
	h1e.def_sprite(name, "guggenheim"+m, [[24*i,y0,24,24]], [12,12])
})

/*var y0 = 24
var names = ["branch_l", "branch_r"]
names.forEach(function(name, i){
	h1e.def_sprite(name, "guggenheim"+m, [[32*i,y0,32,32]], [0,0])
})*/

var y0 = 24+32
var names = ["tile_brown", "tile_red", "tile_grey"]
names.forEach(function(name, i){
	h1e.def_sprite(name, "guggenheim"+m, [[16*i,y0,16,16]], [0,0])
})

var y0 = 24+32+16
var names = ["icon_absorb", "icon_growth", "icon_life", "icon_seed",
		"icon_plus1", "icon_minus1", "icon_check", "icon_spawn"]
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

function create_gene_statrows(current_genes, new_genes){
	var s_life = formatdiff(new_genes.life - current_genes.life, 0)
	s_life += " = "+pad(new_genes.life, 0, 2)
	var s_growth = formatdiff(new_genes.growth - current_genes.growth, 0)
	s_growth += " = "+pad(new_genes.growth, 0, 2)
	var s_absorb = formatdiff(new_genes.absorb - current_genes.absorb, 0)
	s_absorb += " = "+pad(new_genes.absorb, 0, 2)
	var statrows = [
		{icon:"icon_life", text:s_life},
		{icon:"icon_growth", text:s_growth},
		{icon:"icon_absorb", text:s_absorb},
	]
	return statrows
}

function create_unchanged_gene_statrows(current_genes){
	var s_life = pad(current_genes.life, 0, 2)
	var s_growth = pad(current_genes.growth, 0, 2)
	var s_absorb = pad(current_genes.absorb, 0, 2)
	var statrows = [
		{icon:"icon_life", text:s_life},
		{icon:"icon_growth", text:s_growth},
		{icon:"icon_absorb", text:s_absorb},
	]
	return statrows
}

function DieTimerComponent(game, frames){
	this.on_update = function(entity){
		frames--
		if(frames <= 0)
			game.delete_entity(entity)
	}
}

function SpriteVisualComponent(game, sprite, have_shadow){
	this.sprite = sprite
	this.disable_shadow = have_shadow ? undefined : true
	this.get_sprite = function(entity){
		return this.sprite
	}
}

function StatVisualComponent(game, statrows){
	this.statrows = statrows // [{icon:"sprite", text:"+1"}, ...]
}

function AreaVisualComponent(game, r){
	this.tile_area_r = r
}

function get_gene_d(genes){
	var genevalues = genes.get_array()
	var min = undefined
	var max = undefined
	genevalues.forEach(function(gene){
		if(min === undefined || gene.value < min)
			min = gene.value
		if(max === undefined || gene.value > max)
			max = gene.value
	})
	return (max - min)
}
function get_best_gene(genes){
	var genevalues = genes.get_array()
	return genevalues[genevalues.length-1].name
}
function is_flat_genes(genes) {
	var d = get_gene_d(genes)
	return (d < 6)
}

function GeneVisualComponent(game){
	this.get_sprite = function(entity){
		var genes = entity.genes.current
		if(genes === undefined)
			return "icon_growth" // Failure
		
		if (is_flat_genes(genes))
			return "noobbush"

		var best_gene = get_best_gene(genes)
		if(best_gene == "absorb")
			return "blueflower"
		if(best_gene == "life")
			return "whiteflower"
		return "flower"
	}
}

function PositionComponent(game, x, y){
	this.x = x
	this.y = y
}

function DropletComponent(game){
	this.on_update = function(entity){
		var p = entity.position
		if(p.y > 160/GRID_H){
			game.delete_entity(entity)
			return
		}
		p.x -= 0.2
		p.y += 0.4
	}
}

function GenesComponent(game, current_genes){
	h1e.checkobject(current_genes)
	this.current = current_genes
	this.umodified_age = 0

	this.on_update = function(entity){
		this.unmodified_age++
	}
}

function place_seed(game, x, y, current_genes, plantc, crossgenes){
	var e2 = game.get_entity_at(x, y)
	if(e2){
		game.message = "Entity in the way"
		return false
	}
	var tile = game.tiles.get(x, y)
	if(tile === undefined){
		game.message = "Cannot place here"
		return false
	}
	h1e.checkobject(tile_properties)
	var prop = tile_properties[tile.name]
	if(prop === undefined){
		game.message = "Cannot place here"
		return false
	}
	//console.log("current_genes: "+h1e.dump(current_genes))
	var new_genes = current_genes.clone()
	console.log("Origin genes: "+h1e.dump(new_genes.get_array()))
	//console.log("new_genes: "+h1e.dump(new_genes))
	if(crossgenes){
		console.log("Crossing with:"+h1e.dump(crossgenes.get_array()))
		new_genes.cross(crossgenes)
	}
	new_genes.mutate(prop.genes)
	console.log("Result genes: "+h1e.dump(new_genes.get_array()))
	var e1 = create_seed_entity(game, x, y, 4*SPEED_FACTOR, new_genes)
	add_game_entity(game, e1)
	plantc.placeable = false
	// saat laittaa uudelleen jos kasvi elää niin kauan
	// (ilman vesimekaniikkaa ja geenejä, elää aina siihen asti)
	plantc.timer = 6*SPEED_FACTOR
	plantc.absorbed_amount -= 1
	// Create stat visualization entity
	var statrows = create_gene_statrows(current_genes, new_genes)
	var e = create_stat_entity(game, x, y, statrows)
	e.statvisual_owned_by = e1
	add_game_entity(game, e)
	$("#seed")[0].play()
	return true
}

function PlantComponent(game, interval_frames){
	var that = this

	// kannattaa tehdä vähentämällä nollaan, koska voi varioida timeriä
	this.timer = interval_frames
	this.placeable = false

	// Initialisoidaan ensimmäisellä updatella kun entiteetti on täysissä voimissaan
	this.life = undefined // frameja jäljellä kullakin hetkellä
	this.growth_r = undefined // kasvualue (tilejä) (ei muutu)
	this.absorbed_amount = undefined

	this.should_blink = function(entity){
		return (this.life < SPEED_FACTOR*2)
	}
	this.should_hilight = function(entity){
		return this.placeable
	}

	this.on_update = function(entity){
		if(this.life === undefined){
			h1e.checkobject(entity.genes)
			h1e.checkobject(entity.genes.current)
			h1e.checkfinite(entity.genes.current.life)
			// Life
			var GENE_TO_FRAMES = 8 * SPEED_FACTOR
			var random0 = 0.9 + Math.random()*0.2
			this.life = entity.genes.current.life * GENE_TO_FRAMES * random0
			// Growth
			var GROWTH_TO_R = 0.18
			this.growth_r = entity.genes.current.growth * GROWTH_TO_R
			var min_r = 1.1
			if(this.growth_r < min_r)
				this.growth_r = min_r
			// Absorbtion
			//this.absorbed_amount = entity.genes.current.absorb
			this.absorbed_amount = 1
		}
		if (this.life !== undefined && this.life<=0) {
			game.delete_entity(entity)
			$("#pop")[0].play()
			return
		}
		this.life--

		if(this.timer > 0 && this.absorbed_amount >= 1){
			this.timer--
			if(this.timer == 0){
				//this.timer = 0 // Restart timer
				this.timer = -1 // Disable timer
				this.placeable = true
			}
		}
	}
	this.on_click = function(entity){
		if(this.placeable){
			game.message = "Place seed on ground or select plant to crossbreed"
			var can_place_water = (entity.visual &&
					entity.visual.get_sprite(entity) == "blueflower")
			if(can_place_water)
				game.place_tooltip_sprite = "icon_absorb"
			else
				game.place_tooltip_sprite = "seed"
			var p = entity.position
			var r = this.growth_r
			var area_visual = {
				visual: new AreaVisualComponent(game, r),
				position: new PositionComponent(game, p.x, p.y),
			}
			add_game_entity(game, area_visual)
			/*for(var y=0; y<TILES_H; y++)
			for(var x=0; x<TILES_W; x++)
			{
				var d = pos_distance(x, y, p.x, p.y)
				if(d > r)
					continue
				var e2 = game.get_entity_at(x, y)
				if(e2.plant){
					// Show something special?
				}
			}*/

			game.on_click_anything = function(mx, my){
				game.delete_entity(area_visual)
				game.message = undefined
				game.place_tooltip_sprite = undefined
				var x = rn((mx-GRID_W/2)/GRID_W)
				var y = rn((my-GRID_H/2)/GRID_H)
				var d = pos_distance(x, y, p.x, p.y)
				if(d > that.growth_r){
					game.message = "Out of range of this plant"
					return
				}
				var e2 = game.get_entity_at(x, y)
				if(e2 == entity){
					game.message = "Cannot place on same entity"
					return
				}
				if(!e2){
					// Place seed normally
					h1e.checkobject(entity.genes)
					if(place_seed(game, x, y, entity.genes.current, that))
						game.message = "Placed normal seed on ground"
					return
				}
				if(can_place_water && e2.plant && e2.genes &&
						e2.genes.current.absorb > e2.plant.absorbed_amount){
					if(entity.plant.absorbed_amount < 1){
						game.message = "Not enough water"
						return
					}
					e2.plant.absorbed_amount += 1
					entity.plant.absorbed_amount -= 1
					game.message = "Gave water to plant"
					var p2 = e2.position
					var p1 = entity.position
					add_game_entity(game, create_timed_sprite_entity(
							game, p2.x-0.2, p2.y, "icon_plus1", 2*FPS))
					add_game_entity(game, create_timed_sprite_entity(
							game, p1.x-0.2, p1.y, "icon_minus1", 2*FPS))
					return
				}
				if(!e2.plant){
					game.message = "Cannot place on existing entity"
					return
				}
				game.message = "Place cross-bred seed on ground"
				// Do the same thing as before
				game.place_tooltip_sprite = "seed"
				var area_visual2 = {
					visual: new AreaVisualComponent(game, r),
					position: new PositionComponent(game, p.x, p.y),
				}
				add_game_entity(game, area_visual2)
				game.on_click_anything = function(mx, my){
					game.delete_entity(area_visual2)
					var x = rn((mx-GRID_W/2)/GRID_W)
					var y = rn((my-GRID_H/2)/GRID_H)
					game.message = undefined
					game.place_tooltip_sprite = undefined
					h1e.checkobject(entity.genes)
					h1e.checkobject(e2.genes)
					var current_genes = entity.genes.current
					var cross_genes = e2.genes.current
					if(place_seed(game, x, y, current_genes, that, cross_genes))
						game.message = "Placed cross-bred seed on ground"
				}
			}
		}
	}
	this.on_shift_click = function(entity){
		var cloud_watch = undefined // Find this component of some entity
		game.entities.some(function(e1){
			if(e1.cloud_watch){
				cloud_watch = e1.cloud_watch
				return true
			}
		})
		h1e.checkobject(cloud_watch)
		h1e.checkobject(cloud_watch.clouds)
		var clouds = cloud_watch.clouds
		console.log("Attempting to harvest plant")
		console.log("entity.visual.get_sprite(entity)="+
				h1e.dump(entity.visual.get_sprite(entity)))
		console.log("clouds[0].cloud.type="+h1e.dump(clouds[0].cloud.type))
		// tarkista mätsääkö harvesti vasemmanpuoleisimpaan pilveen
		if (entity.visual !== undefined &&
				entity.visual.get_sprite(entity) == clouds[0].cloud.type) {
			game.delete_entity(clouds[0])
			game.delete_entity(entity)
			//cloud_watch.clouds[0].cloud.please()
			
			var e = {
				visual: new RainVisualComponent(game),
				dietimer: new DieTimerComponent(game, 7*FPS),
				rain: new RainComponent(game),
			}
			add_game_entity(game, e)
			
			cloud_watch.clouds.splice(0,1)
		}
		if (cloud_watch.clouds.length==0) {
			// jos kaikki pilvet on mätsätty, arvo uudet
			cloud_watch.spawn_clouds()
		}
	}
}

function SeedComponent(game, interval_frames){
	var that = this

	this.timer = 0

	this.on_update = function(entity){
		if(this.timer >= 0){
			this.timer++
			if(this.timer == fl(interval_frames/2)){
				entity.visual = new SpriteVisualComponent(game, "halfgrown")
			}
			if(this.timer == interval_frames-20) {
				$("#grow")[0].play()
			}
			if(this.timer >= interval_frames){
				//this.timer = 0 // Restart timer
				this.timer = -1 // Disable timer
				this.grow(entity)
			}
		}
	}

	this.grow = function(entity){
		entity.visual = new GeneVisualComponent(game)
		entity.seed = undefined
		entity.plant = new PlantComponent(game, 4*SPEED_FACTOR)
	}
}

function ScrollComponent() {
	this.on_update = function(entity){
		entity.position.x -= 1 / SPEED_FACTOR
	}
}

function CloudWatch(game) {
	this.clouds = []
	this.spawnrate = 0
	
	this.spawn_clouds = function() {
		this.spawnrate++
		for (var cl in this.clouds) {
			game.delete_entity(cl)
		}
		this.clouds = []
		for (var i=0; i<this.spawnrate; i++) {
			var cl = create_cloud_entity(game,TILES_W+i*3,3,this)
			this.clouds.push(cl)
			add_game_entity(game, cl)
		}
	}
	
	this.spawn_clouds()
}

function cause_disaster(game) {
	game.screen_shake_timer = 1*FPS
	var y0 = 10
	var x = fl(Math.random()*TILES_W)
	var y = fl(Math.random()*(TILES_H-y0))+y0
	var ps = [
		{x:x, y:y},
		{x:x-1, y:y},
		{x:x+1, y:y},
		{x:x, y:y-1},
		{x:x, y:y+1},
	]
	ps.forEach(function(p){
		game.tiles.set(p.x, p.y, new Tile("empty"))
		var e = game.get_entity_at(p.x, p.y)
		if(e)
			game.delete_entity(e)
	})
}

function CloudComponent(game, type, host) {
	this.type = type
	this.pleased = false
	this.host = host

	this.on_update = function(entity){
		if (entity.position.x < 0) {
			game.delete_entity(entity)
			cause_disaster(game)
			$("#clang")[0].play()
			this.host.spawn_clouds()
			console.log(this.host.clouds.length)
			return
		}
	}
	
	this.please = function() {
		this.pleased = true
	}
	/*this.on_harvest = function(entity) {
		// ei voi harvestoida jos ei ole vuorossa symbolijonossa
		if (this.pleased || game.cloudturn!==this) return
		
		if (entity.visual !== undefined && entity.visual.get_sprite() == this.type) {
			this.pleased = true
			// lisää checkmarkki scrollcomponentilla tälle pilvelle
		}
	}*/
}

function create_cloud_entity(game, x, y, host){
	type = ["flower","blueflower","whiteflower","noobbush"][fl(Math.random()*4)]
	return {
		position: new PositionComponent(game, x, y),
		scroll: new ScrollComponent(),
		cloud: new CloudComponent(game, type, host),
		visual: new CloudSpriteVisualComponent(game, type),
	}
}

function CloudSpriteVisualComponent(game, sprite){
	this.sprite = sprite
	/*this.get_sprite = function(entity){
		return this.sprite
	}*/
	this.on_draw = function(entity){
		var p = entity.position
		if(!p)
			return
		h1e.draw_sprite(p.x*GRID_W+GRID_W/2, p.y*GRID_H-2, "cloud")
		h1e.draw_sprite(p.x*GRID_W+GRID_W/2+35, p.y*GRID_H-2+15, sprite)
	}
}


function RainVisualComponent(game){
	this.on_draw = function(entity){
		h1e.draw_rect(0, 0, SCREEN_W, 160, "rgba(0,60,200,0.5)")
	}
}

function RainComponent(game){
	var triggered = false

	this.on_update = function(entity){
		if(triggered){
			for(var i=0; i<5; i++){
				game.entities.push(create_droplet(game))
			}
			return
		}
		
		$("#rain")[0].play()
		triggered = true // Do only once
		game.entities.forEach(function(entity){
			var plant = entity.plant
			if(plant === undefined)
				return
			if(entity.genes === undefined)
				return
			var genes = entity.genes.current
			h1e.checkobject(genes)
			if(get_best_gene(genes) !== "absorb" || is_flat_genes(genes))
				return
			plant.absorbed_amount = fl(genes.absorb)
		})
		// Give N amount of water
		/*for(var i=0; i<1; i++)*/
		// Give one water for each plant
		{
			// Go through absorbing plants
			game.entities.some(function(e1){
				if(!e1.genes || !e1.plant || !e1.position)
					return false // next
				if(get_best_gene(e1.genes.current) !== "absorb" ||
						is_flat_genes(e1.genes.current))
					return false // next (is not a water plant)
				// Don't give all water away
				if(e1.plant.absorbed_amount <= 1)
					return false // next
				var p1 = e1.position
				// Go through all entities to give water to nearby plants
				game.entities.some(function(e2){
					// Don't give all water away
					if(e1.plant.absorbed_amount <= 1)
						return true // break
					if(!e2.genes || !e2.plant || !e2.position)
						return false // next
					if(get_best_gene(e2.genes.current) === "absorb" &&
							!is_flat_genes(e2.genes.current))
						return false // next (is water plant)
					if(e2.plant.absorbed_amount >= e2.genes.absorb)
						return false // next
					// Give only if plant doesn't have any water
					if(e2.plant.absorbed_amount >= 1)
						return false // next
					var p2 = e2.position
					if(pos_distance(p1.x, p1.y, p2.x, p2.y) >=
							e1.plant.growth_r)
						return false // next
					e2.plant.absorbed_amount += 1
					e1.plant.absorbed_amount -= 1
					add_game_entity(game, create_timed_sprite_entity(
							game, p2.x-0.2, p2.y, "icon_plus1", 2*FPS))
					//add_game_entity(game, create_timed_sprite_entity(
					//		game, p1.x-0.2, p1.y, "icon_minus1", 2*FPS))
					add_game_entity(game, create_timed_sprite_entity(
							game, p1.x-0.2, p1.y, "icon_absorb", 2*FPS))
				})
			})
		}
	}
}

function GlobalEffectStarterComponent(game){
	var that = this

	this.timer = SPEED_FACTOR*1
	this.rain_interval = SPEED_FACTOR*15
	this.rained_once = false

	this.on_update = function(entity){
		if(this.timer >= 0){
			this.timer--
			return
		}
		if(this.rained_once)
			return
		this.rained_once = true
		// Commented out because rain starts only once automatically
		//this.timer = this.rain_interval
		this.rain_interval += SPEED_FACTOR*1.5 // Rain gets rarer
		var e = {
			visual: new RainVisualComponent(game),
			dietimer: new DieTimerComponent(game, 7*FPS),
			rain: new RainComponent(game),
		}
		add_game_entity(game, e)
	}
	this.on_draw = function(entity){
	}
}

function create_flower_entity(game, x, y, interval_frames, genes){
	h1e.checkobject(genes)
	return {
		visual: new GeneVisualComponent(game),
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

function create_timed_sprite_entity(game, x, y, sprite, frames){
	h1e.checkfinite(x)
	h1e.checkfinite(y)
	h1e.checkstring(sprite)
	h1e.checkfinite(frames)
	return {
		visual: new SpriteVisualComponent(game, sprite, false),
		position: new PositionComponent(game, x, y),
		dietimer: new DieTimerComponent(game, frames),
	}
}

function create_droplet(game){
	var x = Math.random()*SCREEN_W/GRID_W*1.3
	var y = 0
	var img = ["raindrop1","raindrop2","raindrop3"][fl(Math.random()*3)]
	return {
		visual: new SpriteVisualComponent(game, img),
		position: new PositionComponent(game, x, y),
		droplet: new DropletComponent(game),
	}
}

function Game(){
	var that = this
	var game = this
	console.log("Game created; speed factor is "+SPEED_FACTOR)

	// Game-wide publicly settable callbacks and stuff
	this.on_click_anything = undefined // Cleared before calling
	this.place_tooltip_sprite = undefined
	this.message = undefined

	// Entities or whatever
	this.entities = []
	// Create initial entity
	var life = 10
	var growth = 10
	var absorb = 10
	var genes = new Genes(life, growth, absorb)
	this.entities.push(create_flower_entity(game, 15, 15, 1*SPEED_FACTOR, genes))

	// Test with water plant
	var genes = new Genes(life, growth, 20)
	this.entities.push(create_flower_entity(game, 16, 15, 1*SPEED_FACTOR, genes))
	// Test with life plant
	var genes = new Genes(20, growth, absorb)
	this.entities.push(create_flower_entity(game, 17, 15, 1*SPEED_FACTOR, genes))
	// Test with growth plant
	var genes = new Genes(life, 20, absorb)
	this.entities.push(create_flower_entity(game, 18, 15, 1*SPEED_FACTOR, genes))

	// Clouds
	//this.entities.push(create_cloud_entity(game, TILES_W-3, 2))
	this.entities.push({
		cloud_watch: new CloudWatch(this)
	})
	
	// Global effect handler
	this.entities.push({
		global_effect_starter: new GlobalEffectStarterComponent(this)
	})

	// Other resources
	this.tiles = new Tiles(TILES_W, TILES_H)
	generate_ground(this.tiles, Date.now())

	// End condition variables and whatever
	this.screen_shake_timer = 0 // 1*FPS

	// Called every frame
	this.update = function(){
		this.screen_shake_timer--
		this.entities.forEach(function(entity){
			entity.__blink = undefined // Recalculate
			entity.__hilight = undefined // Recalculate
			for(var component_name in entity){
				var c = entity[component_name]
				if(c && c.on_update !== undefined){
					c.on_update(entity)
				}
				if(c && c.should_blink !== undefined){
					if(c.should_blink())
						entity.__blink = true
				}
				if(c && c.should_hilight !== undefined){
					if(c.should_hilight())
						entity.__hilight = true
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
			if(p && p.x == x && p.y == y){
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
			/*var r = GRID_W*0.7 // A bit larger area
			if(Math.abs(mx - p.x*GRID_W - GRID_W/2) <= r &&
					Math.abs(my - p.y*GRID_H - 4) <= r){
				found_entities.push(entity)
			}*/
			var r = GRID_W*0.5 // A bit larger area
			if(Math.abs(mx - p.x*GRID_W - GRID_W/2) <= r &&
					Math.abs(my - p.y*GRID_H - GRID_H/2) <= r){
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

function formatdiff(v, precision){
	var dn = Math.pow(10, precision||0)
	v = Math.round(v*dn)/dn
	if(v == 0)
		return " "+v
	if(v < 0)
		return "-"+Math.abs(v)
	if(v > 0)
		return "+"+v
}

function draw_statrows(x0, y0, statrows, rect_w){
	var nrows = statrows.length
	y0 -= nrows*8 + 10
	if(rect_w === undefined)
		rect_w = 54
	//console.log("statrows: "+h1e.dump(statrows))
	/*var x0 = p.x*GRID_W + 20
	var y0 = p.y*GRID_H - statrows.length*8 + 10*/
	//console.log("x0="+x0+", y0="+y0)
	h1e.draw_rect(x0, y0, rect_w, 8*nrows, "rgba(0,0,0,0.5)")
	statrows.forEach(function(row, i){
		if(row.icon !== undefined)
			h1e.draw_sprite(x0, y0 + i*8, row.icon)
		draw_text(h1e, x0+16, y0 + i*8, row.text)
	})
}

function pos_distance(x0, y0, x1, y1){
	var dx = x1 - x0
	var dy = y1 - y0
	return Math.sqrt(dx*dx + dy*dy)
}

function GameSection(game){
	var that = this
	game = game ? game : new Game()

	this.draw = function(h1e){
		var now = Date.now() // Time in ms (for blinking and whatever)

		var sx = 0
		var sy = 0
		if(game.screen_shake_timer > 0){
			sx += (Math.random()-0.5)*10
			sy += (Math.random()-0.5)*10
		}

		// Background
		h1e.draw_sprite(0+sx, 0+sy, "background")
		var green_y = 160
		h1e.draw_rect(sx+0, sy+green_y, 480, 320-green_y, "#335522")

		// Tiles
		for(var y=0; y<TILES_H; y++)
		for(var x=0; x<TILES_W; x++)
		{
			var t = game.tiles.get(x, y)
			if(t.name == "empty")
				continue
			//var prop = tile_properties[t.name] // Unused here
			h1e.draw_sprite(sx+x*GRID_W, sy+y*GRID_H, "tile_"+t.name)
		}

		// Entities
		game.entities.forEach(function(entity){
			var visual = entity.visual
			var p = entity.position
			if(visual === undefined)
				return
			// Special visuals
			if(visual.on_draw){
				visual.on_draw(entity)
				return
			}
			// Basic visuals
			var show = true
			if(entity.__blink && fl(now/100)%2==0)
				show = false
			if(!show)
				return
			// Hilight
			if(entity.__hilight){
				var hilight = entity.__hilight
				if(hilight){
					h1e.draw_rect(p.x*GRID_W, p.y*GRID_H, 16, 16,
							"rgba(255,255,255,0.5)")
				}
			}
			// Sprite
			if(visual.sprite || visual.get_sprite){
				var sprite = visual.sprite
				if(visual.get_sprite)
					sprite = visual.get_sprite(entity)
				if(sprite && p !== undefined){
					if(!visual.disable_shadow)
						h1e.draw_sprite(p.x*GRID_W, p.y*GRID_H, "shadow")
					h1e.draw_sprite(p.x*GRID_W+GRID_W/2+sx, p.y*GRID_H-2+sy, sprite)
				}
			}
			// Stat rows
			if(visual.statrows && p !== undefined){
				var x0 = p.x*GRID_W
				var y0 = p.y*GRID_H
				draw_statrows(x0, y0, visual.statrows)
			}
			// Tile area
			if(visual.tile_area_r !== undefined && p !== undefined){
				if(visual.tile_area_r < 1.0){
					h1e.draw_rect(p.x*GRID_W, p.y*GRID_H, 16, 16,
							"rgba(70,200,50,0.3)")
				} else {
					for(var y=0; y<TILES_H; y++)
					for(var x=0; x<TILES_W; x++)
					{
						var d = pos_distance(x, y, p.x, p.y)
						if(d > visual.tile_area_r)
							continue
						h1e.draw_rect(x*GRID_W, y*GRID_H, 16, 16,
								"rgba(70,200,50,0.3)")
					}
				}
			}
		})

		// UI stuff
		if(game.place_tooltip_sprite){
			var mx = h1e.mousex()
			var my = h1e.mousey()
			h1e.draw_sprite(mx, my-12, game.place_tooltip_sprite)
		}
		if(game.message)
			draw_text(h1e, 0, 0, game.message)

		// Visualize what is selected
		var mx = h1e.mousex()
		var my = h1e.mousey()
		if(game.on_click_anything){
			// Do nothing
		} else {
			// Show information about hovered entity
			var hover_entities = game.get_entities_under_mouse(mx, my)
			if(hover_entities.length >= 1){
				var entity = hover_entities[0]
				// But not if there is some hover entity owned by it
				var found = game.entities.some(function(entity2){
					if(entity2.statvisual_owned_by == entity)
						return true
				})
				if(entity.genes !== undefined && !found){
					var genes = entity.genes.current
					var statrows = create_unchanged_gene_statrows(genes)
					if(entity.plant){
						var a = ""+entity.plant.absorbed_amount
						//statrows.push({text: "absorbed: "+pad(a, 2)})
						statrows.push({icon:"icon_spawn", text:a})
					}
					var x = mx+16
					var y = my+16
					draw_statrows(x, y, statrows, 35)
				}
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
			if(!h1e.mouse.buttons["left"])
				return false // Ignore
			var mx = h1e.mousex()
			var my = h1e.mousey()

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
					if(h1e.keydown(["shift"])){
						if(c && c.on_shift_click){
							c.on_shift_click(entity)
							return true
						}
					} else {
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

function StartSection(){

	this.draw = function(h1e){
		// Background
		h1e.draw_sprite(0, 0, "background")
		//var green_y = 160
		//h1e.draw_rect(0, green_y, 480, 320-green_y, "#335522")

		// Stuff
		var x0 = SCREEN_W/2
		var y0 = SCREEN_H/2
		h1e.draw_rect(x0-100, y0-50, 200, 100, "rgba(50,0,0,0.5)")
		draw_text(h1e, x0-60, y0-35, "Venerable Life Complex")
		draw_text(h1e, x0-70, y0-20, "BY JIGGAWATT AND CELERON55")
		draw_text(h1e, x0-50, y0+10, "1: SLOW")
		draw_text(h1e, x0+5, y0+10, "2: FAST")
		draw_text(h1e, x0-70, y0+25, "Press number to start game.")
	}
	this.event = function(h1e, event){
		if(event.type == "keydown"){
			if(h1e.iskey(event.key, ["1"])){
				SPEED_FACTOR = SLOW_SPEED_FACTOR
				h1e.push_section(new GameSection())
				return true
			}
			if(h1e.iskey(event.key, ["2"])){
				SPEED_FACTOR = FAST_SPEED_FACTOR
				h1e.push_section(new GameSection())
				return true
			}
			if(h1e.iskey(event.key, ["3"])){
				SPEED_FACTOR = SUPERFAST_SPEED_FACTOR
				h1e.push_section(new GameSection())
				return true
			}
		}
	}
	this.update = function(h1e){
		// Return true if something changed (will be redrawn)
		return false
		//return game.update()
	}
}

//h1e.push_section(new GameSection())
h1e.push_section(new StartSection())

function pad_stuff(){
	h1e.resize_canvas($(window).width() - 5, $(window).height() - 5)
}

function match_depth(game, entity) {
	// etsi sellainen other joka on entityn edessä
	// jos ei löydy, -1 -> entity työnnetään eteen
	for (var other in game.entities) {
		if (other["position"]===undefined) {
			continue
		}
		
		if (other["position"].y >= entity["position"].y) {
			return game.entities.indexOf(other)
		}
	}
	return -1
}

function add_game_entity(game, entity) {
	// pistä entiteetit toistensa taakse
	// TODO: eipä toimi tietenkään
	// (feilaa match_depthissa, other["position"] on aina undefined..?)
	if (entity["position"]===undefined) {
		game.entities.push(entity)
		return
	}
	
	var i = match_depth(game, entity)
	if (i == -1) {
		game.entities.push(entity)
		return
	}
	
	game.entities.splice(i,0,entity)
}

$(document).ready(function(){
	pad_stuff()
	$(window).resize(function(){
		pad_stuff()
	})
	//$("#some_audio")[0].volume = 0.7
	h1e.start()
	$("#bgm")[0].loop = true
	$('#bgm')[0].play()
})

