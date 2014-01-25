function Genes(game){
	this.life = 15*FPS // elinika, TODO: geenien laiffi + veden maara
	this.growth = 1	// kasvunopeus
	this.absorb = 1 // veden imukyky
	
	this.cross = function(other_genes) {
		for(var component_name in this){
			this[component_name] = (this[component_name] + other_genes[component_name]) / 2
		}
	}
	
	this.mutate = function(other_genes){
		for(var component_name in this){
			this[component_name] += other_genes[component_name]
		}
	}
}