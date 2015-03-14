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
    it('is not successful');
    it('tells user that email is required');
  });

  describe('empty or null password', function() {
    it('is not successful');
    it('tells user that password is required');
  });

  describe('email already exists', function() {
    it('is not successful');
    it('tells user that email already exists');
  })
});
