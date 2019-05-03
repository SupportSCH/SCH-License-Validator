var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var path = require('path');
var User = require('./models/user');
var TransSourceModel = require('./models/trans_source');
var AppModel = require('./models/app_master');
var CustomerModel = require('./models/customer_master');
var LicenseModel = require('./models/license_manager');
var DataSourcesModel = require('./models/data_source');
var NotiModel = require('./models/notifications');
var external = require('./external_db');
var helpers = require('./helpers');
var bcrypt = require('bcrypt');
const fs = require('fs');
const cipher = require('./cipher');
var schedule = require('node-schedule');
const mac_id = require('node-machine-id');
var emailer = require('./emailer');

User.prototype.verifyPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// invoke an instance of express application.
var app = express();
// set our application port
//app.set('port', 9001);

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({
  extended: true
}));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', './public/validator_html');

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

app.use('/assets', express.static(__dirname + '/public/assets'));
app.use(express.static(__dirname + '/public/validator_html'));

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
  key: 'user_sid',
  secret: 'somerandonstuffs',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 600000
  }
}));

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 5)];
rule.hour = 10;
rule.minute = 01;

var j = schedule.scheduleJob(rule, function () {
  console.log('Today is recognized by kavi !');
  var options = {
    to: 'kavimukila@eimsolutions.com'
  }

  emailer.sendLicenseMail(options);
});


// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie('user_sid');
  }
  next();
});


// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {

  if (req.session.user && req.cookies.user_sid) {
    res.redirect('/dashboard');
  } else {
    next();
  }
};


// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
  res.sendFile(__dirname + '/public/validator_html/index.html');
});

app.get('license_validator', (req, res) => {
  res.sendFile(__dirname + '/public/validator_html/index.html');
});

app.get('/lic_validator', (req, res) => {
  res.sendFile(__dirname + '/public/license-list.html');
});


// route for user signup
// app.route('/signup')
//   .get(sessionChecker, (req, res) => {
//     res.sendFile(__dirname + '/public/signup.html');
//   })
//   .post((req, res) => {
//     User.create({
//         username: req.body.username,
//         email: req.body.email,
//         password: req.body.password
//       })
//       .then(user => {
//         req.session.user = user.dataValues;
//         res.redirect('/dashboard');
//       })
//       .catch(error => {
//         res.redirect('/signup');
//       });
//   });


// route for user Login
app.route('/login')
  .get(sessionChecker, (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
  })
  .post((req, res) => {
    var username = req.body.username,
      password = req.body.password;

    User.findOne({
      where: {
        username: username
      }
    }).then(function (user) {
      console.log("verification: " + user.verifyPassword(password));
      if (!user) {
        res.redirect('/login');
      } else if (!user.verifyPassword(password)) {
        res.redirect('/login');
      } else {
        req.session.user = user.dataValues;
        res.redirect('/dashboard');
      }
    });
  });


// route for user's dashboard
app.get('/dashboard', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + '/public/dashboard.html');
  } else {
    res.redirect('/login');
  }
});

// route for user's License
app.get('/license', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.sendFile(__dirname + '/public/license.html');
  } else {
    res.redirect('/login');
  }
});

app.post('/create_license', async (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    var machine_id = mac_id.machineIdSync({
      original: true
    });
    req.body.machine_id = machine_id;
    var start_time = new Date(req.body.start_time).getTime();
    var end_time = new Date(req.body.end_time).getTime();
    req.body.start_time = start_time / 1000;
    req.body.end_time = end_time / 1000;
    var text = cipher.encrypt(JSON.stringify(req.body));
    fs.writeFile('public/eim_issued.lic', text, (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;

      fs.readFile('public/eim_issued.lic', 'utf8', function (err, data) {
        if (err) throw err;
        console.log(cipher.decrypt(data));
      });

      var filePath = 'public/eim_issued.lic';
      fs.exists(filePath, function (exists) {
        if (exists) {
          // Content-type is very interesting part that guarantee that
          // Web browser will handle response in an appropriate manner.
          res.writeHead(200, {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": "attachment; filename=" + 'license.lic'
          });
          fs.createReadStream(filePath).pipe(res);
        } else {
          res.writeHead(400, {
            "Content-Type": "text/plain"
          });
          res.end("Unable to generate license");
        }
      });
    });
  } else {
    res.redirect('/login');
  }
});

