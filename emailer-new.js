"use strict";

var nodeMailer = require("nodemailer");
//var Email = require('email-templates');
var EmailTemplate = require('email-templates-v2').EmailTemplate;
var config = require('./config');
var fh = require('./filehelpers');

var sender = "smtps://" + encodeURIComponent(config.email.from); // The emailto use in sending the email
//(Change the @ symbol to %40 or do a url encoding )
var password = config.email.pass; // password of the email to use

var transporter = nodeMailer.createTransport(sender + ':' + password + '@smtp.gmail.com');

var sendLicenseMailTemplate = transporter.templateSender(
    new EmailTemplate('./templates/transaction'), {
        from: 'kavimukil.a@gmail.com',
});

//var sendLicenseMail = transporter.templateSender(email_temp_dir);

exports.sendLicenseMail = function (options) {
    // transporter.template
    sendLicenseMailTemplate({
        to: options.to,
        subject: 'LICENSE MANAGEMENT'
    }, {
        application_name: "VCP",
        license_days: "10",
        end_date: "29-08-2019",
        current_date: "02-05-2019",
        end_date: "29-08-2019"
    }, function (err, info) {
        if (err) {
            console.log(err)
        } else {
            console.log('Link sent\n' + JSON.stringify(info));
        }
    });
};