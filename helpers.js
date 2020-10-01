"use strict";

//const User = require('./models/user');
const AppModel = require('./models/app_master');
const CustomerModel = require('./models/customer_master');
const LicenseModel = require('./models/license_manager');
var TransSourceModel = require('./models/trans_source');
var DataSourcesModel = require('./models/data_source');
var ApiSourcesModel = require('./models/api_source');
var UserLoginsModel = require('./models/user_logins');
var NotiModel = require('./models/notifications');
var emailer = require('./emailer');
var external = require('./external_db');
var cipher = require('./cipher');

// function CheckAppIdExists(application_id) {
//     AppModel.findOne({
//         where : {
//             app_id : application_id
//         }
//     });
// }

const getAppByAppId = application_id => {
    return AppModel.findOne({
        where: {
            app_id: application_id
        }
    }).then(response => {
        //console.log(response); //the object with the data I need
        if (response) {
            return response.dataValues;
        } else return false;
    });
};

const getCustomerByCustId = customer_id => {
    return CustomerModel.findOne({
        where: {
            cust_id: customer_id
        }
    }).then(response => {
        //console.log(response.dataValues); //the object with the data I need
        if (response) {
            return response.dataValues;
        } else return false;
    });
};

const getLicenseData = (application_id, customer_id) => {
    return LicenseModel.findOne({
        where: {
            cust_id: customer_id,
            app_id: application_id
        }
    }).then(response => {
        //console.log(response.dataValues); //the object with the data I need
        return response.dataValues;
    });
}

const getLicenseDataById = (ids) => {
    return LicenseModel.findOne({
        where: {
            id: ids
        },
        include: [{
            model: AppModel
        },
        {
            model: CustomerModel,
        },
        ]
    }).then(response => {
        //the object with the data I need
        return response.dataValues;
    });
}


function formatMysqlDate(unix_timestamp) {
    var formattedTime = new Date(unix_timestamp * 1000).toJSON().slice(0, 19).replace('T', ' ');
    return formattedTime;
}

const getLicenseByAppId = (application_id) => {
    console.log(application_id);
    return LicenseModel.findOne({
        where: {
            app_id: application_id
        }
    }).then(response => {
        if (response) {
            return response.dataValues;
        } else return false;
        //console.log(response.dataValues); //the object with the data I need
        //return response;
    });
}

const getAllLicense = (application_id) => {
    return LicenseModel.findAll({
        include: [{
            model: AppModel
        },
        {
            model: CustomerModel,
        },
        ]
    }).then(response => {
        //console.log(response); //the object with the data I need
        return response;
    });
}

const getAllCustomers = (application_id) => {
    return CustomerModel.findAll({
        raw: true
    }).then(response => {
        //the object with the data I need
        return response;
    });
}

const getAllApps = (application_id) => {
    return AppModel.findAll().then(response => {
        //console.log(response.dataValues); //the object with the data I need
        return response;
    });
}

function Upsert(values, condition) {
    return LicenseModel
        .findOne({
            where: condition
        })
        .then(function (obj) {
            if (obj) { // update
                return obj.update(values);
            } else { // insert
                return LicenseModel.create(values);
            }
        });
}

function InsertApplicationData(values, condition) {
    return AppModel
        .findOne({
            where: condition
        })
        .then(function (obj) {
            if (obj) { // update
                return AppModel.update(values, {
                    where: condition
                });
            } else { // insert
                return AppModel.create(values);
            }
        }).catch(function (e) {
            console.log(e);
        });
}

function InsertUserLogin(values, condition, totalUsers, licensedFor) {
    return UserLoginsModel
        .findOne({
            where: condition
        })
        .then(function (obj) {
            if (obj) { // update

                return true;
            } else { // insert

                if (licensedFor > totalUsers) {
                    let insert = UserLoginsModel.create(values);
                    if (insert) {
                        return true;
                    } else return false;
                } else return false;

            }
        }).catch(function (e) {
            console.log(e);
        });
}

async function getUserLoginsCount() {
    return await UserLoginsModel.count();
}

function InsertCustomerData(values, condition) {
    return CustomerModel
        .findOne({
            where: condition
        })
        .then(function (obj) {
            if (obj) { // update
                return CustomerModel.update(values, {
                    where: condition
                });;
            } else { // insert
                return CustomerModel.create(values);
            }
        }).catch(function (e) {
            console.log(e);
        });
}

const getAllDataSources = (application_id) => {
    return DataSourcesModel.findAll({
        include: [{
            model: TransSourceModel
        }]
    }).then(response => {
        //console.log(response); //the object with the data I need
        return response;
    });
}

const getAllNotifications = (noti_id) => {
    return NotiModel.findAll({
        include: [{
            model: DataSourcesModel
        }]
    }).then(response => {
        //console.log(response); //the object with the data I need
        return response;
    });
}



const getAllApiInterface = (api_iface) => {
    return ApiSourcesModel.findAll({
        include: [{
            model: DataSourcesModel
        }]
    }).then(response => {
        //console.log(response); //the object with the data I need
        return response;
    });
}

const getDataSourcesById = (source_id) => {
    return DataSourcesModel.findOne({
        where: {
            id: source_id
        },
        include: [{
            model: TransSourceModel
        }, {
            model: AppModel
        }]
    }).then(response => {
        //console.log(response); //the object with the data I need
        return response;
    });
}

const getNotificationById = (noti_id) => {
    return NotiModel.findOne({
        where: {
            id: noti_id
        },
        include: [{
            model: DataSourcesModel,
            include: [
                AppModel
            ]
        }]
    }).then(response => {
        //console.log(response); //the object with the data I need
        return response;
    });
}

