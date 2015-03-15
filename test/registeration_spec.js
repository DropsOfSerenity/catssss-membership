'use strict';

var should = require('should');
var Registration = require('../lib/registration');
var db = require('secondthought');
var assert = require('assert');

describe('Registration', function() {
  var reg = null;

  before(function(done) {
    db.connect({
      db: 'membership'
    }, function(err, db) {
      assert.ok(err === null, err);
      reg = new Registration(db);
      done();
    });
  });

  describe('a valid application', function() {
    var regResult = {};
    before(function(done) {
      db.users.destroyAll(function(err, result) {
        assert.ok(err === null, err);
        reg.applyForMembership({
          email: 'test@test.com',
          password: 'foobar',
          confirm: 'foobar'
        }, function(err, result) {
          regResult = result;
          done();
        });
      });
    });

    it('is successful', function() {
      regResult.success.should.equal(true);
    });
    it('creates a user', function() {
      regResult.user.should.be.defined;
    });
    it('creates a log entry', function() {
      regResult.log.should.be.defined;
    });
    it('sets the users status to approved', function() {
      regResult.user.status.should.equal("approved");
    });
    it('increments a users sign in count', function() {
      regResult.user.signInCount.should.equal(1);
    });

  });

  describe('an empty or null email', function() {
    var regResult = {};
    before(function(done) {
      db.users.destroyAll(function(err, result) {
        assert.ok(err === null, err);
        reg.applyForMembership({
          email: '',
          password: 'foobar',
          confirm: 'foobar'
        }, function(err, result) {
          regResult = result;
          done();
        });
      });
    });

    it('is not successful', function() {
      regResult.success.should.equal(false);
    });
    it('tells user that email is required', function() {
      regResult.message.should.equal("Email and password are required");
    });
  });

  describe('empty or null password', function() {
    var regResult = {};
    before(function(done) {
      db.users.destroyAll(function(err, result) {
        assert.ok(err === null, err);
        reg.applyForMembership({
          email: 'test@test.com',
          password: 'foobar',
          confirm: 'notfoobar'
        }, function(err, result) {
          regResult = result;
          done();
        });
      });
    });

    it('is not successful', function() {
      regResult.success.should.equal(false);
    });
    it('tells user that password is required', function() {
      regResult.message.should.equal("Passwords don\'t match");
    });
  });

  describe('email already exists', function() {
    var regResult = {};
    before(function(done) {
      var newUser = {email: 'test@test.com', password: 'foobar', confirm: 'foobar'};
      db.users.destroyAll(function(err, result) {
        assert.ok(err === null, err);

        reg.applyForMembership(newUser, function(err, result) {
          reg.applyForMembership(newUser, function(err, nextResult) {
            regResult = nextResult;
            done();
          });
        });

      });
    });

    it('is not successful', function() {
      regResult.success.should.equal(false);
    });
    it('tells user that email already exists', function() {
      regResult.message.should.equal("This email already exists");
    });
  })
});
