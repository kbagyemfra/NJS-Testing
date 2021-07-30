const chai = require("chai");
const assert = chai.assert;

const server = require("../server");

const chaiHttp = require("chai-http");
chai.use(chaiHttp);

suite("Functional Tests", function () {
  suite("Integration tests with chai-http", function () {
    // #1
    test("Test GET /hello with no name", function (done) {
      chai
        .request(server)
        .get("/hello")
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "hello Guest");
          done();
        });
    });
    // #2
    test("Test GET /hello with your name", function (done) {
      chai
        .request(server)
        .get("/hello?name=xy_z")
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, "hello xy_z");
          done();
        });
    });
    // #3
    test('send {surname: "Colombo"}', function (done) {
      chai
        .request(server)
        .put("/travellers")
        .send({ surname: 'Colombo' })

        .end(function (err, res) {
          assert.equal(res.status, 200, 'response status should be 200');
          assert.equal(res.type, 'application/json', 'response should be Json')
          assert.equal(
            res.body.name,
            'Cristoforo',
            'res.body.name should be "Cristoforo'
          )
          assert.equal(
            res.body.surname,
            'Colombo',
            'res.body.surname should be "Colombo'
          )

          done();
        });
    });
    // #4
    test('send {surname: "da Verrazzano"}', function (done) {

      chai
        .request(server)
        .put('/travellers') // Put request(route=/traveller)
        .send({ surname: "da Verrazzano" })

        .end(function (err, res) {
          // Test for status
          assert.equal(res.status, 200, 'Response should be 200');

          // Test for type
          assert.equal(res.type, 'application/json', 'Response should be Json');

          // test for body.name content
          assert.equal(
            res.body.name,
            'Giovanni',
            'The name should be Giovanni');

          // Test for body.surname content
          assert.equal(
            res.body.surname,
            'da Verrazzano',
            'The name should be da Verrazzano'
          );

          done();

        })
    });
  });
});

// const Browser = require("zombie");

// Browser.localhost('example.com', process.env.PORT || 3000);

// const { request } = require("../server");

// suite("Functional Tests with Zombie.js", function () {

//   const browser = new Browser();
//   suiteSetup(function(done) {
//     return browser.visit('/', done);
//   });

//   suite('"Famous Italian Explorers" form', function () {
//     // #5
//     test('submit "surname" : "Colombo" - write your e2e test...', function (done) {
//       browser.fill("surname", "Colombo").pressButton("submit", function () {
//         assert.fail();

//         done();
//       });
//     });
//     // #6
//     test('submit "surname" : "Vespucci" - write your e2e test...', function (done) {
//       assert.fail();

//       done();
//     });
//   });
// });
