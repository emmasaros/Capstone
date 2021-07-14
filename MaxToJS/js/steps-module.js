// accelerometer variables
let acc_x = 0, acc_y = 0, acc_z = 0;
let prev_x = 0, prev_y = 0, prev_z = 0;
const move_threshold = 0.5;
const shake_threshold = 9.8 / step_threshold;
// step variables
let last_step;
const step_time = 60000 / max_bpm;
const frequency = 200;
let total_steps = 0;
// bpm estimation variables
let step_times = [];
const n_steps = 5;
let bpms = [];

let permissions_set = true;	
let step_checker;

let current_bpm;

let motion_available = false;

const v_tag = "STEPS :: ";

// check if devicemotion event is available
function checkMotion() {
	if (typeof( DeviceMotionEvent ) !== "undefined") {
		return true;
	}
	return false;
}

// check if device is mobile
function checkDevice() {	
	if (navigator.userAgent.match(/Android/i) ||
		navigator.userAgent.match(/webOS/i) ||
		navigator.userAgent.match(/iPhone/i) ||
		navigator.userAgent.match(/iPad/i) ||
		navigator.userAgent.match(/iPod/i) ||
		navigator.userAgent.match(/BlackBerry/i))
			return true;
	
	return false;
}

// check for sensor access permissions (needed for iOS)
function checkPermissions() {
    if (checkMotion() && typeof( DeviceMotionEvent.requestPermission ) === "function" ) {
        DeviceOrientationEvent.requestPermission().then(permissionState => {
          if (permissionState === 'granted') {
			if(debug['steps'] == true)
				consoleLog(v_tag, "Permissions granted");			
			return true;
          }
          else {
            if(debug['steps'] == true)
				consoleLog(v_tag, "Unable to grant permission.")
			
            return false;
          }
        })
        .catch(function (error) {
          
		  if(debug['steps'] == true)
			consoleLog(v_tag, "Request error:\n" + JSON.stringify(error));
          
		  return false;
        })
    }
    else {
		if(debug['steps'] == true)
			consoleLog(v_tag, "No permission needed");
		
		return  true;
    }
}

// implemented as in patch
function difference(a, b) {
	return roundVal(Math.abs(a - b));
}

// shift array elements and insert new one
function arrayShift(arr, val) {
	for(let i = 1; i < arr.length; i++) {
		arr[i-1] = arr[i];
	}
	arr[arr.length-1] = val;
	
	return arr;
}

// array value averaging
function average(arr) {
	let avg = 0;
	
	for(let i=0; i< arr.length; i++) {
		avg += arr[i];
	}
	
	avg = avg/arr.length;
	
	return roundVal(avg);
}

// estimate bpm from step frequency
function estimateBPM(time) {
	// if one second has passed since last step, reset bpm calculation
	if(last_step - step_times[step_times.length - 1] > 1000) {
		step_times = [];
	}
	
	if(step_times.length < 2) {
		step_times.push(time)
	}
	else {
		step_times = arrayShift(step_times, time);
	}
	
	if(step_times.length > 1) {
		var time_intervals = [];
		for (var i=0; i < step_times.length-1; i++) {
			time_intervals.push(step_times[i+1] - step_times[i]);
		}
		
		var average_time_difference = average(time_intervals);
		var bpm = 60000 / average_time_difference;
		
		if(bpms.length < n_steps) {
			bpms.push(bpm);
		}
		else {
			bpms = arrayShift(bpms, bpm);
		}
		
		return average(bpms);
	}
	
	return 0;
}

// assign accelerometer values to variables
function motion(event) {
	const temp_x = roundVal(event.acceleration.x);
	const temp_y = roundVal(event.acceleration.y);
	const temp_z = roundVal(event.acceleration.z);
	
	if(temp_x != acc_x)
		acc_x = temp_x;
	if(temp_y != acc_y)
		acc_y = temp_y;
	if(temp_z != acc_z)
		acc_z = temp_z;
}

// check if a step occured
function checkStep() {	
	if(permissions_set == true && system_started == true) {
		
		let result = false;
		const t = Date.now();
		
		if(calc_method == 1)
			result = method1();
		else
			result = method2();
	
		if((result == true) && (t - last_step >= step_time)) {
			
			last_step = t;
			
			if (starting_time == 0)
				starting_time = t;
			
			total_steps++;
			
			current_bpm = estimateBPM(last_step);
			
			if(estimating == false)
				Log("Steps: " + total_steps + "<br \>" + "Pace: " + current_bpm + " steps per minute.", true);
			
			if(debug['steps'] == true)
				consoleLog(v_tag, "Time: " + (t - starting_time));
			
			// check if goals were set
			if(running_time != 0 && running_steps != 0) {
				// if time now is greater or equal than starting + goal time
				if (t >= (starting_time + running_time)) {
					dispatchCustomEvent("goalReached", {
						goal: 'time',
						time: t,
						steps: total_steps
					});
				}
				else {
					// if steps are greater or equal than goal steps
					if(total_steps >= running_steps) {
						dispatchCustomEvent("goalReached", {
							goal: 'steps',
							time: ((t-starting_time)/60000),
							steps: total_steps
						});
					}
				}
			}
		}
	}
}

// max patch detection implementation
function method1() {
	// normalize to gravity force
	acc_x = acc_x / 9.8;
	acc_y = acc_y / 9.8;
	acc_z = acc_z / 9.8; 
	
	var calc_x = difference(acc_x, prev_x);
	var calc_y = difference(acc_y, prev_y);
	var calc_z = difference(acc_z, prev_z);
	
	prev_x = acc_x;
	prev_y = acc_y;
	prev_z = acc_z;
	
	if (calc_x > step_threshold || calc_y > step_threshold || calc_z > step_threshold) {
		if(calc_x + calc_y + calc_z > 0)
			return true;
	}
	
	return false;
}

// new detection implementation
function method2() {
	let acc_change_x;
	let acc_change_y;
	let acc_change_z;
	
	acc_x *= 2;
	acc_y *= 2;
	acc_z *= 2;	
	
	if (prev_x != null) {
		acc_change_x = Math.abs(acc_x - prev_x);
		acc_change_y = Math.abs(acc_y - prev_y);
		acc_change_z = Math.abs(acc_z - prev_z);
	}
	
	prev_x = acc_x;
	prev_y = acc_y;
	prev_z = acc_z;
	
	if (acc_change_x + acc_change_y + acc_change_z > shake_threshold * 3)
		return true;
	else 
		return false;
}

// initialize step detection
function stepConstructor() {
	if(checkDevice()){
		if(checkMotion()) {
			if (permissions_set == true) {
				window.addEventListener('devicemotion', motion, false);
				last_step = Date.now();
				step_checker = setInterval(checkStep, frequency);
				
				motion_available = true;
				
				if(debug['steps'] == true)
					consoleLog(v_tag, "Motion listener is running");
			}
		}
		else
			Log("Device motion sensor not accessible. Pace detection will not be available.", true);
	}
	else
		Log("You are not using a mobile device. Pace detection will not be available.", true);
	
	// if device motion isn't available probably not a mobile device
	if (motion_available == false)
		dispatchCustomEvent("motionResult", {has_motion: false});
}