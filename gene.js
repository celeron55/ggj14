function Genes(life, growth, absorb){
	h1edpi_module.checkfinite(life)
	h1edpi_module.checkfinite(growth)
	h1edpi_module.checkfinite(absorb)
	this.life = life // elinika, TODO: geenien laiffi + veden maara
	this.growth = growth // kasvunopeus
	this.absorb = absorb // veden imukyky

	this.clone = function() {
		return new Genes(this.life, this.growth, this.absorb)
	}

	this.cross = function(other_genes) {
		// jos risteytetaan kasveja keskenaan
		for(var component_name in this){
			if(h1edpi_module.isnumber(this[component_name]))
				this[component_name] = (this[component_name] + other_genes[component_name]) / 2
		}
	}
	
	this.mutate = function(other_genes){
		// maaperan mutaatiot ovat kertoimina
		for(var component_name in this){
			if(h1edpi_module.isnumber(this[component_name]))
				this[component_name] *= other_genes[component_name]
		}
	}
}
