function Genes(life, growth, absorb){
	h1e.checkfinite(life)
	h1e.checkfinite(growth)
	h1e.checkfinite(absorb)
	this.life = life // elinika, TODO: geenien laiffi + veden maara
	this.growth = growth // kasvunopeus
	this.absorb = absorb // veden imukyky
	
	this.cross = function(other_genes) {
		// jos risteytetaan kasveja keskenaan
		for(var component_name in this){
			this[component_name] = (this[component_name] + other_genes[component_name]) / 2
		}
	}
	
	this.mutate = function(other_genes){
		// maaperan mutaatiot ovat kertoimina
		for(var component_name in this){
			this[component_name] *= other_genes[component_name]
		}
	}
}
