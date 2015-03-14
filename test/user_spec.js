var should = require('should');
var User = require('../models/user');

describe("User", function() {
  describe("defaults", function() {
    var user = {};
    before(function() {
      user = new User({email: "test@example.com"});
    });

    it("email is test@example.com", function() {
      user.email.should.equal("test@example.com");
    });
    it("has an authentication token", function() {
      user.authenticationToken.should.be.defined;
    });
    it("has a pending status", function() {
      user.status.should.equal("pending");
    });
    it("has a created date", function() {
      user.createdAt.should.be.defined;
    });
    it("has a signInCount of 0", function() {
      user.signInCount.should.equal(0);
    });
    it("has currentLogin", function() {
      user.currentLoginAt.should.be.defined;
    });
  });
});