var Sequelize = require('sequelize');
var config = require('./../config.js');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    dialect: 'mysql',
    freezeTableName: true
});

// setup User model and its fields.
var CustomerModel = sequelize.define('customer_masters', {
    cust_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
    },
    cust_name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    created_at: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
    },
    updated_at: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
    }
});

sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', {
    raw: true
}).then(function () {
    sequelize.sync()
        .then(() => console.log('customer model table has been successfully created, if one doesn\'t exist'))
        .catch(error => console.log('This error occured', error));
});

// create all the defined tables in the specified database.

// export User model for use in other files.
module.exports = CustomerModel;