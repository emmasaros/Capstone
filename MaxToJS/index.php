<?php
	$timeStamp = rand(0,10000);
?>
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>Steps</title>
	<meta name="description" content="Steps">
	<meta name="author" content="Steps">
	<link rel="stylesheet" href="style.css?v=<?=$timeStamp?>">
	<link rel="preconnect" href="https://fonts.gstatic.com">
	<link href="https://fonts.googleapis.com/css2?family=Open+Sans+Condensed:ital,wght@0,300;0,700;1,300&display=swap" rel="stylesheet">
	<script type="text/javascript" src="js/libs/tone.js"></script>
	<script type="text/javascript" src="js/global.js?v=<?=$timeStamp?>"></script>
	<script type="text/javascript" src="js/steps-module.js?v=<?=$timeStamp?>"></script>
	<script type="text/javascript" src="js/audio-module.js?v=<?=$timeStamp?>"></script>
	<script type="text/javascript" defer src="js/file-module.js?v=<?=$timeStamp?>"></script>
	<script type="text/javascript" defer src="js/core.js?v=<?=$timeStamp?>"></script>
</head>
<body>
	<div id="interface">
		<p>Operation:</p>
		<div id="algoMode">
			<label class="radio">Automatic pace (detects over first 10 seconds of running)
				<input type="radio" id="automaticMode" name="method" value="1" checked="checked">
				<span class="radio_control"></span>
			</label>
			<label class="radio">Manual pace
				<input type="radio" id="manualMode" name="method" value="2">
				<span class="radio_control"></span>
				</span>
			</label>
		</div>
		<div id="bpmDiv">
			<input type="number" min="70" max="200" value="120" step="1" id="bpmPace" name="bpmPace">
			<label for="bpmPace">Running pace (Steps Per Minute / Beats Per Minute)</label>
			<br />
			<input type="button"  name="showCalculator" id="showCalculator" value="Calculate">	
			<label for="showCalculator">Calculate target pace from goals</label>	
		</div>
	</div>
	<div id="console"></div>
	<div id="startBtn" class="controlBtn"><span>Start</span></div>
	<div id="stopBtn" class="controlBtn"><span>Stop</span></div>
	<div id="fileManagerBtn"></div>
	<div id="strideCalculator" class="overlay">
		<div id="strideForm" class="overlayPanel">
			<h2>Calculate BPM from</h2>
			<label>
				<input type="number" min="2" max="6" value="5" step="1" id="feet" name="feet">
				Height (ft)
			</label>
			<label>
				<input type="number" min="1" max="9" value="1" step="1" id="inches" name="inches">
				Height (in)
			</label>
			<br />
			<label>
				<input type="number" min="1" value="1000" step="1" id="steps" name="steps">
				Desired steps
			</label>
			<br />
			<label>
				<input type="number" min="1" value="5" step="1" id="time" name="time">
				Desired time (min)
			</label>
			<br />
			<input type="button"  name="calculateBPM" id="calculateBPM" value="Calculate">
		</div>
	</div>
	<div id="fileManager" class="overlay">
		<div id="dropArea" class="overlayPanel">
			<form id="upload_form" enctype="multipart/form-data" method="post">
				<input type="file" name="file1" id="file1"><br>
				<label>
					<input type="number" min="70" max="250" step="1" value="120" id="fileBpm" name="fileBpm"/>
					Song BPM
				</label>
				<br />
				<progress id="progressBar" value="0" max="100"></progress>
				<input type="button" name="uploadBtn" id="uploadBtn" value="Upload" />
			</form>
			<div id="uploadStatus"></div>
			<div id="fileList">
			</div>
		</div>
	</div>
</body>
</html>