"use strict";

var User = require('../models/user');
var Application = require('../models/application');
var assert = require("assert");
var bcrypt = require("bcrypt-nodejs");
var Log = require("../models/log");

var RegResult = function() {
  var result = {
    success: false,
    message: null,
    user: null
  };

  return result;
};

var Registration = function(db) {
  var self = this;

  var validateInputs = function(app) {
    if (!app.email || !app.password) {
      app.setInvalid("Email and password are required");
    } else if (app.password !== app.confirm) {
      app.setInvalid("Passwords don't match");
    } else {
      app.validate();
    }
  };
  var checkIfUserExists = function(app, next) {
    db.users.exists({email: app.email}, next);
  };
  var saveUser = function(user, next) {
    db.users.save(user, next);
  };

  var addLogEntry = function(user, next) {
    var log = new Log({
      subject: "Registration",
      userId: user.id,
      entry: "Successfully Registered"
    });
    db.logs.save(log, next);
  };

  self.applyForMembership = function(args, next) {
    var regResult = new RegResult();
    var app = new Application(args);

    // do something interesting..
    // validate input
    validateInputs(app);

    checkIfUserExists(app, function(err, exists) {
      assert.ok(err === null, err);
      if (!exists) {
        // create a new user
        var user = new User(args);
        user.status = "approved";
        user.signInCount = 1;
        // hash the password
        var hashedPassword = bcrypt.hashSync(app.password);

        // save the user
        saveUser(user, function(err, newUser) {
          assert.ok(err === null, err);
          regResult.user = newUser;
          // add log entry
          addLogEntry(newUser, function(err, newLog) {
            regResult.log = newLog;
            regResult.message = "Welcome!";
            regResult.success = true;
            next(null, regResult);
          });
        });
      }
    });

    return regResult;
  };

  return self;
};

module.exports = Registration;
