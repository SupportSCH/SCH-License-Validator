"use strict";

//const User = require('./models/user');
const AppModel = require('./models/app_master');
const CustomerModel = require('./models/customer_master');
const LicenseModel = require('./models/license_manager');

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
        //console.log(response.dataValues); //the object with the data I need
        return response.dataValues;
    });
};

const getCustomerByCustId = customer_id => {
    return CustomerModel.findOne({
        where: {
            cust_id: customer_id
        }
    }).then(response => {
        //console.log(response.dataValues); //the object with the data I need
        return response.dataValues;
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
    return LicenseModel.findOne({
        where: {
            app_id: application_id
        }
    }).then(response => {
        //console.log(response.dataValues); //the object with the data I need
        return response;
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
                return false;
            } else { // insert
                return AppModel.create(values);
            }
        }).catch(function (e) {
            console.log(e);
        });
}


function InsertCustomerData(values, condition) {
    return CustomerModel
        .findOne({
            where: condition
        })
        .then(function (obj) {
            if (obj) { // update
                return false;
            } else { // insert
                return CustomerModel.create(values);
            }
        }).catch(function (e) {
            console.log(e);
        });
}


function arraysEqual(a1, a2) {
    return JSON.stringify(a1) == JSON.stringify(a2);
}

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
    formatMysqlDate
};