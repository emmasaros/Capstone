// file list operations (list, change bpm, delete)
function doFiles(action, file, bpm) {
	let request = new FormData();
	if(action == 0)
		request.append("act", "list");
	else if(action == 1) {
		request.append("act", "del");
		request.append("file", file);
	}
	else if(action == 2) {
		request.append("act", "edit");
		request.append("file", file);
		request.append("bpm", bpm);
	}

	let xhr = new XMLHttpRequest();

	xhr.addEventListener("load", function() {
		let response = '';

		if(action == 0) {
			const files = JSON.parse(xhr.responseText);

			response = "<div class=\"song header\"><div class=\"song_file header\">File</div><div class=\"song_bpm header\">BPM</div><div class=\"delete_song header\">Delete</div></div>\n";

			Object.keys(files).forEach(bpm => {
				const songs = files[bpm];

				for(let i=0; i < songs.length; i++) {
					const song = songs[i];
					response += "<div class=\"song\"><div class=\"song_file\">" + song + "</div>";
					response += "<div class=\"song_bpm\" data-filename=\""+ song + "\"> " + bpm + "</div>";
					response += "<div class=\"delete_song\"><span class=\"del_button\" data-filename=\"" + song + "\"></span></div></div>\n";
				}
			});

			response += "</div>";
		}
		else {
			response = xhr.responseText;
		}

		getSongList();

		_("fileList").innerHTML = response;

		_("fileManager").style.display = "block";
	}, false);

	xhr.open("POST", 'php/fileManager.php');
	xhr.send(request);
}

// validate form and upload file
function uploadFile() {
	let file = _("file1").files[0];
	supportedFormats = ['audio/mpeg','audio/wav'];

	if (file && file.type) {
		if (0 > supportedFormats.indexOf(file.type)) {
			_("uploadStatus").innerHTML = 'Unsupported format';
			return(0);
		}
	}
	else {
		_("uploadStatus").innerHTML = 'Please select a file to upload.';
		return(0);
	}

	let formdata = new FormData();
	formdata.append("file1", file);
	formdata.append("bpm", _("fileBpm").value);
	let ajax = new XMLHttpRequest();
	ajax.upload.addEventListener("progress", progressHandler, false);
	ajax.addEventListener("load", completeHandler, false);
	ajax.addEventListener("error", errorHandler, false);
	ajax.addEventListener("abort", abortHandler, false);
	ajax.open("POST", "php/fileUploadParser.php");
	ajax.send(formdata);
}

/*************************************************************
/* progress bar management and status information functions
*************************************************************/

function progressHandler(event) {
	let percent = (event.loaded / event.total) * 100;
	_("progressBar").value = Math.round(percent);

	if(event.loaded < event.total) {
		_("uploadStatus").innerHTML = "Uploaded " + event.loaded + " bytes of " + event.total + "<br />" + Math.round(percent) + "% uploaded... please wait";
	}
	else
		_("uploadStatus").innerHTML = "Upload complete, finishing up...";
}

function completeHandler(event) {
	_("uploadStatus").innerHTML = event.target.responseText;
	_("progressBar").value = 0;
	doFiles(0);
}

function errorHandler(event) {
	_("uploadStatus").innerHTML = "Upload Failed";
}

function abortHandler(event) {
	_("uploadStatus").innerHTML = "Upload Aborted";
}

/*************************************************************/

// eventlisteners initialization
function fileManagerConstructor() {
	_("uploadBtn").addEventListener('click', uploadFile, false);

	_("fileList").addEventListener('click',function(e){
		let el = e.target;

		if(el) {
			if(el.classList.contains("del_button")){
				if(confirm("Do you really want to delete this song? (no undo)"))
					doFiles(1,el.dataset.filename);
			}
			if(el.classList.contains("song_bpm") && !el.classList.contains("header")){
				let value = parseInt(prompt("Please enter new song BPM"));
				if(value != null && Number.isInteger(value))
					doFiles(2,el.dataset.filename, value);
				else
					alert("Please only enter numbers.");
			}
		}
	});
}
