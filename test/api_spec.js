var db = require("secondthought");
var Membership = require("../index");
var assert = require("assert");
var should = require("should");

describe("Main API", function() {
  var memb = {};

  before(function(done) {
    memb = new Membership("membership");
    db.connect({db: "membership"}, function(err, db) {
      db.users.destroyAll(function(err, result) {
        done();
      });
    });
  });
  
  describe("authentication", function() {
    var newUser = {};
    before(function(done) {
      memb.register("test@example.com", "foobar", "foobar", function(err, result) {
        newUser = result.user;
        assert.ok(result.success, "Can't register");
        done();
      });
    });

    it("authenticates", function(done) {
      memb.authenticate("test@example.com", "foobar", function(err, res) {
        res.success.should.equal(true);
        done();
      });
    });

    it("gets by token", function(done) {
      memb.findUserByToken(newUser.authenticationToken, function(err, foundUser) {
        foundUser.id.should.equal(newUser.id);
        done();
      });
    });

  
  });

});