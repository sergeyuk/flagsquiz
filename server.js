var QUESTIONS = {
	1: ["1.jpg", ["Arsenal", "Gunners", "arsenal"] ],
	2: ["2.jpg", ["Liverpool", "liverpool"]]
};

var USER_STATE_IDLE = 0;
var USER_STATE_CHALLENGE_REQUESTED = 1;
var USER_STATE_IN_CHALLENGE = 2;

var SERVER_USER_CLASS = function( id ){
	this.id = id;
	this.state = USER_STATE_IDLE;
	this.last_question_asked = 0;
};

var USERS_DATA = {
	
};

var gameport        = process.env.PORT || 8000,
    io              = require('socket.io'),
    express         = require('express'),
    UUID            = require('node-uuid'),
    app             = express.createServer();

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
    sio.set('log level', 0);
    sio.set('authorization', function (handshakeData, callback) {
      callback(null, true); // error first callback style 
    });
});

sio.sockets.on('connection', function (client) {
    client.userid = UUID();
    USERS_DATA[client.userid] = new SERVER_USER_CLASS( client.userid );
    USERS_DATA[client.userid].socket = client;
    client.user = USERS_DATA[client.userid];
    
    client.emit('onconnected', { id: client.userid } );
	console.log('\t socket.io:: player ' + client.userid + ' connected');
    
    client.on('disconnect', function () {
		console.log('\t socket.io:: client disconnected ' + client.userid );
    });
    
    client.on( 'ping', function(){ client.emit( 'pong' ); } );
    
    client.on( 'request challenge', function() {
    	if( client.user.state == USER_STATE_IDLE ){
	    	accept_challenge( client, 2 );	
	    	send_question( client, 1 );
    	}
    	else{
    		console.log( "Error challenge request. The user " + socket.user.id + " is not in IDLE state." );
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
}); 

function handle_answer( socket, answer ){
	var user = socket.user;
	var question_id = user.last_question_asked;
	
	if( QUESTIONS.hasOwnProperty( question_id ) ){
		var correct = false;
		var answers = QUESTIONS[question_id][1];
		for( var i = 0, e = answers.length; i < e; i++ ){
			if( answers[i] == answer ){
				correct = true;
				break;
			}
		}
		
		socket.emit( 'answer result', [correct] );
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


/*var     gameport        = process.env.PORT || 4004,
        io              = require('socket.io'),
        express         = require('express'),
        UUID            = require('node-uuid'),
        verbose         = false,
        app             = express.createServer();
        
var Db = require('mongodb').Db,
	Connection = require('mongodb').Connection,
	Server = require('mongodb').Server,
	ObjectID = require('mongodb').ObjectID;
    
app.listen( gameport );
console.log('\t :: Express :: Listening on port ' + gameport );

        //By default, we forward the / path to index.html automatically.
    app.get( '/', function( req, res ){ 
        res.sendfile( __dirname + '/index.html' );
    });

    app.get( '/*' , function( req, res, next ) {
        //This is the current file they have requested
        var file = req.params[0]; 
        if(verbose) console.log('\t :: Express :: file requested : ' + file);
        res.sendfile( __dirname + '/' + file );
    });

        
    var sio = io.listen(app);
    sio.configure(function (){
        sio.set('log level', 0);

        sio.set('authorization', function (handshakeData, callback) {
          callback(null, true); 
        });
    });


var USER = function( user_id ){
	this.user_id = user_id;
};

var GAME_DATA = {
	online_users : {}
};


sio.sockets.on('connection', function (client) {
	var user = new USER( UUID() );
    client.user = user;
    online_users[user.userid] = user;
    
    client.emit('initial data', { id: client.userid } );
    //client.emit( 'change page', )
    console.log('\t socket.io:: player ' + client.userid + ' connected');
    
    client.on('disconnect', function () {
        console.log('\t socket.io:: client disconnected ' + client.userid );
    });
}); //sio.sockets.on connection

var dbhost = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var dbport = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

console.log("Connecting to mongodb: " + dbhost + ":" + dbport);

	
    var db_connection = new Db('football_logo_quiz_db', new Server("127.0.0.1", 27017, {}));
    /*db_connection.open( function( error_code ){
    	db_connection.collection( 'users', function( error_code, collection ){
    		collection.insert( {_id:7, user_name:"Sergey", score:10}, function(){
    			db_connection.close();
    			console.log( 'Finished inserting. Connection closed.' );
    		} );    		
    	} );
    } );
    */
   
    /**
    db_connection.open( function( error_code ){
    	db_connection.collection( 'users', function( error_code, collection ){
   		    collection.find({user_name:"Sergey"}, function(err, cursor){
		    	cursor.toArray(function(err, items) {
					console.log('Found a user.');
					//console.log( items );
					var user = items[0];
					console.log( user );
					user.score = 30;
					collection.update( {user_name:"Sergey"}, user, {safe:true}, function(){
						// Let's close the db
						console.log( 'done' );
						db_connection.close();
					} );
	          	});
   		    })  // ok
   		    ******/
/*
			collection.findOne( {_id: new ObjectID(7)}, function( found_user ){
				console.log('Found a user: ');
				console.log( found_user );
				
			});*/
			/****
    	} );
    } );******/
    
    
    
    /*,
        test = function (err, collection) {
          collection.insert({user_id:7, user_name:"Sergey", data1:2345}, function(err, docs) {

            collection.count(function(err, count) {
              //test.assertEquals(1, count);
              console.log( 'Totally elements in the collection: ' + count );
            });

            // Locate all the entries using find
            collection.find().toArray(function(err, results) {
              //test.assertEquals(1, results.length);
              //test.assertTrue(results[0].a === 2);
				console.log( results );
              // Let's close the db
              client.close();
            });
          });
        };

    client.open(function(err, p_client) {
      client.collection('test_insert', test);
    });*/

/*
var db = new Db('football_logo_quiz_db', new Server(dbhost, dbport, {}), {native_parser:true});
db.open(function(err, db) {
	db.dropDatabase(function(err, result) {
    db.collection('football_logo_quiz_collection', function(err, collection) {      
      // Erase all records from the collection, if any
      collection.remove({}, function(err, result) {
        // Insert 3 records
        for(var i = 0; i < 3; i++) {
          collection.insert({'football_logo_quiz_collection_item':i});
        }
        
        collection.count(function(err, count) {
          console.log("There are " + count + " records in the football_logo_quiz_collection_items. Here they are:");

          collection.find(function(err, cursor) {
            cursor.each(function(err, item) {
              if(item != null) {
                console.dir(item);
                console.log("created at " + new Date(item._id.generationTime) + "\n")
              }
              // Null signifies end of iterator
              if(item == null) {                
                // Destory the collection
                collection.drop(function(err, collection) {
                  db.close();
                });
              }
            });
          });          
        });
      });      
    });
  });
});*/