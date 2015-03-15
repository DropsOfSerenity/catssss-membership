var events = require("events");
var util = require("util");
var bcrypt = require("bcrypt-nodejs");
var assert = require("assert");
var User = require("../models/user");
var Log = require("../models/log");

var AuthResult = function(creds) {
  var result = {
    creds: creds,
    success: false,
    message: "Invalid email or password",
    user: null,
    log: null
  };
  return result;
};

var Authentication = function(db) {
  var self = this;
  var continueWith = null;
  events.EventEmitter.call(self);

  // validate credentials
  var validateCredentials = function(authResult) {
    if(authResult.creds.email && authResult.creds.password) {
      self.emit("creds-ok", authResult);
    } else {
      self.emit("invalid", authResult);
    }
  };
  // find the user
  var findUser = function(authResult) {
    db.users.first({email: authResult.creds.email}, function(err, found) {
      assert.ok(err === null, err);
      if (found) {
        authResult.user = new User(found);
        self.emit("user-found", authResult);
      } else {
        self.emit("invalid", authResult);
      }
    })
  };
  // compare the password
  var comparePassword = function(authResult) {
    var matched = bcrypt.compareSync(authResult.creds.password, authResult.user.hashedPassword);
    if (matched) {
      self.emit("password-accepted", authResult);
    } else {
      self.emit("invalid", authResult);
    }
  };
  // bump the stats
  var updateUserStats = function(authResult) {
    // set updates on authResult
    var user = authResult.user;
    user.signInCount++;
    user.lastLoginAt = user.currentLoginAt;
    user.currentLoginAt = new Date();

    // then save them
    var updates = {
      signInCount: user.signInCount,
      lastLoginAt: user.lastLoginAt,
      currentLoginAt: user.currentLoginAt
    };

    // update user
    console.log(updates);
    db.users.updateOnly(updates, user.id, function(err, updates) {
      assert.ok(err === null, err);
      self.emit("stats-updated", authResult);
    })
  };
  // create log entry
  var createLogEntry = function(authResult) {
    var log = new Log({
      subject: "Authentication",
      userId: authResult.user.id,
      entry: "Successfully Logged In"
    });

    db.logs.save(log, function(err, newLog) {
      authResult.log = newLog;
      self.emit("log-created", authResult);
    });
  };

  var authenticationOk = function(authResult) {
    authResult.success = true;
    authResult.message = "Welcome back!";
    self.emit("authenticated", authResult);
    self.emit("completed", authResult);
    if (continueWith) {
      continueWith(null, authResult);
    }
  };

  var authenticatedFailed = function(authResult) {
    authResult.success = false;
    self.emit("not-authenticated", authResult);
    self.emit("completed", authResult);
    if (continueWith) {
      continueWith(null, authResult);
    }
  };

  // happy path
  self.on("login-received", validateCredentials);
  self.on("creds-ok", findUser);
  self.on("user-found", comparePassword);
  self.on("password-accepted", updateUserStats);
  self.on("stats-updated", createLogEntry);
  self.on("log-created", authenticationOk);

  // sad path
  self.on("invalid", authenticatedFailed);

  self.authenticate = function(creds, next) {
    continueWith = next;
    var authResult = new AuthResult(creds);
    self.emit("login-received", authResult);
  }
};
util.inherits(Authentication, events.EventEmitter);
module.exports = Authentication;