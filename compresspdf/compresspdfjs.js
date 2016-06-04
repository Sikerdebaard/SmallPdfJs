var randomstring = require("randomstring");
var exec = require('child_process').exec;

var queue = {};
var processing = {};
var download = {};
var error = {};
var originalName = {};

var processRunning = false;
//var dockerCmd = 'cat %INFILE% | docker run -i sikerdebaard/ghostscript gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=- - > /tmp/_.pdf';
var localCmd = 'cat %INFILE% | gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=- - > %INFILE%.compressed.pdf';

function doGhostscript() {
	if (processRunning == true) {
		return;
	}
	if (queue.length == 0) {
		return;
	}
	processRunning = true;
	
	var key = Object.keys(queue)[0];
	var file = queue[key];
	delete queue[key];
	processing[key] = file;
	
	
	exec(localCmd.replace(/%INFILE%/g, file), function(error, stdout, stderror) {
		delete processing[key];
		if (error == null) {
			download[key] = {'original': file, 'processed': file + '.compressed.pdf', 'timestamp': Date.now(), 'originalName': originalName[key]};
		} else {
			error[key] = file;
		}
		delete originalName[key];
		processRunning = false;
	});
}

module.exports = {
		add: function(filePath, orginalName) {
			var token;
			do {
				token = randomstring.generate(16);
			} while(token in queue);
			queue[token] = filePath;
			originalName[token] = orginalName;
			if (processRunning == false) {
				doGhostscript();
			}
			return token;
		},
		status: function(token) {
			console.log(processRunning);
			if (processRunning == false) {
				doGhostscript();
			}
			if (token in queue) {
				return 'queue';
			} else if (token in processing) {
				return 'processing';
			} else if (token in download) {
				return 'download';
			} else {
				return 'unknown';
			}
		},
		getDownload: function(token) {
			var ret = download[token];
			delete download[token];
			return ret;
		}
};