app.post('/license_validator/api/install_license', async (req, res) => {
  var response = {
    status: false,
    message: 'Invalid License'
  };

  if (req.body.hasOwnProperty('license')) {
    var license_data = req.body.license;
    if (license_data) {
      var license_obj = JSON.parse(cipher.decrypt(license_data));
      console.log(license_obj);
      var request_array = Object.keys(license_obj);
      //console.log(request_array);
      var required_array = ['application_id', 'application_name', 'customer_id', 'customer_name', 'start_time', 'end_time', 'no_of_users', 'grace_period'];
      var check_array_equals = helpers.arraysEqual(request_array, required_array);
      if (check_array_equals) {
        var app_exists = await helpers.getAppByAppId(license_obj.application_id).then(async (application) => {
          if (application) {
            return await helpers.getCustomerByCustId(license_obj.customer_id).then(customer_id => {
              if (customer_id) {
                return true;
              } else return false;
            });
          } else {
            return false;
          }
        });

        console.log("app exists ? ");
        console.log(app_exists);

        if (app_exists) {
          var upsert = {
            app_id: license_obj.application_id,
            cust_id: license_obj.customer_id,
            no_of_users: license_obj.no_of_users,
            grace_period: license_obj.grace_period,
            license_start: helpers.formatMysqlDate(license_obj.start_time),
            license_end: helpers.formatMysqlDate(license_obj.end_time),
            license_key: license_data
          };

          console.log(upsert);
          var match = {
            app_id: license_obj.application_id,
            cust_id: license_obj.customer_id
          };

          helpers.Upsert(upsert, match).then(function (status) {
            if (status) {
              response.message = "License Applied Successfully";
              response.status = true;
              response.decrypt = license_obj;
              res.end(JSON.stringify(response));
            } else {
              response.message = "Application is not created in the database";
              res.end(JSON.stringify(response));
            }
          });
        } else {
          response.message = "Application or Customer details doesn't exists";
          res.end(JSON.stringify(response));
        }
      } else {
        response.message = "License file is corrupted";
        res.end(JSON.stringify(response));
      }
    } else {
      response.message = "License file is empty";
      res.end(JSON.stringify(response));
    }
  } else {
    res.end(JSON.stringify(response));
  }
});

// const run = async () => {
//   const res = await filehelpers.readFile('./data.json')
//   console.log(res);
// }

// const write = async (path, data) => {
//   const res = await filehelpers.writeFile(path, data, 'utf-8');
//   console.log(res);
// }

app.post('/license_validator/api/validate_license', (req, res) => {
  var json = {
    status: true,
    reason: null
  };

  validateBody(req.body, res, json);
});

function validateBody(body, res, json) {
  var result = [];
  // fs.readFile('public/eim_issued.lic', 'utf8', function (err, data) {

  // });

  var check_required = [];

  //if (err) throw err;
  //var enc_data = JSON.parse(cipher.decrypt(data));

  if (!body.hasOwnProperty('application_id')) {
    check_required.push('Application ID is empty in the request');
  }

  // if (!body.hasOwnProperty('customer_id')) {
  //   check_required.push('Customer ID is empty in the request ');
  // }

  if (!body.hasOwnProperty('user_count')) {
    check_required.push('No of User count is empty in the request');
  }

  if (check_required.length > 0) {
    json.status = false;
    json.result = check_required;
    res.end(JSON.stringify(json));
  }

  var data = helpers.getLicenseByAppId(body.application_id).then(application => {
    if (body.application_id != application.app_id) {
      result.push('Application ID doesnt match');
    }

    if (body.user_count > application.no_of_users) {
      result.push('User limit reached');
    }

    // if (body.secret != enc_data.machine_id) {
    //   result.push('Secret doesnt match');
    // }
    //console.log(enc_data);
    var cur_time = new Date().getTime() / 1000;
    var license_start = new Date(application.license_start).getTime() / 1000;
    var license_end = new Date(application.license_end).getTime() / 1000;
    json.license_start = license_start;
    json.license_end = license_end;
    console.log("======= Current time =========");
    console.log(cur_time);
    console.log("======= Start time =========");
    console.log(license_start);
    console.log("======= End time =========");
    console.log(license_end);

    if (license_start > cur_time) {
      result.push('License start time has not reached');
    }

    if (cur_time > license_end) {
      result.push('License is expired');
    }

    if (result.length > 0) {
      json.status = false;
      json.reason = JSON.stringify(result);

      res.end(JSON.stringify(json));
    }

    json.reason = JSON.stringify(['License is valid']);
    res.end(JSON.stringify(json));

  }, (reason) => {
    json.status = false;
    json.reason = reason;
    res.end(JSON.stringify(json));
  });

  return result;
}

