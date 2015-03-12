//app/routes.js
var Voting 				= require('./models/voting');
var ObjectId 			= require('mongodb').ObjectID;
var temp_voting_records	= require('./models/DB_votes.js')
var Users 				= require('./models/user.js');





module.exports = function(app, passport){
	//HOME (with login links)
	app.get('/', function(req, res){
		res.render('index.ejs');//load the index.ejs file
	});

	//LOGIN==============
	//show the login form
	app.get('/login', function(req, res){
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});
	//process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/voting_list',//redirect to the voting list
		failureRedirect : '/login', // redirect back to the signup page if theres is an error
		failureFlash : true // allow flash messages
	}));


	//SIGNUP==============
	//show the signup form
	app.get('/signup', function(req, res){
		//render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	})

	//process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/voting_list',//redirect to the voting list
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash	: true // allow flash messages
	}));


	//=================================================
	//USERS ADMIN-------------------------------------
	//=================================================

	app.get('/users_list', allowOwner, function(req, res){

		Users.find({}, function(err, users){

			for (var i in users){
				//console.log(users[i].local);
			}
			
			var context = {
				users: users.map(function(user){
					return {
						user_id 	: user._id,
						user_email	: user.local.email,
						user_role	: user.role
					}
				})	
			};

			context.user = req.user;  //get the user out of session and pass to template

			res.render('users_list.ejs', context);
		})
	});


	//delete user in mongo file by id
	app.get('/user_delete/:id', allowOwner, function(req, res){
		Users.findByIdAndRemove(req.params.id, function (err, doc) {});

		res.redirect('/users_list');
	});



	app.get('/user_promote/:id', allowOwner, function(req, res){
		
		var o_id = new ObjectId(req.params.id);

		Users.update(
		{ 	_id			: o_id     	},
		{	role 		: "leader" 	},
			function(err){
				if(err) { 
					console.error(err.stack);
					return;
				}
			}
		);

		res.redirect('/users_list');
	});












	//=================================================
	//VOTING ADMIN-------------------------------------
	//=================================================


	app.get('/voting_list', isLoggedIn, function(req, res, next){

		//set the string for "status" of the voting
		function get_status(status){
			var str_status = "--";
			switch (status){
				case "0":
					str_status = "Esperando";
					break;
				case "1":
					str_status = "En proceso";
					break;
				case "2":
					str_status = "Cerrada";
					break;
				default:
					str_status = "Sin definir";
					break;
			}
			return str_status;
		}


		Voting.find({},function(err, voting){

			var context = {
				voting: voting.map(function(voting){
					return {
						id 			: voting._id,
						title		: voting.title,
						comment		: voting.comment,
						status		: get_status(voting.status),
						optionA		: voting.optionA,
						optionB		: voting.optionB,
						result_a	: voting.result_a,
						result_b	: voting.result_b,
						date_open	: voting.date_open,
						date_close	: voting.date_close
					}
				})	
			};

			context.user = req.user;  //get the user out of session and pass to template

			console.log("----");
			console.log(req.user.role);

			if (req.user.role == 'owner' || req.user.role == 'leader' ){
				res.render('voting_list.ejs', context);
			}else{
				res.render('voting_list_voter.ejs', context);
			}
			

		})
	});
	
	app.get('/voting_list', isLoggedIn, function(req, res){
		res.render('tirar.ejs');
	});







	//delete mongo file by id
	app.get('/deletion/:id', allowLeader, function(req, res){
		Voting.findByIdAndRemove(req.params.id, function (err, doc) {});

		temp_voting_records.delete_voting_record_temp(req.params.id);
		//update 
		res.redirect('/voting_list');
	});



	app.get('/voting_create_update', allowLeader, function(req, res){
		res.render('voting_create_update', {
			user: req.user, //get the user out of session and pass to template
		});
	});

	//edit mongo file
	app.get('/voting_create_update/:id', allowLeader, function(req, res){

		var o_id = new ObjectId(req.params.id);

		Voting.find({'_id': o_id}, function(err, voting){

			var context = {
				id 			: voting[0]._id,
				title		: voting[0].title,
				comment		: voting[0].comment,
				status		: voting[0].status,
				optionA		: voting[0].optionA,
				optionB		: voting[0].optionB,
				result_a	: voting[0].result_a,
				result_b	: voting[0].result_b,
				date_open	: new Date(voting[0].date_open).toISOString().substring(0, 10),
				date_close	: new Date(voting[0].date_close).toISOString().substring(0, 10),
				user		: req.user,	
			}

			res.render('voting_create_update', context);
		});
	});


	app.post('/voting_create_update', allowLeader, function(req, res){

		var o_id;

		if (req.body.id_file != ''){
			o_id = new ObjectId(req.body.id_file);
		}else{
			o_id = new ObjectId();
		}

		Voting.update(
			{ 	_id			: o_id },
			{	
		    	title		: req.body.title,
				comment 	: req.body.comment,
				status		: req.body.status,
				optionA		: req.body.optionA,
				optionB		: req.body.optionB,
				result_a	: 0,
				result_b	: 0,
				date_open	: new Date(req.body.dateOpen),
				date_close	: new Date(req.body.dateClose)
		   	},
			{ 	upsert 		: true },
			function(err){
				if(err) { console.error(err.stack);
					req.session.flash = {
		                type: 'danger',
		                intro: 'Ooops!',
		                message: 'There was an error processing your request.',
					};
					return res.redirect(303, '/voting_list');
				}

				req.session.flash = {
		            type: 'success',
		            intro: 'Thank you!',
		            message: 'You will be notified when this vacation is in season.',
		        };

				res.redirect(303, '/voting_list');
			}
		);
	});

	



	//=================================================
	//VOTE IO-------------------------------------
	//=================================================

	app.get('/voting_vote/:id', isLoggedIn, function(req, res){

		var o_id = new ObjectId(req.params.id);

		Voting.find({'_id': o_id}, function(err, voting){

			var context = {
				id 			: voting[0]._id,
				title		: voting[0].title,
				comment		: voting[0].comment,
				status		: voting[0].status,
				optionA		: voting[0].optionA,
				optionB		: voting[0].optionB,
				result_a	: voting[0].result_a,
				result_b	: voting[0].result_b,
				date_open	: new Date(voting[0].date_open).toISOString().substring(0, 10),
				date_close	: new Date(voting[0].date_close).toISOString().substring(0, 10),
				user		: req.user,	
			}

			var date_now = new Date();
			var date_open = new Date(context.date_open);
			var date_close = new Date(context.date_close);

			if (date_now < date_open){
				console.log("votacion aun no abierta");
			}else if(date_now > date_close){
				console.log("votacion cerrada");
			}else{
				res.render('voting_vote', context);
			}
		});
	});



	//LOGOUT
	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});

	//show the login form
	app.get('/error', function(req, res){
		res.render('error.ejs');
	});



};


//route middleware to make sure a user is logged in
function isLoggedIn(req, res, next){

	if (req.isAuthenticated()){
		//if user is authenticated in the session, carry on
		return next();	
	}

	//if they aren't, redirect them to the home page
	res.redirect('/');
}

//route middleware to make sure a user is logged in
function allowOwner(req, res, next){

	//if user is authenticated in the session, and...
	if (req.isAuthenticated()){
		//...is an owner, carry on
		if (req.user.role == 'owner'){
			return next();
		}
	}

	//if they aren't redirect them to the home page
	res.redirect('/');
}

//route middleware to make sure a user is logged in
function allowLeader(req, res, next){

	//if user is authenticated in the session, and...
	if (req.isAuthenticated()){
		//...is an owner or leader, carry on
		if (req.user.role == 'owner' || req.user.role == 'leader' ){
			return next();
		}
	}
	//if they aren't redirect them to the home page
	res.redirect('/');
}

