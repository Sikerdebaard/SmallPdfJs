var queue = {};
var myDropzone;
var timer = null;

$( document ).ready(function() {
//	Closes the sidebar menu
	$("#menu-close").click(function(e) {
		e.preventDefault();
		$("#sidebar-wrapper").toggleClass("active");
	});

//	Opens the sidebar menu
	$("#menu-toggle").click(function(e) {
		e.preventDefault();
		$("#sidebar-wrapper").toggleClass("active");
	});

//	Scrolls to the selected menu item on the page
	$(function() {
		$('a[href*=#]:not([href=#])').click(function() {
			if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {

				var target = $(this.hash);
				target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
				if (target.length) {
					$('html,body').animate({
						scrollTop: target.offset().top
					}, 1000);
					return false;
				}
			}
		});
	});
	
	function download(file) {
		$('<iframe></iframe>')
		.hide()
		.attr('src', file)
		.appendTo($('body'))
		.load(function() {
			var that = this;
			setTimeout(function() {
				$(that).remove();
			}, 100);
		});
	}
	
// init dropzone and listen for preview and downloads
	$(function() {
		Dropzone.options.dropzone = false;
		myDropzone = new Dropzone('#dropzone');
		myDropzone.on('success', function(file, res) {
			if (res.status != 'ok') {
				myDropzone.removeFile(file);
			} else {
				queue[res.token] = file;
				if (timer == null) {
					timer = window.setInterval(function() {
						Object.keys(queue).forEach(function(key, index) {
							$.ajax({
								url: 'compresspdf/status/' + key
							}).done(function(data) {
								console.log(data);
								if (data.status == 'download') {
									var token = data.token;
									myDropzone.removeFile(queue[token]);
									delete queue[token];
									download( window.location.toString() + 'compresspdf/download/' + key); 
								}
							});
						});
					}, 5000);
				}
			}
		});
	});
});