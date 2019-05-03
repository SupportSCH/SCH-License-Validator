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
var ApiSourcesModel = sequelize.define('api_sources', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    app_id: {
        type: Sequelize.INTEGER,
        references: {
            model: DataSourceModel,
            key: 'id'
        },
        allowNull: false,
    },
    trans_type: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    api_url: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    api_resp: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    desc: {
        type: Sequelize.TEXT,
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

ApiSourcesModel.belongsTo(DataSourceModel, {
    foreignKey: 'app_id'
});

// create all the defined tables in the specified database.

sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', {
    raw: true
}).then(function () {
    sequelize.sync()
        .then(() => console.log('api_sources table has been successfully created, if one doesn\'t exist'))
        .catch(error => console.log('This error occured', error));

});



// export User model for use in other files.
module.exports = ApiSourcesModel;