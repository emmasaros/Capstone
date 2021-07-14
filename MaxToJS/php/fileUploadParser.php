<?php
	/***********************************************************************
	/*
	/*	HANDLES FILE UPLOAD
	/*
	***********************************************************************/
	
	$file_upload_ok = false;
	$file_list_ok = false;
	// song directory
	$dir = "../samp/";
	
	// sanitize and assign
	$file_name = sanitize_file_name($_FILES["file1"]["name"]); // The file name
	$fileTmpLoc = $_FILES["file1"]["tmp_name"]; // File in the PHP tmp folder
	$fileType = $_FILES["file1"]["type"]; // The type of file it is
	$fileSize = $_FILES["file1"]["size"]; // File size in bytes
	$fileErrorMsg = $_FILES["file1"]["error"]; // 0 for false... and 1 for true
	
	// if script is called without file
	if (!$fileTmpLoc) { 
		outMsg("ERROR: Please browse for a file before clicking the upload button.");
	}
	// try to create file at destination directory
	if(move_uploaded_file($fileTmpLoc, $dir.$file_name)){
		$file_upload_ok = true;
	} else {
		outMsg("move_uploaded_file function failed");
	}
	
	// open and decode song list file
	$list_url = $dir."fileList.txt";
	if(!fopen($list_url, "r")) {
		outMsg("File list not present");
	}
	$file_contents = file_get_contents($list_url);
	$file_array = array();
	if(strlen($file_contents)>0)
		$file_array = json_decode($file_contents, true);
	
	// if no BPM was chosen in form
	if(!$_POST["bpm"] || empty($_POST["bpm"])) {
		outMsg("ERROR: Please set a BPM for the song before upload.");
	}
	
	$file_bpm = intval($_POST["bpm"]);
	
	$new_file = true;
	
	// find if song is already uploaded
	foreach ($file_array as $bpm_s => $songs) {	
		$bpm = intval($bpm_s);
		
		if (in_array($file_name, $songs)) {		
			//outMsg($file_bpm . "!=" . $bpm . " - " . ($file_bpm != $bpm ? 'true' : 'false'));
			
			if($file_bpm != $bpm) {
				// if song is uploaded with different bpm
				// remove it from current bpm song list
				$index = array_search($file_name, $songs);				
				unset($file_array[$bpm][$index]);
				
				if(empty($file_array[$bpm])) {
					unset($file_array[$bpm]);
				}
			}
			else {
				$new_file = false;
			}
		}
	}
	
	// if new_file is false, song already exists
	// with same bpm, nothing to change
	if($new_file == true) {
		if(isset($file_array[intval($file_bpm)])) {
			array_push($file_array[$file_bpm], $file_name);
		}
		else {
			$file_array[$file_bpm] = array($file_name);
		}
	}
	else
		outMsg("Song already exists in list.");
	
	$output = json_encode($file_array, JSON_NUMERIC_CHECK );
	
	if(file_put_contents($list_url, $output))
		$file_list_ok = true;
	
	if($file_list_ok && $file_upload_ok)
		outMsg("$file_name upload successful.");
	else
		outMsg("An uknown error occured. Please try again.");
	
	// output response
	function outMsg($msg) {
		echo $msg;
		echo "<br />";
		exit(0);
	}
	
	// remove dangerous characters from filename
	function sanitize_file_name( $file_name ) {
		$special_chars = array("?", "[", "]", "/", "\\", "=", "<", ">", ":", ";", ",", "'", "\"", "&", "$", "#", "*", "(", ")", "|", "~", "`", "!", "{", "}");
		$file_name = str_replace($special_chars, '', $file_name);
		$file_name = preg_replace('/[\s-]+/', '-', $file_name);
		$file_name = trim($file_name, '.-_');
		return $file_name;
	}
?>