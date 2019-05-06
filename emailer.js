"use strict";

var nodeMailer = require("nodemailer");
var Email = require('email-templates');
var config = require('./config');
var fh = require('./filehelpers');
var ejs = require('ejs');


var sender = "smtps://" + encodeURIComponent(config.email.from); // The emailto use in sending the email
//(Change the @ symbol to %40 or do a url encoding )
var password = config.email.pass; // password of the email to use

//var transporter = nodeMailer.createTransport(sender + ':' + password + '@smtp.gmail.com');
var transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.email.from,
        pass: config.email.pass
    }
});

// create template based sender function
// assumes text.{ext} and html.{ext} in template/directory


exports.sendLicenseMail = async function (options) {
    const email_temp_dir = new Email({
        views: {
            root: __dirname + "/templates",
            options: {
                extension: 'ejs'
            }
        },
        message: {
            from: config.email.from,
            to: options.to,
            subject: 'LICENSE MANAGEMENT'
        },
        transport: {
            jsonTransport: true
        }
    });

    var html_file = await fh.readFile(__dirname + '/templates/transaction/index.ejs');
    var end_date = options.end_date;
    //console.log(html_file);
    var locals = {
        application_name: options.application_name,
        license_days: options.license_days,
        end_date: end_date,
        trans_data: options.trans_data,
        relativeNumber: function (val) {
            if (val >= 10000000)
                val = (val / 10000000).toFixed(2) + ' Cr';
            else if (val >= 100000)
                val = (val / 100000).toFixed(2) + ' Lac';
            else if (val >= 1000)
                val = (val / 1000).toFixed(2) + ' K';

            return val;
        }
    };

    // var html = ejs.render(html_file, locals);
    // ejs.renderFile(__dirname + '/templates/transaction/index.ejs', locals, function (err, str) {
    //     fh.writeFile(__dirname + "/public/ren.html", str);
    //     const mailOptions = {
    //         from: config.email.from, // sender address
    //         to: options.to, // list of receivers
    //         subject: 'LICENSE MANAGEMENT', // Subject line
    //         html: html // plain text body
    //     };

    //     fh.writeFile(__dirname + "/public/ren2.html", html);

    //     transporter.sendMail(mailOptions, function (err, info) {
    //         if (err)
    //             console.log(err)
    //         else
    //             console.log(info);
    //     });
    // });

    email_temp_dir
        .render('transaction', {
            application_name: options.application_name,
            license_days: options.license_days,
            end_date: end_date,
            trans_data: options.trans_data,
            relativeNumber: function (val) {
                if (val >= 10000000)
                    val = (val / 10000000).toFixed(2) + ' Cr';
                else if (val >= 100000)
                    val = (val / 100000).toFixed(2) + ' Lac';
                else if (val >= 1000)
                    val = (val / 1000).toFixed(2) + ' K';

                return val;
            }
        })
        .then(rendered => {
            // email_temp_dir.send({
            //         message: {
            //             from: 'Kavimukil <kavimukil.a@gmail.com>',
            //             to: 'kavimukila@eimsolutions.com',
            //         }
            //     }).then((result) => console.log(result))
            //     .catch((error) => console.log(error));
            // //console.log(rendered);
            // email_temp_dir.send().then((res) => console.log(res));

            const mailOptions = {
                from: config.email.from, // sender address
                to: options.to, // list of receivers
                subject: 'LICENSE MANAGEMENT', // Subject line
                html: rendered // plain text body
            };

            fh.writeFile(__dirname + "/public/ren.html", rendered);

            transporter.sendMail(mailOptions, function (err, info) {
                if (err)
                    console.log(err)
                else
                    console.log(info);
            });

            //fh.writeFile(__dirname + "/public/ren.html", html);


        })
        .catch(console.error);
}

exports.GetDateObj = function (date) {
    var d = new Date(date);
    var final = d.getDate().toString() + '-' + (d.getMonth() + 1).toString() + '-' + d.getFullYear().toString();
    return final;
}