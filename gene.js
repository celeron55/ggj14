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

	// [{name:"",value:0}, ...]
	// Lowest first
	this.get_array = function(){
		var genenames = ["life","growth","absorb"]
		var genevalues = [] // [{name:"",value:0}, ...]
		genenames.forEach(function(name){
			genevalues.push({name:name, value:this[name]})
		}, this)
		genevalues.sort(function(a, b){
			if(a.value < b.value) return -1
			if(a.value > b.value) return 1
			return 0
		})
		return genevalues
	}

	this.mutate = function(other_genes){
		// maaperan mutaatiot ovat kertoimina
		// jos kaksi alinta geeniä on alle tietyn arvon, viimeisin kasvaa tuplanopeudella (jos on kasvaakseen)a
		var genevalues = this.get_array()
		var boost_increase_of = undefined
		if(genevalues[0].value + genevalues[1].value < 15){
			boost_increase_of = genevalues[2].name
		}
		for(var component_name in this){
			if(h1edpi_module.isnumber(this[component_name])){
				var factor = 1
				if(boost_increase_of == component_name){
					if(other_genes[component_name] > 1.0)
						factor = 2
					else
						factor = 0.5
				}
				this[component_name] *= other_genes[component_name]
				// Raise low values a bit faster
				if(this[component_name] < 5 && other_genes[component_name] > 0)
					this[component_name] += 3.0 * (other_genes[component_name] - 1.0)
			}
		}
	}
}
