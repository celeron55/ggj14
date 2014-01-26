var tile_properties = {
	red: {
		genes: new Genes(0.9, 1.2, 0.85),
	},
	brown: {
		genes: new Genes(0.95, 0.9, 1.2),
	},
	grey: {
		genes: new Genes(1.2, 0.9, 0.85),
	},
}

function Tile(name){
	this.name = name
}

function Tiles(w, h){
	this.w = w
	this.h = h
	this.tiles = []
	for(var i=0; i<w*h; i++){
		this.tiles.push(new Tile("empty"))
	}
	this.get = function(x, y){
		var i = y*this.w + x
		return this.tiles[i]
	}
	this.set = function(x, y, t){
		var i = y*this.w + x
		return this.tiles[i] = t
	}
}

function generate_ground(tiles, seed){
	for(var y=0; y<tiles.h; y++)
	for(var x=0; x<tiles.w; x++)
	{
		// Empty positions
		if(y < 11)
			continue
		var d = tiles.h - y - 5
		if(x < d*1 - 1)
			continue
		if(x > tiles.w - d*1)
			continue
		// Ground area
		var name = "brown"
		var f = noise_module.noise2d_perlin(x/4, y/4, seed, 3, 0.5)
		if(f < 0.0)
			name = "red"
		var f = noise_module.noise2d_perlin_abs(x/5, y/5, seed+1, 3, 0.5)
		if(f < 0.42)
			name = "grey"
		tiles.set(x, y, new Tile(name));
	}
}
