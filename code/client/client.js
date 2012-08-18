var USER_STATE_IDLE = 0;
var USER_STATE_CHALLENGE_REQUESTED = 1;
var USER_STATE_IN_CHALLENGE = 2;

var LOCAL_USER_INFO = {
	state: USER_STATE_IDLE,
	socket: null,
	vkobj: null,
	current_challenge_questions_num: 0,
	current_challenge_question_number: 0
};

VK.init(function() {

	console.log( ' VK=' );
	console.log( VK );
	console.log( '/VK=' );
	//VK.api()
	
	var socket = io.connect();
	
	console.log( "Sent socket io connect request." );
	
	LOCAL_USER_INFO.socket = socket;

	socket.on( 'disconnect', function(){
		console.log( 'Server has disconnected.');
		alert( 'Disconnected from server. Please restart the application.');
		socket.reconnect();
	} );
	
	socket.on('onconnected', function( data ) {
		console.log( 'Connected successfully to the socket.io server. My server side ID is ' + data.id );
		
		LOCAL_USER_INFO.vkobj = data.vkobj;
		
		$("#pre_login")[0].style.display = "none";;
		("#user_name_field")[0].value = data.vkobj.first_name;
		$("#main_page")[0].style.display = "block";
		//setInterval( function(){ socket.emit( 'ping' ); console.log( 'ping sent' ); }, 1000 )
		
		// Setup callbacks
		var challenge_button = $('#start_challenge_button')[0];
		challenge_button.onmouseup = on_challenge_button_click;
		
		var chat_input = $('#chat_box_input')[0];
		chat_input.onkeyup = on_chat_input_key_pressed;
	});
	
	socket.on( 'pong', function(){ console.log( 'pong received' ); } );
	
	socket.on( 'chat message', function( data ){
		var from = data[0];
		var msg = data[1];
		add_chat_message( from, msg );
	});
	
	
	socket.on( 'challenge accepted', function( data ){
		if( LOCAL_USER_INFO.state == USER_STATE_CHALLENGE_REQUESTED ){
			console.log( 'challenge accepted' );
			$("#main_page")[0].style.display = "none";
			$("#challenge_page")[0].style.display = "block";
			$("#challenge_answer_input_field")[0].onkeyup = on_challenge_answer_key_pressed;
			$( "#next_question_button" )[0].onmouseup = on_next_question_button_click;
			$( "#finish_challenge_button" )[0].onmouseup = on_finish_challenge_button_click;
			LOCAL_USER_INFO.state = USER_STATE_IN_CHALLENGE;
			LOCAL_USER_INFO.current_challenge_questions_num = data;
			LOCAL_USER_INFO.current_challenge_question_number = 0;
		}
		else{
			alert( 'Error. Local user state is not CHALLENGE REQUESTED.' );
		}
	} );

	socket.on( 'question', function( data ) {
		console.log( 'question received: ' + data );
		// Disable buttons
		$( "#next_question_button" )[0].style.display = 'none';
		$( "#finish_challenge_button" )[0].style.display = 'none';
		
		// Enable input & show the question
		$( "#challenge_answer_area" )[0].style.display = 'block';
		$( "#challenge_question_area" )[0].innerHTML = data;
		
		LOCAL_USER_INFO.current_challenge_question_number++;
	} );

	socket.on( 'answer result', function( data ) {
		console.log( 'answer received: ' + data[0] );
	
		$("#challenge_answer_input_field")[0].value = '';
		
		if( LOCAL_USER_INFO.current_challenge_question_number == LOCAL_USER_INFO.current_challenge_questions_num ){
			$( "#finish_challenge_button" )[0].style.display = 'block';
		}
		else{
			$( "#next_question_button" )[0].style.display = 'block';
		}
		
		if( data[0] ){
			$( "#challenge_question_area" )[0].innerHTML = "<h2 \"text-align:center\">Correct!</h2>";
		}
		else{
			$( "#challenge_question_area" )[0].innerHTML = "<h2 \"text-align:center\">Wrong!</h2>";
		}	
	} );
});


function add_chat_message( from, msg ){
	var chat_box = $('#chat_box')[0];
	chat_box.innerHTML += ( from.first_name + ": " + msg  + '<br />' );
	chat_box.scrollTop = chat_box.scrollHeight;
}

function on_chat_input_key_pressed( key_event ){
	console.log( arguments.callee.name );
	
	var identifier = key_event.keyIdentifier;
	if( identifier == "Enter" )	{
		var chat_message = $( "#chat_box_input" )[0].value;
		LOCAL_USER_INFO.socket.emit( 'chat message', chat_message );
		$( "#chat_box_input" )[0].value = '';
		add_chat_message( LOCAL_USER_INFO.vkobj, chat_message );
	}
}


function on_challenge_button_click() {
	console.log( arguments.callee.name );
	if( LOCAL_USER_INFO.state == USER_STATE_IDLE ){
		LOCAL_USER_INFO.socket.emit( 'request challenge' );
		LOCAL_USER_INFO.state = USER_STATE_CHALLENGE_REQUESTED;
		
		$('#start_challenge_button')[0].style.display = 'none';
	}
}

function on_next_question_button_click(){
	console.log( arguments.callee.name );
	if( LOCAL_USER_INFO.state == USER_STATE_IN_CHALLENGE ){
		LOCAL_USER_INFO.socket.emit( 'next question' );
	}
}

function on_finish_challenge_button_click(){
	console.log( arguments.callee.name );
	//return back in the main page
	LOCAL_USER_INFO.state = USER_STATE_IDLE;
	LOCAL_USER_INFO.current_challenge_questions_num = 0;
	LOCAL_USER_INFO.current_challenge_question_number = 0;
	
	$("#main_page")[0].style.display = "block";
	$("#challenge_page")[0].style.display = "none";
	$('#start_challenge_button')[0].style.display = 'block';
}


function on_challenge_answer_key_pressed( key_event ){
	console.log( arguments.callee.name );
	
	if( $('#challenge_answer_area')[0].style.display != 'none' ){
		var code = key_event.keyCode;
		var identifier = key_event.keyIdentifier;
		if( identifier == "Enter" )	{
			console.log( 'Enter pressed !' );
			var answer = $( "#challenge_answer_input_field" )[0].value;
			$('#challenge_answer_area')[0].style.display = 'none';
			
			LOCAL_USER_INFO.socket.emit( 'answer', answer );
		}
		else {
			console.log( "on_challenge_answer_key_pressed( " + code + " );" )
		}
	}
	else{
		$('#challenge_answer_area')[0].value = '';
	}
}
