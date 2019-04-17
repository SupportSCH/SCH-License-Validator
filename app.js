var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var User = require('./models/user');
var AppModel = require('./models/app_master');
var CustomerModel = require('./models/customer_master');
var LicenseModel = require('./models/license_manager');
var helpers = require('./helpers');
var bcrypt = require('bcrypt');
const fs = require('fs');
const cipher = require('./cipher');
//const si = require('systeminformation');
const mac_id = require('node-machine-id');
//const filehelpers = require('./filehelpers');

User.prototype.verifyPassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

// invoke an instance of express application.
var app = express();
// set our application port
app.set('port', 8000);

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({
  extended: true
}));

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

app.use(express.static('public'));

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
  res.sendFile(__dirname + '/public/customer-list.html');
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

app.post('/install_license', (req, res) => {
  var response = {
    status: false,
    message: 'Invalid License'
  }
  if (req.files.hasOwnProperty('license')) {
    var license_data = req.file.license.data.toString('utf8');
    if (license_data) {
      var license_obj = cipher.decrypt(license_data);
      var request_array = Object.keys(license_obj);
      var required_array = ['customer_id', 'customer_name', 'start_time', 'end_time', 'application_id', 'application_name', 'machine_id'];
      var check_array_equals = helpers.arraysEqual(request_array, required_array);
      if (check_array_equals) {
        var app_exists = helpers.getAppByAppId(license_obj.application_id).then(application => {
          helpers.getCustomerByCustId(license_obj.customer_id).then(customer_id => {
            return true;
          });
        });

        if (app_exists) {
          var upsert = {
            app_id: license_obj.application_id,
            cust_id: license_obj.customer_id,
            no_of_users: license_obj.no_of_users,
            license_start: license_obj.start_time,
            license_end: license_obj.end_time,
            license_key: license_data
          };

          var match = {
            app_id: license_obj.application_id,
            cust_id: license_obj.customer_id
          };

          helpers.Upsert(match, upsert).then(function (status) {
            if (status) {
              response.message = "License Applied Successfully";
              response.status = true;
              res.end(JSON.stringify(response));
            } else {
              response.message = "Application is not created in the database";
              res.end(JSON.stringify(response));
            }
          });
        } else {

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

app.post('/validate_license', (req, res) => {
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

  if (!body.hasOwnProperty('customer_id')) {
    check_required.push('Customer ID is empty in the request ');
  }

  if (!body.hasOwnProperty('user_count')) {
    check_required.push('No of User count is empty in the request');
  }

  if (check_required.length > 0) {
    json.status = false;
    json.result = check_required;
    res.end(JSON.stringify(json));
  }

  var data = helpers.getLicenseByAppId(body.application_id).then(application => {
    if (body.application_id != application.application_id) {
      result.push('Application ID doesnt match');
    }

    if (body.customer_id != application.customer_id) {
      result.push('Customer ID doesnt match');
    }

    // if (body.secret != enc_data.machine_id) {
    //   result.push('Secret doesnt match');
    // }
    console.log(enc_data);
    var cur_time = new Date().getTime() / 1000;
    console.log("======= Current time =========");
    console.log(cur_time);
    console.log("======= Start time =========");
    console.log(application.start_time);
    console.log("======= End time =========");
    console.log(application.end_time);

    if (application.start_time > cur_time) {
      result.push('License start time has not reached');
    }

    if (cur_time > application.end_time) {
      result.push('License is expired');
    }

    if (result.length > 0) {
      json.status = false;
      json.reason = JSON.stringify(result);
      json.license_start = application.start_time;
      json.license_end = application.end_time;
    }

    res.end(JSON.stringify(json));

  }, (reason) => {
    json.status = false;
    json.reason = reason;
    res.end(JSON.stringify(json));
  });

  return result;
}

app.post('/add_application', (req, res) => {
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



app.post('/add_customer', (req, res) => {
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



app.get('/get_apps', (req, res) => {
  helpers.getAllApps(1).then(application => {
    res.end(JSON.stringify(application));
  });
});



app.get('/get_customer', (req, res) => {
  helpers.getAllCustomers(1).then(customers => {
    res.end(JSON.stringify(customers));
  });
});



app.get('/create_license', (req, res) => {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
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


// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!")
});


// start the express server
app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));

module.exports = app;