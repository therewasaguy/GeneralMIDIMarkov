define(["Tone/core/Tone", "Tone/source/Source", "Tone/source/PulseOscillator", "Tone/source/Oscillator"], 
function(Tone){

	"use strict";

	/**
	 *  @class takes an array of Oscillator descriptions and mixes them together
	 *         with the same detune and frequency controls. 
	 *
	 *  @extends {Tone.Oscillator}
	 *  @constructor
	 *  @param {frequency} frequency frequency of the oscillator (meaningless for noise types)
	 *  @param {string} type the type of the oscillator
	 */
	Tone.PWMOscillator = function(){
		var options = this.optionsObject(arguments, ["frequency", "modulationFrequency"], Tone.PWMOscillator.defaults);
		Tone.Source.call(this, options);

		/**
		 *  the pulse oscillator
		 */
		this._pulse = new Tone.PulseOscillator(options.modulationFrequency);
		//change the pulse oscillator type
		this._pulse._sawtooth.type = "sine";

		/**
		 *  the modulator
		 */
		this._modulator = new Tone.Oscillator({
			"frequency" : options.frequency,
			"detune" : options.detune
		});

		/**
		 *  the frequency control
		 *  @type {Tone.Signal}
		 */
		this.frequency = this._modulator.frequency;

		/**
		 *  the detune control
		 *  @type {Tone.Signal}
		 */
		this.detune = this._modulator.detune;

		/**
		 *  the modulation rate of the oscillator
		 *  @type {Tone.Signal}
		 */
		this.modulationFrequency = this._pulse.frequency;	

		//connections
		this._modulator.connect(this._pulse.width);
		this._pulse.connect(this.output);
	};

	Tone.extend(Tone.PWMOscillator, Tone.Oscillator);

	/**
	 *  default values
	 *  @static
	 *  @type {Object}
	 *  @const
	 */
	Tone.PWMOscillator.defaults = {
		"frequency" : 440,
		"detune" : 0,
		"modulationFrequency" : 0.4,
	};

	/**
	 *  start the oscillator
	 *  @param  {Tone.Time} [time=now]
	 *  @private
	 */
	Tone.PWMOscillator.prototype._start = function(time){
		time = this.toSeconds(time);
		this._modulator.start(time);
		this._pulse.start(time);
	};

	/**
	 *  stop the oscillator
	 *  @param  {Tone.Time} time (optional) timing parameter
	 *  @private
	 */
	Tone.PWMOscillator.prototype._stop = function(time){
		time = this.toSeconds(time);
		this._modulator.stop(time);
		this._pulse.stop(time);
	};

	/**
	 * The type of the oscillator.
	 *  
	 * @memberOf Tone.PWMOscillator#
	 * @type {string}
	 * @name type
	 */
	Object.defineProperty(Tone.PWMOscillator.prototype, "type", {
		get : function(){
			return "pwm";
		}
	});

	/**
	 * the phase of the oscillator in degrees
	 * @memberOf Tone.PWMOscillator#
	 * @type {number}
	 * @name phase
	 */
	Object.defineProperty(Tone.PWMOscillator.prototype, "phase", {
		get : function(){
			return this._modulator.phase;
		}, 
		set : function(phase){
			this._modulator.phase = phase;
		}
	});

	/**
	 *  clean up
	 *  @return {Tone.PWMOscillator} `this`
	 */
	Tone.PWMOscillator.prototype.dispose = function(){
		Tone.Source.prototype.dispose.call(this);
		this._pulse.dispose();
		this._pulse = null;
		this._modulator.dispose();
		this._modulator = null;
		this.frequency = null;
		this.detune = null;
		this.modulationFrequency = null;
		return this;
	};

	return Tone.PWMOscillator;
});