app.post('/license_validator/api/add_application', (req, res) => {
  var response = {
    status: false,
    message: "Unable to insert application id"
  };
  var request = req.body;
  var upsert = {
    app_id: request.application_id,
    app_name: request.application_name
  };
  var match = {
    app_id: request.application_id,
  }
  var insert = helpers.InsertApplicationData(upsert, match).then(function (status) {
    if (status) {
      response.message = "Created successfully";
      response.status = true;
      res.end(JSON.stringify(response));
    } else {
      response.message = "Application already Exists";
      response.status = false;
      res.end(JSON.stringify(response));
    }
  }, (reason) => {
    response.message = "Failed";
    response.status = false;
    res.end(JSON.stringify(response));
  });
});



app.post('/license_validator/api/add_customer', (req, res) => {
  var response = {
    status: false,
    message: "Unable to insert application id"
  };
  var request = req.body;
  var upsert = {
    cust_id: request.customer_id,
    cust_name: request.customer_name
  };
  var match = {
    cust_id: request.customer_id,
  }
  var insert = helpers.InsertCustomerData(upsert, match).then(function (status) {
    if (status) {
      response.message = "Created successfully";
      response.status = true;
      res.end(JSON.stringify(response));
    } else {
      response.message = "Customer Already Exists";
      response.status = false;
      res.end(JSON.stringify(response));
    }
  }, (reason) => {
    response.message = reason;
    response.status = false;
    res.end(JSON.stringify(response));
  });
});



app.get('/license_validator/api/get_apps', (req, res) => {
  helpers.getAllApps(1).then(application => {
    res.end(JSON.stringify(application));
  });
});



app.get('/license_validator/api/get_customer', (req, res) => {
  helpers.getAllCustomers(1).then(customers => {
    res.end(JSON.stringify(customers));
  });
});

app.get('/license_validator/api/get_licenses', (req, res) => {
  helpers.getAllLicense(1).then(licenses => {
    res.end(JSON.stringify(licenses));
  });
});


app.get('/license_validator/api/license_details/:id', (req, res) => {
  helpers.getLicenseDataById(req.params.id).then(licenses => {
    //res.end(JSON.stringify(licenses));
    res.render(__dirname + "/public/license-details.html", {
      data: Buffer.from(JSON.stringify(licenses)).toString('base64')
    });
  });
});


