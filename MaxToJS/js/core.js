// make sure site is https because of sensor permissions
if ( location.protocol != "https:" ) {
  location.href = "https:" + window.location.href.substring( window.location.protocol.length );
}

// system variables
let algo_mode = 'auto';
let system_started = false;
let bpm_verifier;
let estimating = false;
// goals variables
let running_time = 0;
let running_steps = 0;
let starting_time = 0;

// use if not defering script loading
//document.addEventListener("DOMContentLoaded", documentReady, false);
// use if defering script loading
documentReady();

/*********************************************
/* helper functions
/********************************************/
// easily get document element
function _(el) {
  return document.getElementById(el);
}
// show message in html "console"
function Log(text, clear = false) {
	if(clear === true)
		_("console").innerHTML = text;
	else
		_("console").innerHTML = _("console").innerHTML + "<br \>" + text;

	_("console").scrollTop = _("console").scrollHeight;
	_("console").style.display = "block";
}
// clear html "console"
function clearLog() {
	_("console").innerHTML = "";
	_("console").scrollTop = 0;
}

// custom javascript console.log
// tag to know which script triggered the logging
function consoleLog(tag, msg) {
	console.log(tag, msg);
}

// value rounding to 2 decimal cases
function roundVal(value) {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}
// custom int randomizer
function getRandomInt(min, max) {
	let r = Math.floor(Math.random() * Math.floor(max-min));

	return r + min;
}

// used for triggering custom events
function dispatchCustomEvent(event_name, event_details) {
	document.body.dispatchEvent(
		new CustomEvent(event_name,
		{
			detail: event_details
		})
	);
}

/********************************************/

function modeChange(e) {
	const method = e.target.id;

	if(method === 'automaticMode') {
		setMode('auto');
	}
	else if(method === 'manualMode') {
		setMode('manual');
	}
}

function setMode(mode) {
	const controlDiv = _("bpmDiv");

	if (mode === 'auto') {
		controlDiv.style.display = "none";
		algo_mode = 'auto';
	}
	else if (mode === 'manual') {
		controlDiv.style.display = "block";
		algo_mode = 'manual';
	}
}

// calculate pace, speed and distance from stride and step/time goals
function calculatePace() {
	const height_ft = parseInt(_("feet").value);
	const height_in = parseInt(_("inches").value);
	const steps = parseInt(_("steps").value);
	const time = parseInt(_("time").value);

	// convert time to seconds
	let t_sec = time * 60;
	// get stride length in inches
	let stride = ( (height_ft * 12) + height_in ) * 0.413;
	// convert stride length to miles
	let st_mile = stride / 63360;
	// calculate total distance (1 stride = 2 steps)
	let distance = roundVal(st_mile * steps / 2);
	// calculate running speed
	let mph = roundVal(time / distance);
	// calculate music bpm
	let bpm = roundVal(steps / time);

	// convert to milliseconds
	running_time = t_sec * 1000;
	running_steps = steps;

	_("strideCalculator").style.display = "none";

	_("console").innerHTML = "In order to reach " + steps + " steps (~" + distance + " miles) in " + time + " minutes, you'll be running at a pace of " + mph + " minutes per mile, and music should be " + bpm + "bpm.";

	_("bpmPace").value = bpm;
}

function customEventListenersSetup() {
	// wait for custom event to be triggered after device motion testing
	document.body.addEventListener('motionResult', function(e) {
		const res = e.detail;
		if(res.has_motion == false) {
			_("algoMode").style.display = "none";
			_("manualMode").click();
		}
		else
			_("automaticMode").click();
	}, false);

	// wait for custom event to be triggered after device motion testing
	document.body.addEventListener('songPlayback', function(e) {
		const res = e.detail;
		if(res.action == 'start') {
			// song started playing, show stop button
			_("stopBtn").style.display = "inline-block";
		}
		else {
			// song stopped playing
			_("stopBtn").style.display = "none";
			_("startBtn").style.display = "inline-block";

			if(estimating == true) {
				_("bpmPace").value = target_bpm;
				//_("manualMode").click();
			}
		}
	}, false);

	// wait for custom event to be triggered after device motion testing
	document.body.addEventListener('goalReached', function(e) {
		const res = e.detail;
		if(res.goal === 'time') {
			stopAudio();
			Log("Congratulations, you've reached your target time. You did " + res.steps + " steps.", true);
		}
		else if(res.goal === 'steps') {
			stopAudio();
			Log("Congratulations, you've reached your target step count in " + res.time + " minutes.", true);
		}
		// reset goals
		running_steps = 0;
		running_time = 0;
		starting_time = 0;

	}, false);
}

function uiEventListenersSetup() {
	// app mode selection
	_("automaticMode").addEventListener('click', modeChange, false);
	_("manualMode").addEventListener('click', modeChange, false);

	// bpm/pace calculator methods (UI and calculation)
	_("showCalculator").addEventListener('click', function() {
		 _("strideCalculator").style.display = "block";
	}, false);

	_("calculateBPM").addEventListener('click', calculatePace, false);

	_("fileManagerBtn").addEventListener('click', function() {
		 doFiles(0);
	}, false);

	const overlays = document.getElementsByClassName('overlay');
	for(let i = 0; i < overlays.length; i++) {
		overlays[i].addEventListener('click', function(e) {
			if(e.target.classList.contains('overlay'))
				overlays[i].style.display = "none";
		}, false);
	}

	// system control (start/stop)
	_("startBtn").addEventListener('click', function() {
		const bpm = parseInt(_("bpmPace").value);
		const permissions_set = checkPermissions();

		system_started = true;

		_("startBtn").style.display = "none";

		if(algo_mode === 'auto') {
			if(avg_count == 1) {
				estimating = true;
				// used for automatic mode song selection
				Log("You can start running. When you hear a series of beeps you can hit start to start the music.", true);
				target_bpm = 0;
				const bpm_verifier_timer = setInterval(checkBpm, 2500);

				audio_trigger.src = "./samp/sys/wake-up.mp3";
				audio_trigger.play();
			}
			else if(avg_count >=4) {
				estimating = false;
				consoleLog(a_tag, "Starting playback");
				// reset averaging
				avg_bpm = 0;
				avg_count = 1;
				// play song at estimated bpm
				playSong(target_bpm);
			}
		}
		else
			playSong(bpm);

	}, false);
	_("stopBtn").addEventListener('click', function() {
		stopAudio();

		Log("Stopped.", true);

		system_started = false;
	}, false);
}

// system initialization
function documentReady() {

	// setup custom event listeners
	// (motion availability detection and goal reaching)
	customEventListenersSetup();

	// setup UI element hooks
	uiEventListenersSetup();

	// initialize audio engine
	audioConstructor();

	// initialize step detection
	stepConstructor();

	// initialize file manager
	fileManagerConstructor();
}
