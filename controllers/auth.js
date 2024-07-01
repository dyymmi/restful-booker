const express = require("express");
const router = express.Router();
const crypto = require("crypto");

globalLogins = {};


/**
 * @api {post} /auth CreateToken
 * @apiName CreateToken
 * @apiGroup Auth
 * @apiVersion 1.0.0
 * @apiDescription Creates a new auth token to use for access to the PUT and DELETE /booking
 * 
 * @apiParam (Request body) {String}  username=admin        Username for authentication
 * @apiParam (Request body) {String}  password=password123  Password for authentication
 * 
 * @apiHeader {string} Content-Type=application/json        Sets the format of payload you are sending
 * 
 * @apiExample Example 1:
 * curl -X POST localhost:3001/api/auth \
  -H 'Content-Type: application/json' \
  -d '{
    "username" : "admin",
    "password" : "password123"
 * }'
 * @apiSuccess {String}  token  Token to use in future requests
 * 
 * @apiSuccessExample {json} Response:
 * HTTP/1.1 200 OK
 * 
 * {
    "token": "abc123"
 * }
 */
router.post("/", function (req, res, next) {
    if (req.body.username === "admin" && req.body.password === "password123") {
      const token = crypto
        .randomBytes(Math.ceil(15 / 2))
        .toString("hex")
        .slice(0, 15);
  
      globalLogins[token] = true;
  
      res.send({ token: token });
    } else {
      res.send({ reason: "Bad credentials" });
    }
  });
  
  module.exports = router;