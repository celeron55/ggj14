function Rain(game) {
	// sataa vetta, siina joku kiva putousanimaatio
	// jokainen absorboi oman imukykynsa verran niin kauan kuin sade-eventti kestaa
	delay(50, rainend)
	
	this.on_update = function(entity) {
		for (var entity in game.entities) {
			if (has_component(entity, "water")) {
				// vetta omistavat voivat luovuttaa toisilleen tietyn maaran kerrallaan
				// hoituu esim. valitsemalla toiminto "water" ja klikkaamalla -> kursori menee kastelukontekstiin
				entity["water"] += entity.growth
			}
		}
	}
}
function rainend() {
	// sade-eventti poistetaan
}

function specialization(entity) {
	// palauttaa erilaisen sprite-id:n riippuen geenien erikoistumisesta
	// kutsutaan initialisoitaessa
	
	// jos kaikki ovat lahella defaulttiarvoa (ei viela jalostettu tarpeeksi), annetaan peruskuva "plant"
	// else
	// jos life on maksimi, annetaan kuva "lifeplant"
	// jos growth on maksimi, annetaan kuva "growthplant"
	// jos absorb on maksimi, annetaan kuva "absorbplant"	
}

function bars(entity) {
	// taman rectin kokoinen palkki asetetaan entityn y-offsettiin 24+2
	var lifelen = (entity.plant.life/entity.genes.current.life) * 24
	life_rect = [entity.position.x, entity.position.y + 24+2, lifelen, 3]
	// y-offset 24+6
	var waterlen = (entity.plant.water/entity.genes.current.water) * 24
	water_rect = [entity.position.x, entity.position.y + 24+6, waterlen, 3]
}