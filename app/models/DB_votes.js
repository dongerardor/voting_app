//app/models/DB_votes_temp.js

var exports = module.exports = {};

var DB_votes_temp = [];// aqui guardamos todos los datos de la votacion

var Voting 				= require('./voting');
var ObjectId 			= require('mongodb').ObjectID;

var date_recorded_vote = Date.now();

function check_exists_voting(id_voting){//busca si existe esa votacion
	var exists = false;
	for (var i = 0; i < DB_votes_temp.length; i++){
		if(DB_votes_temp[i] !== undefined){
			if (DB_votes_temp[i].id 	== id_voting){
				exists = true;
			}
		}
	}
	return exists;
}

function create_voting_record (id){//creo el registro
	var voting_record = {'id': id, 'a': 0, 'b': 0};//init obj_voting

	DB_votes_temp.push(voting_record);

	return voting_record;

}

function get_voting_record(id){
	var voting_record;
	for (var i = 0; i < DB_votes_temp.length; i++){
		if(DB_votes_temp[i] !== undefined){
			if (DB_votes_temp[i].id 	== id){
				voting_record = DB_votes_temp[i];
			}
		}
	}
	return voting_record;
}

function add_vote(voting_record, option){
	voting_record[option]++;//sumo uno a la opcion votada
	permanent_record_vote_timer(voting_record);
	return voting_record;
}


function permanent_record_vote_timer(record){

	//guardo los votos en Mongo cada 10 segundos
    var now = Date.now();
    var then = date_recorded_vote;
    var wait = 10000;

    if (now > (then + wait)){
    	date_recorded_vote = now;

    	permanent_record_vote(record);
    }
}


function permanent_record_vote(record){

    var o_id = new ObjectId(record.id);

	Voting.update(
		{ 	_id			: o_id },
		{	
			result_a	: record.a,
			result_b	: record.b
	   	},
		{ 	upsert 		: true },
		function(err){
			if(err) { console.error(err.stack);
				req.session.flash = {
	                type: 'danger',
	                intro: 'Ooops!',
	                message: 'There was an error processing your request.',
				};
				return;
			}
		}
	);
}





//update DB_votes_temp from DB
exports.init_DB_votes_temp = function(){

	var arr_db = [];

	Voting.find({},function(err, voting){

		arr_db = voting.map(function(voting){
			return {
				"id"	: String(voting._id),
				"a"		: voting.result_a,
				"b"		: voting.result_b,
			}
		});
		
		DB_votes_temp = arr_db;
	})
}


//pass the entire temp DB to mongo
exports.permanent_record_all = function(){
	for (var i = 0; i < DB_votes_temp.length; i++){
		permanent_record_vote(DB_votes_temp[i]);
	}
}

//process one vote
exports.process_vote = function (id, option){

	//compruebo si existe el registro de este id
	var exists_voting = check_exists_voting(id);

	var voting_record;

	var voting_record_updated

	//si no existe, lo creo
	if (!exists_voting){
		voting_record = create_voting_record(id);
	}else{
		voting_record = get_voting_record(id);
	}

	voting_record_updated = add_vote (voting_record, option);

	return voting_record_updated;

}

exports.get_voting = function(id){
	return get_voting_record(id);
}

exports.get_voting_temp = function(){

	return DB_votes_temp;
}