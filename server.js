var gameport        = 8000,
    io              = require('socket.io'),
    express         = require('express'),
    vkapi			= require( './js/vksdk.js'),
    app             = express(),
    querystring 	= require( 'querystring' ),
    quiz_db_class	= require( './code/server/db.js' ).db,
    should_create_game_world = true;

var quiz_db = new quiz_db_class( "football_logo_quiz_db" );

var USER_STATE_IDLE = 0;
var USER_STATE_CHALLENGE_REQUESTED = 1;
var USER_STATE_IN_CHALLENGE = 2;


var SERVER_USER_CLASS = function( id ){
	this.id = id;
	this.state = USER_STATE_IDLE;
	this.last_question_asked = 0;
	this.correct_answer = 0;
};

var SERVER = {
	users : {}, // a copy of db data
	connected_users : {}
	
};

if( should_create_game_world ){
	quiz_db.create_database();
	//quiz_db.add_user( { id: '734', name: "serg" } )
	//quiz_db.add_user( { id: '735', name: "nata" } )
	//quiz_db.add_user( { id: '736', name: "sasha" } )
	
}else
{

// vk-specific stuff;
vkapi.init('2344570', 'sDqG6BNcDeIdLkytRzSo');

quiz_db.load_all_users( function( users ) {
	console.log( 'users: ' );
	console.log( users );
} );


app.get( '/', function( req, res ){
    res.sendfile( __dirname + '/index.html' );
});

app.get( '/*' , function( req, res, next ) {
    var file = req.params[0]; 
    console.log('\t :: Express :: file requested : ' + file);
    res.sendfile( __dirname + '/' + file );
});
    
var sio = io.listen( app.listen( gameport ) );
console.log('\t :: Express :: Listening on port ' + gameport );

sio.configure(function (){
  sio.set('authorization', function (handshakeData, callback) {
  	if( handshakeData && handshakeData.headers && handshakeData.headers.referer ){
	  	var obj = querystring.parse( handshakeData.headers.referer )
	  	handshakeData.user_id = obj.viewer_id;
	  	console.log( 'Authorised user ' + obj.user_id );
	  	callback(null, true); // error first callback style
  	}
  	else{
  		console.log( 'Authorisation failed' );
  		callback(null, false); // error first callback style
  	}
  });
});

sio.sockets.on('connection', function (client) {
	var user_id = client.handshake.user_id;
    client.userid = user_id;
    client.user = new SERVER_USER_CLASS( client.userid );

	if( !SERVER.users.hasOwnProperty( user_id ) ){
		quiz_db.add_user( client.user )
	}

	vkapi.request('getProfiles', {'uids' : client.userid}, function(response) {
			client.vk_object = response.response[0];
			console.log( 'User connected:' );
	        //console.log(response);
	        
	        client.emit('onconnected', { id: client.userid, vkobj: client.vk_object} );
			console.log('\t socket.io:: player ' + client.userid + ' connected');
    
	});
    
    
    client.on('disconnect', function () {
		console.log('\t socket.io:: client disconnected ' + client.userid );
    });
    
    client.on( 'ping', function(){ client.emit( 'pong' ); } );
    
    client.on( 'request challenge', function() {
    	if( client.user.state == USER_STATE_IDLE ){
	    	accept_challenge( client, TOTAL_QUESTIONS );	
	    	send_question( client, 1 );
    	}
    	else{
    		console.log( "Error challenge request. The user " + client.user.id + " is not in IDLE state." );
    	}
    });
    
    client.on( 'answer', function( data ){
    	var user = client.user;
    	if( user.state == USER_STATE_IN_CHALLENGE ){
    		handle_answer( client, data );
    	}
    	else{
    		console.log( "Error answer request. The user " + user.id + " is not in challenge." );
    	}
    });
    
    client.on( 'next question', function(){
    	if( client.user.state == USER_STATE_IN_CHALLENGE ){
    		send_question( client, client.user.last_question_asked + 1 );
    	}
    } );
    
    client.on( 'chat message', function( msg ){
    	console.log( 'chat message from ' + client.userid + ': ' + msg)
    	client.broadcast.emit( 'chat message', [client.vk_object, msg]);
    });
}); 

function handle_answer( socket, answer ){
	
	answer = answer.toLowerCase();
	
	var user = socket.user;
	var question_id = user.last_question_asked;
	
	if( QUESTIONS.hasOwnProperty( question_id ) ){
		var correct = false;
		var answers = QUESTIONS[question_id][1];
		for( var i = 0, e = answers.length; i < e; i++ ){
			console.log( '\"' + answer + '\".indexOf( \"' + answers[i] + '\") = ' + answer.indexOf( answers[i] ) );
			if( answer.indexOf( answers[i] ) != -1 ){
				correct = true;
				break;
			}
		}
		
		socket.emit( 'answer result', [correct] );
		
		if( question_id == TOTAL_QUESTIONS ){
			user.state = USER_STATE_IDLE;
		}
	}	
	else{
		console.log( "Error in handle_answer. User " + user.id + " wasn't asked any questions." );
	}
}

function accept_challenge( socket, total ){
	var user = socket.user;
	user.state = USER_STATE_IN_CHALLENGE;
	socket.emit( 'challenge accepted', total );
}

function send_question( socket, question_id ){
	var user = socket.user;
	if( user.state == USER_STATE_IN_CHALLENGE ){
		var question = QUESTIONS[question_id];
		socket.emit( 'question', "<img src=\"images\\" + question[0] + "\">" );
		user.last_question_asked = question_id;
	}
	else{
		console.log( "Error in send_question. The user " + user.id + " is not in challenge." );
	}
}
}