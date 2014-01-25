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