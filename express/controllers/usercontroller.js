var UserModel = require('../models/usermodel');
var userModel = new UserModel();
var path = require('path');
var basePath = path.dirname(require.main.filename);
var uuid = require(basePath + '/node_modules/node-uuid');
var url = require('url');
var fs = require('fs');
var configData = fs.readFileSync(path.dirname(require.main.filename) + '/main.conf', 'utf8');
configData = JSON.parse(configData);






module.exports.controller = function(app) {

	app.get('/user/widget_userForm', function(req, res){
		console.log("/widget_contactsform get");
		res.render('users/widget_userform.jade',
			{
				userId:req.cookies.userId,
				deviceId:"815",//req.cookies.deviceId,
				URL:configData.domain.address + ":" + configData.domain.port,
				androidAppRoute:configData.androidAppRoute,
				webSocketClient:configData.webSocketClient,
				defaultUserImageUrl:configData.defaultUserImageUrl,
				defaultMemberImageUrl:configData.defaultMemberImageUrl,
				data:
					{
					}
			}
		);
	});


	app.post('/user/widget_userForm', function(req, res){
		console.log("/widget_contactsform post");
		res.render('users/widget_userform.jade',req.body);
	});

	

	app.get('/user/mobileLogin', function(req, res){
		console.log("/user/mobileLogin get");
		res.render('users/mobilelogin.jade',req.body);
	});

	app.post('/user/mobileLogin', function(req, res){
		console.log("/user/mobileLogin post");
		//res.render('users/mobilelogin.jade',req.body);
		userModel.verifyAndGetUserData(
			{
				userName:req.body.userName,
				password:req.body.password,
				onSuccess:function(inRecord){
					req.body.userId = inRecord.id;
					//req.cookies.userId = inRecord.id;
					res.cookie('userId', inRecord.id, { maxAge: (60000 * 60 * 24), httpOnly: true });
					userModel.useOrCreateDeviceId(req.body, function(err, inJsonStruct){
						console.log('useOrCreateDeviceId');
						console.log('error' + err);
						console.dir(inJsonStruct);

						inRecord.validDeviceId = inJsonStruct.valid;
						inRecord.useDeviceId = inJsonStruct.useDeviceId;
						res.setHeader('Content-Type', 'application/json');
						res.end(JSON.stringify(
							{
								hadError:((err)? true : false),
								err:err,
								result:inRecord
							}
						));
					});

				},
				onFail:function(inErr){
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify(
						{
							hadError:true,
							err:inErr,
							result:false
						}
					));
				}
			}
		);




			/*res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(
				{
					hadError:((err)? true : false),
					err:err,
					result:result
				}
			));*/
	});


	app.get('/users/checkemail', function(req, res){
		console.log("/users/checkemail get");
		res.render('users/checkemail.jade',req.body);
	});

	app.post('/users/checkemail', function(req, res){
		console.log("/users/checkemail post");
		res.render('users/checkemail.jade',req.body);
	});

	app.post('/user/database/addUser', function(req, res){
		console.log("/database/addUser post");
		if(!(req.body)){return false;}
		//set activate code
		req.body.activateCode = uuid.v1();
		userModel.dbAddUserAccountDataToUserTable(req.body, function(err, result){
			//send activate email------
			console.log('callback from db in controller');
			if(!(err)){
				if(result){
					if(result.insertId){
						console.log('id:' + result.insertId);
						console.log('emailAddress:' + req.body.emailAddress);
						console.log('activateCode:' + req.body.activateCode);
						if(req.body.emailAddress && req.body.activateCode){
							console.log('sending email');
							userModel.sendMailActivateCode(req.body.emailAddress, req.body.activateCode, result.insertId);
							//res.render('users/checkemail.jade');
							res.setHeader('Content-Type', 'application/json');
							res.end(JSON.stringify(
								{
									hadError:((err)? true : false),
									err:err,
									result:
										{
											newUserId:result.insertId
										}
								}
							));
							return;
						}
					}
				}
			}
			console.log('returning info');
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(
				{
					hadError:((err)? true : false),
					err:err,
					result:result
				}
			));
		});
	});

	app.get('/user/activateAccount', function(req, res){
		var queryObject = url.parse(req.url,true).query;
		console.dir(queryObject);
		console.log("enableAccount");

		userModel.activateUserAccount(queryObject, function(err, result){
			if(!(err)){
				res.render('users/checkaccount.jade',
					{
						data:
							{
								activated:true
							}
					}
				);
			}else{
				res.render('users/checkaccount.jade',
					{
								activated:false
					}
				);
			}
		});

	});

	/*app.get('/user/checkAccount', function(req, res){
		var queryObject = url.parse(req.url,true).query;
		console.dir(queryObject);
		console.log("enableAccount");
		res.render('users/checkaccount.jade',
			{
						activated:true
			}
		);
	});*/

	app.get('/user/checkemail', function(req, res){
		var queryObject = url.parse(req.url,true).query;
		console.dir(queryObject);
		console.log("enableAccount");
		res.render('users/checkemail.jade',
			{
				data:
					{
						activated:true
					}
			}
		);
	});


	app.get('/user/userNameExist', function(req, res){
		var queryObject = url.parse(req.url,true).query;
		console.dir(queryObject);
		console.log("enableAccount");

		if(queryObject){
			if(queryObject.userName){
				userModel.userNameExist(queryObject.userName,function(err, result){
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify(
						{
							hadError:((err)? true : false),
							err:err,
							result:result
						}
					));
				});
				return;
			}
		}

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(
				{
					hadError:true,
					err:"ERROR BAD QUERY STRING",
					result:{}
				}
		));
	});

	app.post('/user/userNameExist', function(req, res){
		if(req.body){
			if(req.body.userName){
				userModel.userNameExist(req.body.userName,function(err, result){
					res.setHeader('Content-Type', 'application/json');
					res.end(JSON.stringify(
						{
							hadError:((err)? true : false),
							err:err,
							result:result
						}
					));
				});
				return;
			}
		}

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(
			{
				hadError:true,
				err:"ERROR no User Name or BAD body in header!!",
				result:{}
			}
		));
	});

	app.get('/jqm/userprofile', function(req, res){
		if(req.cookies.userId){
			console.log("/jqm/userprofile");


			userModel.getUserById({userId:req.cookies.userId}, function(err, result){
				res.render('users/userprofile.jqm.jade',
					{
						userId:req.cookies.userId,
						deviceId:"815",//req.cookies.deviceId,
						URL:configData.domain.address + ":" + configData.domain.port,
						androidAppRoute:configData.androidAppRoute,
						webSocketClient:configData.webSocketClient,
						defaultUserImageUrl:configData.defaultUserImageUrl,
						defaultMemberImageUrl:configData.defaultMemberImageUrl,
						data:result[0],
					}
				);
				/*res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(
					{
						hadError:((err)? true : false),
						err:err,
						result:result
					}
				));*/
			});

		}else{
			//============================================================
			//YOUR NOT LOGED IN ------------------------------------------
			//============================================================
			console.log("/jqm/contactmangaer    YOUR NOT LOGED IN????");
			/*res.render('contacts/widget_contactscollection.jade',
				{

				}
			);*/
		}
	});

	app.post('/database/updateUser', function(req, res){
		console.log("/database/updateUser post");
		//res.render('contacts/addcontact.jade',req.body);
		console.log('---------userId---------------------------------:' +  req.cookies.userId);
		req.body['userId'] = req.cookies.userId;
		userModel.updateUser(req.body, function(err, result){
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(
				{
					hadError:((err)? true : false),
					err:err,
					result:result
				}
			));
		});
		res.setHeader('Content-Type', 'application/json');
	});

	app.post('/database/deleteAllForUser', function(req, res){
		console.log("/database/deleteAllForUser post");
		console.log('---------userId---------------------------------:' +  req.cookies.userId);
		req.body['userId'] = req.cookies.userId;
		userModel.deleteAllForUser(req.body, function(err, result){
			res.setHeader('Content-Type', 'application/json');
			res.end(JSON.stringify(
				{
					hadError:((err)? true : false),
					err:err,
					result:result
				}
			));
		});
		res.setHeader('Content-Type', 'application/json');
	});


}