var Sequelize = require('sequelize');
var bcrypt = require('bcryptjs');
var config = require('./../config.js');

// create a sequelize instance with our local postgres database information.
const sequelize = new Sequelize(config.mysql.database, config.mysql.user, config.mysql.password, {
  host: config.mysql.host,
  dialect: 'mysql',
  freezeTableName: true
});

// setup User model and its fields.
var User = sequelize.define('users', {
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  hooks: {
    beforeCreate: (user) => {
      const salt = bcrypt.genSaltSync();
      user.password = bcrypt.hashSync(user.password, salt);
    }
  },
  instanceMethods: {
    validPassword: function (password) {
      return bcrypt.compare(password, this.password);
    }
  }
});


sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', {
  raw: true
}).then(function () {
  sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));


});
// create all the defined tables in the specified database.



// export User model for use in other files.
module.exports = User;