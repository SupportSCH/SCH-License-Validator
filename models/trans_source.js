var Sequelize = require('sequelize');
var config = require('./../config.js');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
    host: config.mysql.host,
    dialect: 'mysql',
    freezeTableName: true
});

// setup User model and its fields.
var TransSourcesModel = sequelize.define('trans_sources', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    trans_name: {
        type: Sequelize.STRING,
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

sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', {
    raw: true
}).then(function () {
    sequelize.sync()
        .then(() => {
            TransSourcesModel.findOne({
                where: {
                    id: 1
                }
            }).then(function (obj) {
                if (obj) {
                    return false;
                } else {
                    return TransSourcesModel.create({
                        id: 1,
                        trans_name: 'LICENSE'
                    });
                }
            });

            TransSourcesModel.findOne({
                where: {
                    id: 2
                }
            }).then(function (obj) {
                if (obj) {
                    return false;
                } else {
                    return TransSourcesModel.create({
                        id: 2,
                        trans_name: 'TRANSACTION'
                    });
                }
            });


        })
        .catch(error => console.log('This error occured', error));
});

// create all the defined tables in the specified database.




// export User model for use in other files.
module.exports = TransSourcesModel;