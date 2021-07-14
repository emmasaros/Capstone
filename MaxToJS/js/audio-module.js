let audio_files = {};

// webaudio playback variables
let audio_started = false;
let audio_buffer = null;
let audio_source = null;
const audio_trigger = new Audio();
let bpm_interval = bpm_interval_default;
// app flow variables
let ready_to_play = false;
let audio_playing = false;
let success = false;
let stopped = false;
let loading = false;
// file variables
let file = '';
let target_bpm = 0;
let file_bpm = 0;
let avg_bpm = 0;
let avg_count = 1;

const a_tag = "AUDIO :: ";

const song_end_event = new Event('songEnded');

// initialize audio
function audioConstructor() {
	// start webaudio with a click on any document element
	document.body.addEventListener('touchstart', startAudio, true);
	document.body.addEventListener('touchend', startAudio, true);
	document.body.addEventListener('click', startAudio, true);

	getSongList();
}

// this function could also be used to adjust playback rate based
// on current running pace (with audio_source.playbackRate)
function checkBpm() {
	if (system_started == true) {
		if(algo_mode === 'auto') {
			// target bpm not yet set
			if(target_bpm == 0) {
				if(current_bpm > 50) {
					// first estimation
					avg_bpm += current_bpm;

					if (debug['audio'] == true)
						consoleLog(a_tag, "Estimating bpm: " + (avg_bpm/avg_count) + "; Current bpm: " + current_bpm);

					// averaged 4 estimations
					if(avg_count >= 4) {
						target_bpm = Math.round(avg_bpm/avg_count);

						if (debug['audio'] == true)
							consoleLog(a_tag, "Final estimated bpm: " + target_bpm);

						Log("Ready to start at " + target_bpm + " beats per minute! Hit the Start button again", true);

						audio_trigger.src = "./samp/sys/bleep.mp3";
						audio_trigger.play();

						// estimation is done, show start button again
						dispatchCustomEvent("songPlayback", {action: 'stop'});
					}

					avg_count++;
				}
			}
			else {
				// this function could also be used to adjust playback rate based
				// on current running pace (with audio_source.playbackRate)
				if(audio_playing == true) {
					if (current_bpm > 50) {
						avg_bpm += current_bpm;
						
						if(avg_count >=4) {
							const t_avg = Math.round(avg_bpm/avg_count);
							const curr_pace = target_bpm - t_avg;
							
							avg_bpm = t_avg;
							avg_count = 1;
							
								audio_source.playbackRate = t_avg / target_bpm;
								consoleLog(a_tag, "Adjusting playback rate to " + (t_avg / target_bpm));
							
							if(Math.abs(curr_pace) < bpm_interval) {
								//audio_source.playbackRate = t_avg / target_bpm;
								//consoleLog(a_tag, "Adjusting playback rate to " + (t_avg / target_bpm));
								/*
								if(curr_pace < 0) {
									Log("You're running too slow", true);
								}
								else {
									Log("You're running too fast", true);
								}*/
							}
							/*
							else {
								estimating = true;
								target_bpm = t_avg;
								avg_count = 1;
								Log("You seem to have changed running pace. Push start to play a new song.", true);
								
								audio_trigger.src = "./samp/sys/bleep.mp3";
								audio_trigger.play();

								// estimation is done, show start button again
								stopAudio();
							}
							*/
						}
						
						avg_count++;
					}
				}
			}
		}
	}
}

// gets all the songs in server into variable
function getSongList() {
	if (debug['audio'] == true)
		consoleLog(a_tag, "Getting files");

	let request = new FormData();
	request.append("act", "list");
	let xhr = new XMLHttpRequest();
	xhr.addEventListener("load", function() {
		const response = JSON.parse(xhr.responseText);
		audio_files = response;

		if(Object.keys(audio_files).length > 0 && typeof(audio_files) === 'object')
			success = true;
		else
			songError();

		if (debug['audio'] == true)
			consoleLog(a_tag, "Files" + JSON.stringify(audio_files));
	}, false);

    xhr.addEventListener("error", songError, false);

	xhr.open("POST", 'php/fileManager.php');
	xhr.send(request);
}

function songError(e) {
	alert("There was a problem retrieving songs from server, please refresh webpage.");
	success = false;
}

