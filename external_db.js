"use strict";
var Sequelize = require('sequelize');

async function GetExternalTransactionData(data_source) {
    const sequelize = new Sequelize(data_source.db_name, data_source.user_name, data_source.password, {
        host: data_source.host,
        dialect: 'mysql',
        freezeTableName: true
    });

    return sequelize.sync()
        .then(() => {
            var query = "SELECT * FROM " + data_source.tbl_name;
            var result = sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT
            }).then(data => {
                if (data) {
                    return data;
                } else {
                    return false;
                }
            });

            return result;
        })
        .catch(error => console.log('This error occured', error));
}

module.exports = {
    GetExternalTransactionData
}