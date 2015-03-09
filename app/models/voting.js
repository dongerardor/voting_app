//app/models/voting.js

//load the things we need
var mongoose = require('mongoose');

//define the schema for our user model
var votingSchema = mongoose.Schema({
	title		: String,
	comment		: String,
	status		: String,
	optionA		: String,
	optionB		: String,
	result_a	: Number,
	result_b 	: Number,
	date_open	: Date,
	date_close  : Date
});

// create the model for voting and expose it to our app
module.exports = mongoose.model('Voting', votingSchema);