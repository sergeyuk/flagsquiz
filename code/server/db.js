var DB = require('mongodb').Db,
	DB_CONNECTION = require('mongodb').Connection,
	DB_SERVER = require('mongodb').Server,
	DB_OBJECT_ID = require('mongodb').ObjectID;

var db = function( db_name, dbhost, dbport ) {
	this.db_name = db_name;
	this.db_host = dbhost || 'localhost';
	this.db_port = dbport || DB_CONNECTION.DEFAULT_PORT;
	
	
	this.create_connection = function(){
		return new DB(this.db_name, new DB_SERVER( this.db_host, this.db_port, {native_parser:true}));
	}
	
	this.create_database = function(){
		console.log( 'openning connection' );
		var db = this.create_connection();
		
		var open_result = db.open( function( err, db ){
			if( err ){
				console.log( 'err:' )
				console.log( err );
				console.log( 'result :' )
				console.log( result );
			}
			
			db.dropDatabase( function( err, result ){
				if( err ) {
					console.log( 'err:' )
					console.log( err );
					console.log( 'result :' )
					//console.log( result );
				}
				db.createCollection( 'users', function( err, collection ){
					if( err ){
						console.log( 'err' );
					}
					console.log( 'Creating database completed' );
					db.close();
				})
			    //db.collection('users', function(err, collection) {      
				
			})			
		})
		
		//console.log( open_result );
	}

	this.load_all_users = function( callback ){
		var db = this.create_connection();
		db.open( function( err, db ){
			db.collection( 'users', function( err, collection ) {
				err && console.log( err );				
			    collection.find({}).toArray( function( err, results ){
			    	err && console.log( err );
			    	db.close();
			    	callback && callback( results );
			    } );				
			});
		});
	}
	
	this.add_user = function( user_obj, callback ){
		var db = this.create_connection();
		db.open( function( err, db ){
			if( err ){
				console.log( 'open for add user. err:' )
				console.log( err );
				console.log( 'result :' )
				console.log( result );
			}
			
			db.collection( 'users', function( err, collection ){
				if( err ){
					console.log( 'get users collection err:' )
					console.log( err );
				}
				
				collection.insert( user_obj );
				db.close();
				
				callback && callback();
			})
		})
		
	}
};


try{
	exports.db = db;
	global.db = db;
}
catch(e){}
