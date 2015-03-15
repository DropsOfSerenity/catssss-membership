'use strict';

var should = require('should');
var Registration = require('../lib/registration');
var db = require('secondthought');
var assert = require('assert');
var Auth = require("../lib/authentication");

describe("Authentication", function() {
  var reg = null;
  var auth = null;

  var originalRegResult = null;

  before(function(done) {
    db.connect({
      db: 'membership'
    }, function(err, db) {
      assert.ok(err === null, err);
      reg = new Registration(db);
      auth = new Auth(db);
      db.users.destroyAll(function(err, result) {
        reg.applyForMembership({
          email: 'test@test.com',
          password: 'foobar',
          confirm: 'foobar'
        }, function(err, regResult) {
          originalRegResult = regResult;
          done();
        });
      });
    });
  });

  describe("a valid login", function() {
    var authResult = {};

    before(function(done) {
      // log them in..
      auth.authenticate({email: 'test@test.com', password: 'foobar'}, function(err, res) {
        assert.ok(err === null, err);
        authResult = res;
        done();
      });
    });

    it("is successful", function() {
      authResult.success.should.equal(true);
    });
    it("returns a user", function() {
      should.exist(authResult.user);
    });
    it("creates a log entry", function() {
      should.exist(authResult.log);
    });
    it("updates the user stats", function() {
      authResult.user.signInCount.should.equal(2);
    });
    it("updates the signon dates", function() {
      should.exist(authResult.user.lastLoginAt);
      should.exist(authResult.user.currentLoginAt);
    });

  });

  describe("empty email" , function() {
    var authResult = null;
    before(function(done) {
      auth.authenticate({email: '', password: 'foobar'}, function(err, res) {
        assert.ok(err === null, err);
        authResult = res;
        done();
      });
    });

    it("is not successful", function() {
      authResult.success.should.equal(false);
    });
    it("returns a message saying 'Invalid login'", function() {
      authResult.message.should.equal("Invalid email or password");
    });
  });

  describe("empty password", function() {
    var authResult = null;
    before(function(done) {
      auth.authenticate({email: 'test@test.com', password: ''}, function(err, res) {
        assert.ok(err === null, err);
        authResult = res;
        done();
      });
    });
    it("is not successful", function() {
      authResult.success.should.equal(false);
    });
    it("returns a message saying 'Invalid login'", function() {
      authResult.message.should.equal("Invalid email or password");
    });
  });

  describe("password doesn't match", function() {
    var authResult = null;
    before(function(done) {
      auth.authenticate({email: 'test@test.com', password: 'notfoobar'}, function(err, res) {
        assert.ok(err === null, err);
        authResult = res;
        done();
      });
    });
    it("is not successful", function() {
      authResult.success.should.equal(false);
    });
    it("returns a message saying 'Invalid login'", function() {
      authResult.message.should.equal("Invalid email or password");
    });
  });

  describe("email not found", function() {
    var authResult = null;
    before(function(done) {
      auth.authenticate({email: 'nottest@wrongemail.com', password: 'foobar'}, function(err, res) {
        assert.ok(err === null, err);
        authResult = res;
        done();
      });
    });
    it("is not successful", function() {
      authResult.success.should.equal(false);
    });
    it("returns a message saying 'Invalid login'", function() {
      authResult.message.should.equal("Invalid email or password");
    });
  });
});