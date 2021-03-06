define(["Tone/core/Tone", "Tone/effect/Phaser"], function(Tone){

	/**
	 *  named presets for the Phaser
	 *  @const
	 *  @static
	 *  @type {Object}
	 */
	Tone.Phaser.prototype.preset = {
		"testing" : {
			"rate" : 10,
			"depth" : 0.2,
			"Q" : 2,
			"baseFrequency" : 700,
		},
		"landing" : {
			"rate" : 4,
			"depth" : 1.2,
			"Q" : 20,
			"baseFrequency" : 800,
		},
		"bubbles" : {
			"rate" : 0.5,
			"depth" : 5,
			"Q" : 8,
			"baseFrequency" : 250,
		}
	};

	return Tone.Phaser.prototype.preset;
});