var express = require('express');
var fs = require('fs');
var temp = require('temp').track();
var Magic = require('mmmagic').Magic;
var magic = new Magic();
require('string.prototype.startswith');
var compresspdfjs = require('../compresspdf/compresspdfjs');

var router = express.Router();

router.get('/status/:token', function(req, res, next) {
	res.json({'status': compresspdfjs.status(req.params.token), 'token': req.params.token});
});

router.get('/download/:token', function(req, res, next) {
	if (compresspdfjs.status(req.params.token) != 'download') {
		res.end();
	}
	
	var fileInfo = compresspdfjs.getDownload(req.params.token);
	var filePath = fileInfo.processed;
	fs.stat(filePath, function(err, stat){
		if (!stat.isFile()) {
			res.end();
		}
		
		res.type('application/octet-stream');
		res.set('Content-Disposition', 'attachment; filename=' + encodeURIComponent(fileInfo.originalName));
		res.sendFile(filePath);
	});
});

/* GET compress pdf listing. */
router.post('/', function(req, res, next) {
	if (req.busboy) {
		req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			//res.set('Content-Type', 'application/octet-stream');
			//res.set('Content-Disposition', 'attachment; filename=blap.pdf');
			//res.sendFile(file);
			//console.log(file);
			file.on('limit', function() {
				req.unpipe(req.busboy);
				res.json({'status': 'error', 'message': 'Datalimit reached'});
				res.end();
			});
			temp.open('compresspdf', function(err, info) {
				fstream = fs.createWriteStream(info.path);
				console.log(info.path);
	            file.pipe(fstream);
	            fstream.on('close', function () {
	            	magic.detectFile(info.path, function(err, result) {
	            	    if (result.toLowerCase().startsWith('pdf ')) {
	            	    	var token = compresspdfjs.add(info.path, filename);
	            	    	res.json({'status': 'ok', 'token': token});
	            	    	res.end();
	            	    } else {
	            	    	res.json({'status': 'error', 'message': 'File is not a PDF file'});
	            	    	res.end();
	            	    }
	            	});	            	
	            });
			});
		});
	};
//	fs.readFile(req.files.displayImage.path, function (err, data) {
////		var newPath = __dirname + "/uploads/uploadedFileName";
////		fs.writeFile(newPath, data, function (err) {
////			res.redirect("back");
////		});
//		console.log(data);
//	});
	//res.send('respond with a resource');
});

module.exports = router;
