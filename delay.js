function Delay(del, callback) {
	this.delay = del
	this.type = "delay"
	this.update = function() {
		if (this.delay==0) {
			callback()
			return
		}
		this.delay--
	}
}