const deleteDataSourceById = (source_id) => {
    return DataSourcesModel.destroy({
        where: {
            id: source_id //this will be your id that you want to delete
        }
    }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
        // console.log("row deleted");
        // console.log(rowDeleted);
        if (rowDeleted === 1) {
            return true;
        } else {
            return false;
        }
    }, function (err) {
        //console.log(err);
        return false;
    });
}

const deleteNotificationById = (source_id) => {
    return NotiModel.destroy({
        where: {
            id: source_id //this will be your id that you want to delete
        }
    }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
        if (rowDeleted === 1) {
            return true;
        } else {
            return false;
        }
    }, function (err) {
        return false;
    });
}

const deleteApplicationById = (source_id) => {
    return AppModel.destroy({
        where: {
            app_id: source_id //this will be your id that you want to delete
        }
    }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
        if (rowDeleted === 1) {
            return true;
        } else {
            return false;
        }
    }, function (err) {
        console.log(err);
        return false;
    });
}

const deleteCustomerById = (source_id) => {
    return CustomerModel.destroy({
        where: {
            cust_id: source_id //this will be your id that you want to delete
        }
    }).then(function (rowDeleted) { // rowDeleted will return number of rows deleted
        if (rowDeleted === 1) {
            return true;
        } else {
            return false;
        }
    }, function (err) {
        console.log(err);
        return false;
    });
}

const getAllTransTypes = (application_id) => {
    return TransSourceModel.findAll().then(response => {
        //console.log(response); //the object with the data I need
        return response;
    });
}

function InsertDataSource(values, condition) {
    console.log(values);
    return DataSourcesModel
        .findOne({
            where: condition
        })
        .then(function (obj) {
            if (obj) { // update
                return DataSourcesModel.update(values, {
                    where: condition
                });
            } else { // insert
                return DataSourcesModel.create(values);
            }
        }).catch(function (e) {
            console.log(e);
        });
}

function InsertNotification(values, condition) {
    console.log(values);
    return NotiModel
        .findOne({
            where: condition
        })
        .then(function (obj) {
            if (obj) { // update
                return NotiModel.update(values, {
                    where: condition
                });
            } else { // insert
                return NotiModel.create(values);
            }
        }).catch(function (e) {
            console.log(e);
        });
}

function arraysEqual(a1, a2) {
    return JSON.stringify(a1) == JSON.stringify(a2);
}

function parseDate(str) {
    var mdy = str.split('/');
    return new Date(mdy[2], mdy[0] - 1, mdy[1]);
}

function datediff(first, second) {
    // Take the difference between the dates and divide by milliseconds per day.
    // Round to nearest whole number to deal with DST.
    return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

function GetFormattedDate(date) {
    console.log(date);
    var d = new Date(date);
    var final = d.getDate().toString() + '-' + (d.getMonth() + 1).toString() + '-' + d.getFullYear().toString();
    return final;
}

async function ProcessLicenseEmailJobs(res) {
    getAllNotifications(1).then(notification => {
        notification.forEach((resultSetItem) => {
            //console.log();
            var noti = resultSetItem.get({
                plain: true
            });
            var app_id = noti.data_source.app_id;
            getLicenseByAppId(app_id).then(async (license) => {
                var cur_date = new Date();
                var license_end_date = new Date(license.license_end);
                var diff_days = datediff(cur_date, license_end_date);
                //console.log(diff_days);
                var stat = {
                    status: true
                };

                console.log("License expiration difference equals : " + between(noti.exp_period, diff_days, noti.exp_period));

                if (between(noti.exp_period, diff_days, noti.exp_period)) {
                    noti.data_source.user_name = cipher.decrypt(noti.data_source.user_name);
                    noti.data_source.password = cipher.decrypt(noti.data_source.password);
                    var trans_data = await external.GetExternalTransactionData(noti.data_source);
                    const data_group_by = groupByKey('header');
                    var final_gby = data_group_by(trans_data);
                    console.log(final_gby);
                    var options = {
                        application_name: noti.data_source.application_name,
                        license_days: diff_days,
                        end_date: GetFormattedDate(license_end_date),
                        to: noti.email,
                        trans_data: final_gby
                    };
                    await emailer.sendLicenseMail(options);
                    if (res) {
                        res.end(JSON.stringify(stat));
                    }
                } else {
                    console.log("exp period: " + noti.exp_period);
                    console.log("diff_days: " + diff_days);
                    stat.status = false;
                    if (res) {
                        res.end(JSON.stringify(stat));
                    }
                }
            });
        });
    });
}

function between(x, min, max) {
    return x >= min && x <= max;
}

const groupByKey = key => array =>
    array.reduce((objectsByKeyValue, obj) => {
        const value = obj[key];
        objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
        return objectsByKeyValue;
    }, {});



module.exports = {
    getAppByAppId,
    getCustomerByCustId,
    arraysEqual,
    getLicenseData,
    Upsert,
    getLicenseByAppId,
    InsertApplicationData,
    InsertCustomerData,
    getAllLicense,
    getAllCustomers,
    getAllApps,
    getLicenseDataById,
    formatMysqlDate,
    getAllApiInterface,
    getAllDataSources,
    getAllTransTypes,
    getDataSourcesById,
    InsertDataSource,
    deleteDataSourceById,
    InsertNotification,
    getAllNotifications,
    getUserLoginsCount,
    getNotificationById,
    deleteNotificationById,
    parseDate,
    datediff,
    ProcessLicenseEmailJobs,
    groupByKey,
    GetFormattedDate,
    deleteApplicationById,
    deleteCustomerById,
    InsertUserLogin,
    between
};