var Sequelize = require('sequelize');
var config = require('./../config.js');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    dialect: 'mysql',
    freezeTableName: true
});

// setup User model and its fields.
var UserLoginsModel = sequelize.define('user_logins', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    lastLoginAt: {
        type: 'TIMESTAMP',
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: true,
    }
});

// create all the defined tables in the specified database.

sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', {
    raw: true
}).then(function () {
    sequelize.sync()
        .then(() => console.log('user_logins table has been successfully created, if one doesn\'t exist'))
        .catch(error => console.log('This error occured', error));

});

// export User model for use in other files.
module.exports = UserLoginsModel;