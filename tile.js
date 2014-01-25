var tile_properties = {
	red: {
		new Genes(0.8, 1.2, 0.8)
	},
	brown: {
		new Genes(0.8, 0.8, 1.2)
	},
	grey: {
		new Genes(1.2, 0.8, 0.8)
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
function generate_ground(tiles){
	for(var y=0; y<tiles.h; y++)
	for(var x=0; x<tiles.w; x++)
	{
		// Empty positions
		if(y < 11)
			continue
		var d = tiles.h - y
		if(x < d*0.5 - 1)
			continue
		if(x > tiles.w - d*0.5)
			continue
		// Ground area
		tiles.set(x, y, new Tile("brown"));
	}
}
