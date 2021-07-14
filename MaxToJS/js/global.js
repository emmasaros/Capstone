/*********************************************
/* customizable values
/********************************************/

// step  detection ***************************
const max_bpm = 190; // max bpm
const step_threshold = 1; // device motion threshold for step detection (adjust for best results between 0.5 and 2)
const calc_method = 2; // step calculation method (1 - max patch calculation; 2 - new method)
// audio  detection ***************************
const bpm_interval_default = 10; // bpm interval to select songs
// e.g. if target is 120bpm, system will select songs between 115 and 124 bpm for playback
// ********************************************

// debug audio, steps - logs status messages to javascript console
const debug = {'audio': true, 'steps': false};