app.get('/create_license', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/public/data-source-list.html');
// });

app.get('/license_validator/api/get_data_source_list', (req, res) => {
  helpers.getAllDataSources(1).then(data_sources => {
    res.end(JSON.stringify(data_sources));
  });
});

app.get('/license_validator/api/get_api_interface_list', (req, res) => {
  helpers.getAllApiInterface(1).then(api_list => {
    res.end(JSON.stringify(api_list));
  });
});

app.get('/license_validator/api/get_trans_types', (req, res) => {
  helpers.getAllTransTypes(1).then(data_sources => {
    res.end(JSON.stringify(data_sources));
  });
});

app.get('/license_validator/api/get_notifications', (req, res) => {
  helpers.getAllNotifications(1).then(notification => {
    console.log(notification);
    res.end(JSON.stringify(notification));
  });
});

app.post('/license_validator/api/add_data_source', (req, res) => {
  var response = {
    status: false,
    message: "Unable to insert data source"
  };
  var request = req.body;
  var upsert = {
    ds_name: request.ds_name,
    application_name: request.application_name,
    app_id: request.app_id,
    trans_id: request.trans_id,
    host: request.host,
    db_name: request.db_name,
    tbl_name: request.tbl_name,
    user_name: cipher.encrypt(request.user_name),
    password: cipher.encrypt(request.password),
  };
  var match = {
    app_id: request.app_id,
    trans_id: request.trans_id
  };

  var insert = helpers.InsertDataSource(upsert, match).then(function (status) {
    if (status) {
      response.message = "Created successfully";
      response.status = true;
      res.end(JSON.stringify(response));
    } else {
      response.message = "Customer Already Exists";
      response.status = false;
      res.end(JSON.stringify(response));
    }
  }, (reason) => {
    response.message = reason;
    response.status = false;
    res.end(JSON.stringify(response));
  });
});

app.post('/license_validator/api/add_notification', (req, res) => {
  var response = {
    status: false,
    message: "Unable to insert data source"
  };
  var request = req.body;
  var upsert = {
    ds_id: request.ds_id,
    application_name: request.application_name,
    email: request.email,
    exp_period: request.exp_period,
    grace_period: 10
  };
  var match = {};

  var insert = helpers.InsertNotification(upsert, match).then(function (status) {
    if (status) {
      response.message = "Created successfully";
      response.status = true;
      res.end(JSON.stringify(response));
    } else {
      response.message = "Something went wrong";
      response.status = false;
      res.end(JSON.stringify(response));
    }
  }, (reason) => {
    response.message = reason;
    response.status = false;
    res.end(JSON.stringify(response));
  });
});

app.get('/license_validator/api/get_data_source_by_id/:id', (req, res) => {
  helpers.getDataSourcesById(req.params.id).then(data_source => {
    if (data_source) {
      data_source.password = cipher.decrypt(data_source.password);
      data_source.user_name = cipher.decrypt(data_source.user_name);
      res.end(JSON.stringify(data_source));
    } else {
      res.end(null);
    }
  });
});

app.get('/license_validator/api/delete_data_source/:id', (req, res) => {
  helpers.deleteDataSourceById(req.params.id).then(data_source => {
    var response = {
      status: false,
      message: ""
    };
    if (data_source) {
      response.status = data_source;
      response.message = "Deleted Successfully";
    } else {
      response.status = data_source;
      response.message = "Deletion failed";
    }
    res.end(JSON.stringify(response));
  });
});

app.get('/license_validator/api/get_notification_by_id/:id', (req, res) => {
  helpers.getNotificationById(req.params.id).then(noti_source => {
    if (noti_source) {
      res.end(JSON.stringify(noti_source));
    } else {
      res.end(null);
    }
  });
});

app.get('/license_validator/api/delete_notification/:id', (req, res) => {
  helpers.deleteNotificationById(req.params.id).then(noti_source => {
    var response = {
      status: false,
      message: ""
    };
    if (noti_source) {
      response.status = noti_source;
      response.message = "Deleted Successfully";
    } else {
      response.status = noti_source;
      response.message = "Deletion failed";
    }
    res.end(JSON.stringify(response));
  });
});


app.post('/license_validator/api/license_test_api', (req, res) => {
  var body = req.body;
  console.log(body);
  Request.post({
    "headers": {
      "content-type": "application/json"
    },
    "url": body.url,
    "body": JSON.stringify({
      "application_name": body.application_name,
      "user_count": 1
    })
  }, (error, response, body) => {
    if (error) {
      return console.log(error);
    }
    console.log(JSON.parse(body));
  });
});

app.get('/license_validator/api/delete_app/:id', (req, res) => {
  helpers.deleteApplicationById(req.params.id).then(app_source => {
    var response = {
      status: false,
      message: ""
    };
    if (app_source) {
      response.status = app_source;
      response.message = "Deleted Successfully";
    } else {
      response.status = app_source;
      response.message = "Deletion failed";
    }
    res.end(JSON.stringify(response));
  });
});


app.get('/license_validator/api/delete_customer/:id', (req, res) => {
  helpers.deleteCustomerById(req.params.id).then(cus_source => {
    var response = {
      status: false,
      message: ""
    };
    if (cus_source) {
      response.status = cus_source;
      response.message = "Deleted Successfully";
    } else {
      response.status = cus_source;
      response.message = "Deletion failed";
    }
    res.end(JSON.stringify(response));
  });
});

// route for user logout
app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie('user_sid');
    res.redirect('/');
  } else {
    res.redirect('/login');
  }
});

app.get('/license_validator/api/check_noti', async (req, res) => {
  await helpers.ProcessLicenseEmailJobs(res);
});


// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!")
});


// start the express server
app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));

module.exports = app;