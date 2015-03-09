//server.js

//set up -------------
// get all the tools we need

var express			= require('express');
var app				= express();
var port			= process.env.PORT || 8080;
var mongoose		= require('mongoose');
var passport		= require('passport');
var flash			= require('connect-flash');

var morgan			= require('morgan');
var cookieParser	= require('cookie-parser');
var bodyParser		= require('body-parser');
var session			= require('express-session');

var configDB		= require('./config/database.js');

var temp_voting_records	= require('./app/models/DB_votes.js')

var io 				= require('socket.io');
var chat_room;

//configuration --------------
mongoose.connect(configDB.url);//connect to db

//gdr-------
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
	//init DB_votes_temp with the values in the db
	temp_voting_records.init_DB_votes_temp();
	//console.log("====== ======== =======");
	//console.log(temp_voting_records.get_voting_temp());
});
//gdr-------

require('./config/passport')(passport); //pass passport for configuration



//set up our express application
app.use(morgan('dev'));//log every request to the console
app.use(cookieParser());//read cookies (needed for auth)
app.use(bodyParser.json()); //get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');//set up ejs for templating

//required for passport
app.use(session({ secret: 'ilovescotch' }));//session secret
app.use(passport.initialize());
app.use(passport.session()); //persistent login session
app.use(flash()); // use connect-flash for flash messages stored in session




//routes ----------
require('./app/routes.js')(app, passport); //load our routes pass in our app and fully configured passport


var server = app.listen(port, function() {
    console.log("server started on port " + port);
});

chat_room 		= io.listen(server);

chat_room.sockets.on('connection', function (socket) {

	socket.emit('entrance', {message: 'Pronto para votar!'});

	socket.emit('lista', temp_voting_records.get_voting_temp());

	socket.on('disconnect', function  () {
		chat_room.sockets.emit('exit', {message: 'Alguien ha dejado de votar.'});
		temp_voting_records.permanent_record_all();
	});

	socket.on('chat', function  (data) {
		chat_room.sockets.emit('chat', {message: '# ' + data.message});
	});

	chat_room.sockets.emit('entrance', {message: 'Un nuevo votante está en línea.'});

	socket.on('incoming_vote', function (data){

		var data_voting = temp_voting_records.process_vote(data.id, data.option);
		var record = temp_voting_records.get_voting(data.id);
		chat_room.sockets.emit('outcoming_vote', record);
		socket.emit('lista', temp_voting_records.get_voting_temp());
		console.log('incoming_vote');
	});
});


console.log('The magic happens on port ' + port);
