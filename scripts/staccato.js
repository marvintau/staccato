$(document).ready(function(){
	$("#editor").focus();
})

$("#editor")
	.on("keyup", function(){
		$("#preview").text($("#editor").val())
	})