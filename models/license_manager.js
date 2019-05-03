var Sequelize = require('sequelize');
var config = require('./../config.js');
var AppModel = require('./app_master');
var CustomerModel = require('./customer_master');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    dialect: 'mysql',
    freezeTableName: true
});
// setup User model and its fields.
var LicenseModel = sequelize.define('license_masters', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    app_id: {
        type: Sequelize.STRING,
        references: {
            model: AppModel,
            key: 'app_id'
        },
        allowNull: false
    },
    cust_id: {
        type: Sequelize.STRING,
        references: {
            model: CustomerModel,
            key: 'cust_id'
        },
        allowNull: false
    },
    no_of_users: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    grace_period: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    license_start: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
    },
    license_end: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false
    },
    license_key: {
        type: Sequelize.STRING(10000),
        allowNull: false
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

LicenseModel.belongsTo(AppModel, {
    foreignKey: 'app_id',
    constraints: false,
    onDelete: 'CASCADE',
    hooks: true
});

LicenseModel.belongsTo(CustomerModel, {
    foreignKey: 'cust_id',
    constraints: false,
    onDelete: 'CASCADE',
    hooks: true
});

sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', {
    raw: true
}).then(function () {
    sequelize.sync()
        .then(() => console.log('license manager table has been successfully created, if one doesn\'t exist'))
        .catch(error => console.log('This error occured', error));
});

// create all the defined tables in the specified database.

// export User model for use in other files.
module.exports = LicenseModel;