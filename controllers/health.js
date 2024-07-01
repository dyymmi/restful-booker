const express = require('express');
const router = express.Router();

/**
 * @api {get} /health HealthCheck
 * @apiName HealthCheck
 * @apiGroup HealthCheck
 * @apiVersion 1.0.0
 * @apiDescription A simple health check endpoint to confirm whether the API is up and running.
 *
 * @apiExample Ping server:
 * curl -i localhost:3001/api/health
 * 
 * @apiSuccess {String} OK Default HTTP 200 response
 * 
 * @apiSuccessExample {json} Response:
 *     HTTP/1.1 200 OK
 */
router.get('/', (req, res, next) => {
    res.status(200).end();
  });

  module.exports = router;