// select a song based on targetted bpm
function getSong() {
	let pool = new Array();

	for (const key in audio_files) {
		if (Math.abs(key - target_bpm) < bpm_interval) {
			const t_arr = audio_files[key];

			for (let i = 0; i< t_arr.length; i++)
				pool.push(t_arr[i]);
		}
	}
	let choice = getRandomInt(0, pool.length);

	for (const key in audio_files) {
		if (audio_files[key].includes(pool[choice])) {
			file_bpm = key;
			break;
		}
	}

	if(pool[choice] !== undefined) {
		bpm_interval = bpm_interval_default;
		return pool[choice];
	}
	else {
		if (debug['audio'] == true)
			consoleLog(a_tag, "No song. Increasing bpm interval to " + (bpm_interval+1))
		bpm_interval += 1;
		return getSong();
	}
}

// select a song and load it into audio buffer
async function playSong(bpm) {
	if(loading == false) {
		if(success == false) {
			songError();
			return 0;
		}

		if (audio_playing == true)
			stopAudio();

		target_bpm = bpm;

		Log("Loading song...", true);

		file = getSong();

		if (file === undefined) {
			Log("No song available. Please select a different BPM or upload more songs.", true);
			dispatchCustomEvent("songPlayback", {action: 'stop'});
		}
		else {
			const path = "./samp/" + file;

			if (debug['audio'] == true)
				consoleLog(a_tag, "Loading " +  path + "; file BPM: " + file_bpm + "; target BPM: " + target_bpm);

			// needed for iOS
			await startAudio();

			audio_buffer = new Tone.Buffer(path, playSample);
		}
	}
}

// play loaded song
function playSample() {
	if (debug['audio'] == true) {
		consoleLog(a_tag, "Sample loaded, ready to play!");
	}

	if(audio_playing == false) {
		let playback_rate = target_bpm / file_bpm;

		if (Tone.context.state !== 'running') {
			Tone.context.resume();
		}

		try {
			audio_source = new Tone.GrainPlayer(audio_buffer).toDestination();

			audio_source.grainSize = 0.15;
			audio_source.playbackRate = playback_rate;
			audio_source.overlap = 0.1;
			audio_source.loop = false;
			audio_source.onstop = playbackFinished;

			audio_playing = true;

			audio_source.start();
			loading = false;

			dispatchCustomEvent("songPlayback", {action: 'start'});

			// remove "-" and extension (mp3/wav) from filename
			Log("Playing " + file.replace(/-/g, " ").split('.').slice(0,-1).join('.'), true);

			if (debug['audio'] == true)
				consoleLog(a_tag, "Playing!");
		}
		catch(e) {
			consoleLog(a_tag, e);
		}
	}
}

// playback stopped callback
function playbackFinished() {
	dispatchCustomEvent("songPlayback", {action: 'stop'});

	audio_playing = false;
	

	// if it wasn't manually stopped,
	// select a new song of selected bpm
	if(!stopped) {
		setTimeout(() => {
			playSong(target_bpm);
		}, 500);
	}
}

// manually stop audio
function stopAudio() {
	// inform system the stop was manual
	stopped = true;
	
	// reset estimation
	target_bpm = 0;
	avg_count = 1;
	avg_bpm = 0;

	// stop playback
	if (audio_source != null)
		audio_source.stop();
}

// init web audio
async function startAudio() {

	if (debug['audio'] == true)
		consoleLog(a_tag, "Starting audio...");

	await Tone.start();

	// first init
	if(audio_started == false) {
		if (debug['audio'] == true)
			consoleLog(a_tag, "First time.");

		document.body.removeEventListener('touchstart', startAudio, true);
		document.body.removeEventListener('touchend', startAudio, true);
		document.body.removeEventListener('click', startAudio, true);

		try {
			let context = new Tone.Context();
			context.resume();
			Tone.setContext(context);

			// iOS starts audio context suspended and needs to be resumed manually
			if(Tone.context.state === 'suspended')
				Tone.context.resume();

			if (debug['audio'] == true)
				consoleLog(a_tag, "Audio context is " + Tone.context.state);

			audio_started = true;
		}
		catch(e) {
			alert('Web Audio API is not supported in this browser');
			consoleLog(a_tag, e);
		}
	}
	else { // not first init, just resume if needed
		if (debug['audio'] == true)
			consoleLog(a_tag, "Audio context is " + Tone.context.state);

		if(Tone.context.state === 'suspended') {
			if (debug['audio'] == true)
				cconsoleLog(a_tag, "Resuming playback.");

			Tone.context.resume();
		}
	}
}
