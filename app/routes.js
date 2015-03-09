//app/routes.js

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

	//PROFILE SECTION
	//we will want this protected so you have to be logged in to visit
	//we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res){
		res.render('profile.ejs', {
			user: req.user//get the user out of session and pass to template
		});
	});













	//=================================================
	//VOTING ADMIN-------------------------------------
	//=================================================

	var Voting 				= require('./models/voting');
	var ObjectId 			= require('mongodb').ObjectID;
	var temp_voting_records	= require('./models/DB_votes.js')


	app.get('/voting_list', isLoggedIn, function(req, res){

		Voting.find({},function(err, voting){

			var context = {
				
				voting: voting.map(function(voting){
					return {
						id 			: voting._id,
						title		: voting.title,
						comment		: voting.comment,
						status		: voting.status,
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

			res.render('voting_list.ejs', context);

		})
	});


	//delete mongo file by id
	app.get('/deletion/:id', isLoggedIn, function(req, res){
		Voting.findByIdAndRemove(req.params.id, function (err, doc) {});
		res.redirect('/voting_list');
	});



	app.get('/voting_create_update', isLoggedIn, function(req, res){
		res.render('voting_create_update', {
			user: req.user, //get the user out of session and pass to template
		});
	});

	//edit mongo file
	app.get('/voting_create_update/:id', isLoggedIn, function(req, res){

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


	app.post('/voting_create_update', function(req, res){

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

			res.render('voting_vote', context);
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
	//if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	//if they aren't redirect them to the home page
	res.redirect('/');
}