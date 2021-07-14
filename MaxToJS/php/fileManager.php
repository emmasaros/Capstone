<?php
	/***********************************************************************
	/*
	/*	HANDLES FILE LISTING AND UPDATING ASYNCHRONOUS REQUESTS
	/*
	***********************************************************************/
	
	// sanitize post array
	$POST = filter_var_array($_POST, FILTER_SANITIZE_STRING);
	
	$action = $POST["act"];
	// song directory
	$dir = "../samp/";

	// song list file
	$list_url = $dir."fileList.txt";
	
	// open song list file and get song list
	$file_contents = file_get_contents($list_url);
	$file_array = array();
	if(strlen($file_contents)>0)
		$file_array = json_decode($file_contents, true);
	
	// initialize response string
	$out = "";
	
	if(strcmp($action, "list") == 0) {
		$out .= listFiles();
	}	
	elseif(strcmp($action, "del") == 0) {
		$filename = $POST["file"];
		$out .= deleteFile($filename);
		$out .= listFilesJSON();
	}
	elseif(strcmp($action, "get") == 0) {
		$bpm = $POST["bpm"];
		$interval = $POST["interval"];
		$out .= getFile($bpm, $interval);
	}
	elseif(strcmp($action, "edit") == 0) {
		$filename = $POST["file"];
		$bpm = $POST["bpm"];
		$out .= editFile($filename, $bpm);
		$out .= listFilesJSON();
	}
	else
		exit(0);
	
	// output request response
	echo $out;
	
	// edit song details (bpm)
	function editFile($filename, $new_bpm) {
		global $file_array, $list_url;
		
		// remove from old bpm index
		foreach ($file_array as $bpm => $songs) {		
			if (in_array($filename, $songs)) {
				$index = array_search($filename, $songs);				
				unset($file_array[$bpm][$index]);
				// if no other songs of this bpm exist
				// delete array index
				if(empty($file_array[$bpm])) {
					unset($file_array[$bpm]);
				}
				
				break;
			}
		}
		
		// add to new bpm index
		if(isset($file_array[$new_bpm])) {
			array_push($file_array[$new_bpm], $filename);
		}
		else {
			$file_array[$new_bpm] = array();
			array_push($file_array[$new_bpm], $filename);
		}
		// encode array as json
		$output = json_encode($file_array, JSON_NUMERIC_CHECK );
		// try to save song list file with update details
		// and output message (success/failure to write)
		if(file_put_contents($list_url, $output))
			return "<span class=\"info\">Changed $filename to $new_bpm BPM.</span>";
		else
			return "<span class=\"info\">An error ocurred updating file list.</span>";
		
	}
	
	function getFile($file_bpm, $interval) {
		global $file_array;
		
		$pool = array();
		
		foreach($file_array as $bpm => $songs) {
			if(abs($file_bpm-$bpm) <= $interval) {
				foreach($songs as $song) {
					$this['file'] = $song;
					$this['bpm'] = $bpm;
					array_push($pool, $this);
				}
		}
			}
		
		return json_encode($pool);
	}
	
	// return already built html file list
	function listFilesJSON() {
		global $file_array;
		
		$msg = "<div class=\"song header\"><div class=\"song_file header\">File</div><div class=\"song_bpm header\">BPM</div><div class=\"delete_song header\">Delete</div></div>\n";
		foreach($file_array as $bpm => $songs) {
			foreach($songs as $song) {
				$msg .= "<div class=\"song\"><div class=\"song_file\">$song</div><div class=\"song_bpm\" data-filename=\"$song\">$bpm</div><div class=\"delete_song\"><span class=\"del_button\" data-filename=\"$song\"></span></div></div>\n";
			}
		}
		return $msg;
	}
	
	// return json song list
	function listFiles() {
		global $file_array;
		
		return json_encode($file_array);
	}
	
	// delete song file from disk and song list
	function deleteFile($filename) {
		global $file_array, $dir, $list_url;
		
		// path to file to be deleted
		$path = $dir . $filename;
		
		// try to delete (unlink) file
		if (unlink($path)) {
			// if successful remove song from songlist
			foreach ($file_array as $bpm => $songs) {		
				if (in_array($filename, $songs)) {
					$index = array_search($filename, $songs);				
					unset($file_array[$bpm][$index]);
					
					if(empty($file_array[$bpm])) {
						unset($file_array[$bpm]);
					}
					
					break;
				}
			}
			// encode array as json
			$output = json_encode($file_array, JSON_NUMERIC_CHECK );
			// try to save song list file with update details
			// and output message (success/failure to write)
			if(file_put_contents($list_url, $output))
				return "<span class=\"info\">Deleted $filename.</span>";
			else
				return "<span class=\"info\">An error ocurred updating file list.</span>";
		}
		else
			return "<span class=\"info\">Unable to delete $filename.</span>";
	}
?>
