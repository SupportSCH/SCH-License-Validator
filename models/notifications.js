var Sequelize = require('sequelize');
var config = require('./../config.js');
var DataSourceModel = require('./data_source');
// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    dialect: 'mysql',
    freezeTableName: true
});

// setup User model and its fields.
var NotiModel = sequelize.define('notifications', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ds_id: {
        type: Sequelize.INTEGER,
        references: {
            model: DataSourceModel,
            key: 'id'
        },
        allowNull: false
    },
    application_name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    exp_period: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    grace_period: {
        type: Sequelize.INTEGER,
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

NotiModel.belongsTo(DataSourceModel, {
    foreignKey: 'ds_id',
    constraints: false
});

// create all the defined tables in the specified database.
sequelize.sync()
    .then(() => console.log('notifications table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));



// export User model for use in other files.
module.exports = NotiModel;