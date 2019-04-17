'use strict';

const fs = require('fs');

const readFile = (path, opts = 'utf8') =>
    new Promise((resolve, reject) => {
        fs.readFile(path, opts, (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });

const writeFile = (path, data, opts = 'utf8') =>
    new Promise((resolve, reject) => {
        fs.writeFile(path, data, opts, (err) => {
            if (err) {
                reject(err);
                console.log("error");
                console.log(err);
            } else
                resolve();
        });
    });

module.exports = {
    readFile,
    writeFile
}