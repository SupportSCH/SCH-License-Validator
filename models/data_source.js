var Sequelize = require('sequelize');
var config = require('./../config.js');
var TransSourceModel = require('./trans_source');
var AppModel = require('./app_master');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    dialect: 'mysql',
    freezeTableName: true
});

// setup User model and its fields.
var DataSourcesModel = sequelize.define('data_sources', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ds_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    application_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    app_id: {
        type: Sequelize.STRING,
        references: {
            model: AppModel,
            key: 'app_id'
        },
        allowNull: false
    },
    trans_id: {
        type: Sequelize.INTEGER,
        references: {
            model: TransSourceModel,
            key: 'id'
        },
        allowNull: false
    },
    host: {
        type: Sequelize.STRING,
        allowNull: false
    },
    db_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    tbl_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    user_name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.TEXT,
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

DataSourcesModel.belongsTo(AppModel, {
    foreignKey: 'app_id',
    constraints: false
});

DataSourcesModel.belongsTo(TransSourceModel, {
    foreignKey: 'trans_id',
    constraints: false
});

sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', {
    raw: true
}).then(function () {
    sequelize.sync()
        .then(() => console.log('data_sources table has been successfully created, if one doesn\'t exist'))
        .catch(error => console.log('This error occured', error));

});


// create all the defined tables in the specified database.


// export User model for use in other files.
module.exports = DataSourcesModel;