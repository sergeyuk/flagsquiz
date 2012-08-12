var socket = io.connect();

console.log( "Sent socket io connect request." );

var USER_STATE_IDLE = 0;
var USER_STATE_CHALLENGE_REQUESTED = 1;
var USER_STATE_IN_CHALLENGE = 2;

var LOCAL_USER_INFO = {
	state: USER_STATE_IDLE,
	socket: socket
};

socket.on('onconnected', function( data ) {
	console.log( 'Connected successfully to the socket.io server. My server side ID is ' + data.id );
	
	$("#pre_login")[0].style.display = "none";;
	$("#main_page")[0].style.display = "block";
	//setInterval( function(){ socket.emit( 'ping' ); console.log( 'ping sent' ); }, 1000 )
	
	// Setup callbacks
	var challenge_button = $('#start_challenge_button')[0];
	challenge_button.onmouseup = on_challenge_button_click;
});

socket.on( 'pong', function(){ console.log( 'pong received' ); } );

socket.on( 'challenge accepted', function( data ){
	if( LOCAL_USER_INFO.state == USER_STATE_CHALLENGE_REQUESTED ){
		console.log( 'challenge accepted' );
		$("#main_page")[0].style.display = "none";
		$("#challenge_page")[0].style.display = "block";
		$("#challenge_answer_input_field")[0].onkeyup = on_challenge_answer_key_pressed;
		$( "#next_question_button" )[0].onmouseup = on_next_question_button_click;
		LOCAL_USER_INFO.state = USER_STATE_IN_CHALLENGE;
	}
	else{
		alert( 'Error. Local user state is not CHALLENGE REQUESTED.' );
	}
} );

socket.on( 'question', function( data ) {
	console.log( 'question received: ' + data );
	
	$( "#next_question_button" )[0].style.display = 'none';
	$( "#challenge_answer_input_field" )[0].style.display = 'block';
	
	$( "#challenge_question_area" )[0].innerHTML = data;
} );

socket.on( 'answer result', function( data ) {
	console.log( 'answer received: ' + data[0] );
	
	$( "#next_question_button" )[0].style.display = 'block';
	
	if( data[0] ){
		$( "#challenge_question_area" )[0].innerHTML = "<h2 \"text-align:center\">Correct!</h2>";
	}
	else{
		$( "#challenge_question_area" )[0].innerHTML = "<h2 \"text-align:center\">Wrong!</h2>";
	}	
} );

function on_challenge_answer_key_pressed( key_event ){
	var code = key_event.keyCode;
	var identifier = key_event.keyIdentifier;
	if( identifier == "Enter" )	{
		console.log( 'Enter pressed !' );
		var answer_obj = $( "#challenge_answer_input_field" )[0];
		var answer = answer_obj.value;
		answer_obj.style.display = 'none';
		
		LOCAL_USER_INFO.socket.emit( 'answer', answer );
	}
	else {
		console.log( "on_challenge_answer_key_pressed( " + code + " );" )
	}
}

function on_challenge_button_click() {
	if( LOCAL_USER_INFO.state == USER_STATE_IDLE ){
		LOCAL_USER_INFO.socket.emit( 'request challenge' );
		LOCAL_USER_INFO.state = USER_STATE_CHALLENGE_REQUESTED;
		
		var challenge_button = $('#start_challenge_button')[0]; // TODO: Check how to disable
		challenge_button.enabled = false;
	}
}

function on_next_question_button_click(){
	if( LOCAL_USER_INFO.state == USER_STATE_IN_CHALLENGE ){
		LOCAL_USER_INFO.socket.emit( 'next question' );
	}
}
