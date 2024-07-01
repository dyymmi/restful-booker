const express = require("express");
const router = express.Router(),
  parse = require("../helpers/parser"),
  Booking = require("../models/booking"),
  validator = require("../helpers/validator"),
  creator = require("../helpers/bookingCreator");


if (process.env.SEED === "true") {
  let count = 1;

  // Feeds the database with 10 random bookings
  (function createBooking() {
    const newBooking = creator.createBooking();

    Booking.create(newBooking, function (err, result) {
      if (err) return console.error(err);

      if (count < 10) {
        count++;
        createBooking();
      }
    });
  })();
}

/**
 * @api {get} /bookings GetBookings
 * @apiName GetBookings
 * @apiGroup Booking
 * @apiVersion 1.0.0
 * @apiDescription Returns the ids of all the bookings that exist within the API. Can take optional query strings to search and return a subset of booking ids.
 *
 * @apiParam {String} [firstName] Return bookings with a specific firstName
 * @apiParam {String} [lastName]  Return bookings with a specific lastName
 * @apiParam {date}   [checkIn]   Return bookings that have a checkIn date greater than or equal to the set checkIn date. Format must be CCYY-MM-DD
 * @apiParam {date}   [checkOut]  Return bookings that have a checkOut date greater than or equal to the set checkOut date. Format must be CCYY-MM-DD
 * 
 * @apiExample Example 1 (All IDs):
 * curl -i localhost:3001/api/bookings
 * 
 * @apiExample Example 2 (Filter by name):
 * curl -i localhost:3001/api/bookings?firstName=sally&lastName=brown
 * 
 * @apiExample Example 3 (Filter by checkIn/checkOut date):
 * curl -i localhost:3001/api/bookings?checkIn=2014-03-13&checkOut=2014-05-21
 * 
 * @apiSuccess {object[]} object Array of objects that contain unique booking IDs
 * @apiSuccess {number} object.bookingId ID of a specific booking that matches search criteria
 * 
 * @apiSuccessExample {json} Response:
 * HTTP/1.1 200 OK
 * 
 * [
  {
    "bookingId": 1
  },
  {
    "bookingId": 2
  },
  {
    "bookingId": 3
  },
  {
    "bookingId": 4
  }
] 
*/
router.get("/", function (req, res, next) {
  const query = {};

  if (typeof req.query.firstName != "undefined") {
    query.firstName = req.query.firstName;
  }

  if (typeof req.query.lastName != "undefined") {
    query.lastName = req.query.lastName;
  }

  if (typeof req.query.checkIn != "undefined") {
    query["bookingDates.checkIn"] = {
      $gt: new Date(req.query.checkIn).toISOString(),
    };
  }

  if (typeof req.query.checkOut != "undefined") {
    query["bookingDates.checkOut"] = {
      $lt: new Date(req.query.checkOut).toISOString(),
    };
  }

  Booking.getIDs(query, function (err, record) {
    const booking = parse.bookingIds(req, record);
    res.send(booking);
  });
});

/**
 * @api {get} /bookings/:id GetBooking
 * @apiName GetBooking
 * @apiGroup Booking
 * @apiVersion 1.0.0
 * @apiDescription Returns a specific booking based upon the booking id provided
 * 
 * @apiParam (Url Parameter) {String} id The id of the booking you would like to retrieve
 * 
 * @apiHeader {string} Accept=application/json Sets what format the response body is returned in. Can be application/json or application/xml
 * 
 * @apiExample Example 1 (Get booking):
 * curl -i localhost:3001/api/bookings/1
 * 
 * @apiSuccess {String}  firstName             firstName for the guest who made the booking
 * @apiSuccess {String}  lastName              lastName for the guest who made the booking
 * @apiSuccess {Number}  totalPrice            The total price for the booking
 * @apiSuccess {Boolean} depositPaid           Whether the deposit has been paid or not
 * @apiSuccess {Object}  bookingDates          Sub-object that contains the checkIn and checkOut dates
 * @apiSuccess {Date}    bookingDates.checkIn  Date the guest is checkIng in
 * @apiSuccess {Date}    bookingDates.checkOut Date the guest is checkIng out
 * @apiSuccess {String}  additionalNeeds       Any other needs the guest has
 * 
 * @apiSuccessExample {json} JSON Response:
 * HTTP/1.1 200 OK
 * 
 * {
    "firstName": "Sally",
    "lastName": "Brown",
    "totalPrice": 111,
    "depositPaid": true,
    "bookingDates": {
        "checkIn": "2013-02-23",
        "checkOut": "2014-10-23"
    },
    "additionalNeeds": "Breakfast"
}
 * @apiSuccessExample {xml} XML Response:
 * HTTP/1.1 200 OK
 * 
 * <booking>
    <firstName>Sally</firstName>
    <lastName>Brown</lastName>
    <totalPrice>111</totalPrice>
    <depositPaid>true</depositPaid>
    <bookingDates>
        <checkIn>2013-02-23</checkIn>
        <checkOut>2014-10-23</checkOut>
    </bookingDates>
    <additionalNeeds>Breakfast</additionalNeeds>
</booking>
 *
 * @apiSuccessExample {url} URL Response:
 * HTTP/1.1 200 OK
 * 
 * firstName=Jim&lastName=Brown&totalPrice=111&depositPaid=true&bookingDates%5BcheckIn%5D=2018-01-01&bookingDates%5Bcheckout%5D=2019-01-01
 */
router.get("/:id", function (req, res, next) {
  Booking.get(req.params.id, function (err, record) {
    if (record) {
      const booking = parse.booking(req.headers.accept, record);
      res.send(booking);
    } else {
      res.status(404).end();
    }
  });
});

/**
 * @api {post} /bookings CreateBooking
 * @apiName CreateBooking
 * @apiGroup Booking
 * @apiVersion 1.0.0
 * @apiDescription Creates a new booking in the API
 * 
 * @apiParam (Request body) {String}  firstName             firstName for the guest who made the booking
 * @apiParam (Request body) {String}  lastName              lastName for the guest who made the booking
 * @apiParam (Request body) {Number}  totalPrice            The total price for the booking
 * @apiParam (Request body) {Boolean} depositPaid           Whether the deposit has been paid or not
 * @apiParam (Request body) {Date}    bookingDates.checkIn  Date the guest is checkIng in
 * @apiParam (Request body) {Date}    bookingDates.checkOut Date the guest is checkIng out
 * @apiParam (Request body) {String}  additionalNeeds       Any other needs the guest has
 * 
 * @apiHeader {string} Content-Type=application/json Sets the format of payload you are sending. Can be application/json or text/xml
 * @apiHeader {string} Accept=application/json Sets what format the response body is returned in. Can be application/json or application/xml
 * 
 * @apiExample JSON example usage:
 * curl -X POST \
  localhost:3001/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName" : "Jim",
    "lastName" : "Brown",
    "totalPrice" : 111,
    "depositPaid" : true,
    "bookingDates" : {
        "checkIn" : "2018-01-01",
        "checkOut" : "2019-01-01"
    },
    "additionalNeeds" : "Breakfast"
}'
 * @apiExample XML example usage:
 * curl -X POST \
  localhost:3001/api/bookings \
  -H 'Content-Type: text/xml' \
  -d '<booking>
    <firstName>Jim</firstName>
    <lastName>Brown</lastName>
    <totalPrice>111</totalPrice>
    <depositPaid>true</depositPaid>
    <bookingDates>
      <checkIn>2018-01-01</checkIn>
      <checkOut>2019-01-01</checkOut>
    </bookingDates>
    <additionalNeeds>Breakfast</additionalNeeds>
  </booking>'
 *
 * @apiExample URLencoded example usage:
 * curl -X POST \
  localhost:3001/api/bookings \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'firstName=Jim&lastName=Brown&totalPrice=111&depositPaid=true&bookingDates%5BcheckIn%5D=2018-01-01&bookingDates%5Bcheckout%5D=2018-01-02'
 * 
 * @apiSuccess {Number}  bookingId                     ID for newly created booking
 * @apiSuccess {Object}  booking                       Object that contains 
 * @apiSuccess {String}  booking.firstName             firstName for the guest who made the booking
 * @apiSuccess {String}  booking.lastName              lastName for the guest who made the booking
 * @apiSuccess {Number}  booking.totalPrice            The total price for the booking
 * @apiSuccess {Boolean} booking.depositPaid           Whether the deposit has been paid or not
 * @apiSuccess {Object}  booking.bookingDates          Sub-object that contains the checkIn and checkOut dates
 * @apiSuccess {Date}    booking.bookingDates.checkIn  Date the guest is checkIng in
 * @apiSuccess {Date}    booking.bookingDates.checkOut Date the guest is checkIng out
 * @apiSuccess {String}  booking.additionalNeeds       Any other needs the guest has
 * 
 * @apiSuccessExample {json} JSON Response:
 * HTTP/1.1 200 OK
 * 
 * {
    "bookingId": 1,
    "booking": {
        "firstName": "Jim",
        "lastName": "Brown",
        "totalPrice": 111,
        "depositPaid": true,
        "bookingDates": {
            "checkIn": "2018-01-01",
            "checkOut": "2019-01-01"
        },
        "additionalNeeds": "Breakfast"
    }
}
 * @apiSuccessExample {xml} XML Response:
 * HTTP/1.1 200 OK
 * 
 * <?xml version='1.0'?>
<created-booking>
    <bookingId>1</bookingId>
    <booking>
        <firstName>Jim</firstName>
        <lastName>Brown</lastName>
        <totalPrice>111</totalPrice>
        <depositPaid>true</depositPaid>
        <bookingDates>
            <checkIn>2018-01-01</checkIn>
            <checkOut>2019-01-01</checkOut>
        </bookingDates>
        <additionalNeeds>Breakfast</additionalNeeds>
    </booking>
</created-booking>
 * @apiSuccessExample {url} URL Response:
 * HTTP/1.1 200 OK
 * 
 * bookingId=1&booking%5BfirstName%5D=Jim&booking%5BlastName%5D=Brown&booking%5Btotalprice%5D=111&booking%5Bdepositpaid%5D=true&booking%5Bbookingdates%5D%5BcheckIn%5D=2018-01-01&booking%5Bbookingdates%5D%5Bcheckout%5D=2019-01-01
 */
router.post("/", function (req, res, next) {
  newBooking = req.body;
  if (req.headers["content-type"] === "text/xml")
    newBooking = newBooking.booking;

  validator.scrubAndValidate(newBooking, function (payload, msg) {
    if (!msg) {
      Booking.create(newBooking, function (err, booking) {
        if (err) res.sendStatus(500);
        else {
          const record = parse.bookingWithId(req, booking);

          if (!record) {
            res.sendStatus(418);
          } else {
            res.send(record);
          }
        }
      });
    } else {
      res.sendStatus(500);
    }
  });
});

/**
 * @api {put} /:id UpdateBooking
 * @apiName UpdateBooking
 * @apiGroup Booking
 * @apiVersion 1.0.0
 * @apiDescription Updates a current booking
 * 
 * @apiParam (Url Parameter) {Number} id                    ID for the booking you want to update
 * 
 * @apiParam (Request body) {String}  firstName             firstName for the guest who made the booking
 * @apiParam (Request body) {String}  lastName              lastName for the guest who made the booking
 * @apiParam (Request body) {Number}  totalPrice            The total price for the booking
 * @apiParam (Request body) {Boolean} depositPaid           Whether the deposit has been paid or not
 * @apiParam (Request body) {Date}    bookingDates.checkIn  Date the guest is checkIng in
 * @apiParam (Request body) {Date}    bookingDates.checkOut Date the guest is checkIng out
 * @apiParam (Request body) {String}  additionalNeeds       Any other needs the guest has
 * 
 * @apiHeader {string} Content-Type=application/json                    Sets the format of payload you are sending. Can be application/json or text/xml
 * @apiHeader {string} Accept=application/json                          Sets what format the response body is returned in. Can be application/json or application/xml
 * @apiHeader {string} [Cookie=token=&lt;token_value&gt;]                     Sets an authorization token to access the PUT endpoint, can be used as an alternative to the Authorization
 * @apiHeader {string} [Authorization=YWRtaW46cGFzc3dvcmQxMjM=]   Basic authorization header to access the PUT endpoint, can be used as an alternative to the Cookie header
 * 
 * @apiExample JSON example usage:
 * curl -X PUT \
  localhost:3001/api/bookings/1 \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Cookie: token=abc123' \
  -d '{
    "firstName" : "James",
    "lastName" : "Brown",
    "totalPrice" : 111,
    "depositPaid" : true,
    "bookingDates" : {
        "checkIn" : "2018-01-01",
        "checkOut" : "2019-01-01"
    },
    "additionalNeeds" : "Breakfast"
}'
 *
 * @apiExample XML example usage:
 * curl -X PUT \
  localhost:3001/booking/1 \
  -H 'Content-Type: text/xml' \
  -H 'Accept: application/xml' \
  -H 'Authorization: YWRtaW46cGFzc3dvcmQxMjM=' \
  -d '<booking>
    <firstName>James</firstName>
    <lastName>Brown</lastName>
    <totalPrice>111</totalPrice>
    <depositPaid>true</depositPaid>
    <bookingDates>
      <checkIn>2018-01-01</checkIn>
      <checkOut>2019-01-01</checkOut>
    </bookingDates>
    <additionalNeeds>Breakfast</additionalNeeds>
  </booking>'
 *
 * @apiExample URLencoded example usage:
 * curl -X PUT \
  localhost:3001/booking/1 \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Accept: application/x-www-form-urlencoded' \
  -H 'Authorization: YWRtaW46cGFzc3dvcmQxMjM=' \
  -d 'firstName=Jim&lastName=Brown&totalPrice=111&depositPaid=true&bookingDates%5BcheckIn%5D=2018-01-01&bookingDates%5Bcheckout%5D=2018-01-02'
 * 
 * @apiSuccess {String}  firstName             firstName for the guest who made the booking
 * @apiSuccess {String}  lastName              lastName for the guest who made the booking
 * @apiSuccess {Number}  totalPrice            The total price for the booking
 * @apiSuccess {Boolean} depositPaid           Whether the deposit has been paid or not
 * @apiSuccess {Object}  bookingDates          Sub-object that contains the checkIn and checkOut dates
 * @apiSuccess {Date}    bookingDates.checkIn  Date the guest is checkIng in
 * @apiSuccess {Date}    bookingDates.checkOut Date the guest is checkIng out
 * @apiSuccess {String}  additionalNeeds       Any other needs the guest has
 * 
 * @apiSuccessExample {json} JSON Response:
 * HTTP/1.1 200 OK
 * 
 * {
    "firstName" : "James",
    "lastName" : "Brown",
    "totalPrice" : 111,
    "depositPaid" : true,
    "bookingDates" : {
        "checkIn" : "2018-01-01",
        "checkOut" : "2019-01-01"
    },
    "additionalNeeds" : "Breakfast"
}
 * @apiSuccessExample {xml} XML Response:
 * HTTP/1.1 200 OK
 * 
 * <booking>
    <firstName>James</firstName>
    <lastName>Brown</lastName>
    <totalPrice>111</totalPrice>
    <depositPaid>true</depositPaid>
    <bookingDates>
      <checkIn>2018-01-01</checkIn>
      <checkOut>2019-01-01</checkOut>
    </bookingDates>
    <additionalNeeds>Breakfast</additionalNeeds>
</booking>
 *
 * @apiSuccessExample {url} URL Response:
 * HTTP/1.1 200 OK
 * 
 * firstName=Jim&lastName=Brown&totalPrice=111&depositPaid=true&bookingDates%5BcheckIn%5D=2018-01-01&bookingDates%5Bcheckout%5D=2019-01-01
 */
router.put("/:id", function (req, res, next) {
  if (
    globalLogins[req.cookies.token] ||
    globalLogins[req.headers.authorization]
  ) {
    updatedBooking = req.body;
    if (req.headers["content-type"] === "text/xml")
      updatedBooking = updatedBooking.booking;

    validator.scrubAndValidate(updatedBooking, function (payload, msg) {
      if (!msg) {
        Booking.update(req.params.id, updatedBooking, function (err) {
          Booking.get(req.params.id, function (err, record) {
            if (record) {
              const booking = parse.booking(req.headers.accept, record);

              if (!booking) {
                res.sendStatus(418);
              } else {
                res.send(booking);
              }
            } else {
              res.sendStatus(405);
            }
          });
        });
      } else {
        res.sendStatus(400);
      }
    });
  } else {
    res.sendStatus(403);
  }
});

/**
 * @api {patch} /:id PartialUpdateBooking
 * @apiName PartialUpdateBooking
 * @apiGroup Booking
 * @apiVersion 1.0.0
 * @apiDescription Updates a current booking with a partial payload
 * 
 * @apiParam (Url Parameter) {Number} id                      ID for the booking you want to update
 * 
 * @apiParam (Request body) {String}  [firstName]             firstName for the guest who made the booking
 * @apiParam (Request body) {String}  [lastName]              lastName for the guest who made the booking
 * @apiParam (Request body) {Number}  [totalPrice]            The total price for the booking
 * @apiParam (Request body) {Boolean} [depositPaid]           Whether the deposit has been paid or not
 * @apiParam (Request body) {Date}    [bookingDates.checkIn]  Date the guest is checkIng in
 * @apiParam (Request body) {Date}    [bookingDates.checkOut] Date the guest is checkIng out
 * @apiParam (Request body) {String}  [additionalNeeds]       Any other needs the guest has
 * 
 * @apiHeader {string} Content-Type=application/json                    Sets the format of payload you are sending. Can be application/json or text/xml
 * @apiHeader {string} Accept=application/json                          Sets what format the response body is returned in. Can be application/json or application/xml
 * @apiHeader {string} [Cookie=token=&lt;token_value&gt;]                     Sets an authorization token to access the PUT endpoint, can be used as an alternative to the Authorization
 * @apiHeader {string} [Authorization=YWRtaW46cGFzc3dvcmQxMjM=]   Basic authorization header to access the PUT endpoint, can be used as an alternative to the Cookie header
 * 
 * @apiExample JSON example usage:
 * curl -X PUT \
  localhost:3001/api/bookings/1 \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'Cookie: token=abc123' \
  -d '{
    "firstName" : "James",
    "lastName" : "Brown"
}'
 *
 * @apiExample XML example usage:
 * curl -X PUT \
  localhost:3001/booking/1 \
  -H 'Content-Type: text/xml' \
  -H 'Accept: application/xml' \
  -H 'Authorization: YWRtaW46cGFzc3dvcmQxMjM=' \
  -d '<booking>
    <firstName>James</firstName>
    <lastName>Brown</lastName>
  </booking>'
 *
 * @apiExample URLencoded example usage:
 * curl -X PUT \
  localhost:3001/booking/1 \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Accept: application/x-www-form-urlencoded' \
  -H 'Authorization: YWRtaW46cGFzc3dvcmQxMjM=' \
  -d 'firstName=Jim&lastName=Brown'
 * 
 * @apiSuccess {String}  firstName             firstName for the guest who made the booking
 * @apiSuccess {String}  lastName              lastName for the guest who made the booking
 * @apiSuccess {Number}  totalPrice            The total price for the booking
 * @apiSuccess {Boolean} depositPaid           Whether the deposit has been paid or not
 * @apiSuccess {Object}  bookingDates          Sub-object that contains the checkIn and checkOut dates
 * @apiSuccess {Date}    bookingDates.checkIn  Date the guest is checkIng in
 * @apiSuccess {Date}    bookingDates.checkOut Date the guest is checkIng out
 * @apiSuccess {String}  additionalNeeds       Any other needs the guest has
 * 
 * @apiSuccessExample {json} JSON Response:
 * HTTP/1.1 200 OK
 * 
 * {
    "firstName" : "James",
    "lastName" : "Brown",
    "totalPrice" : 111,
    "depositPaid" : true,
    "bookingDates" : {
        "checkIn" : "2018-01-01",
        "checkOut" : "2019-01-01"
    },
    "additionalNeeds" : "Breakfast"
}
 * @apiSuccessExample {xml} XML Response:
 * HTTP/1.1 200 OK
 * 
 * <booking>
    <firstName>James</firstName>
    <lastName>Brown</lastName>
    <totalPrice>111</totalPrice>
    <depositPaid>true</depositPaid>
    <bookingDates>
      <checkIn>2018-01-01</checkIn>
      <checkOut>2019-01-01</checkOut>
    </bookingDates>
    <additionalNeeds>Breakfast</additionalNeeds>
</booking>
 *
 * @apiSuccessExample {url} URL Response:
 * HTTP/1.1 200 OK
 * 
 * firstName=Jim&lastName=Brown&totalPrice=111&depositPaid=true&bookingDates%5BcheckIn%5D=2018-01-01&bookingDates%5Bcheckout%5D=2019-01-01
 */
router.patch("/:id", function (req, res) {
  if (
    globalLogins[req.cookies.token] ||
    globalLogins[req.headers.authorization]
  ) {
    updatedBooking = req.body;

    if (req.headers["content-type"] === "text/xml")
      updatedBooking = updatedBooking.booking;

    Booking.update(req.params.id, updatedBooking, function (err) {
      Booking.get(req.params.id, function (err, record) {
        if (record) {
          const booking = parse.booking(req.headers.accept, record);

          if (!booking) {
            res.sendStatus(500);
          } else {
            res.send(booking);
          }
        } else {
          res.sendStatus(405);
        }
      });
    });
  } else {
    res.sendStatus(403);
  }
});

/**
 * @api {delete} /:id DeleteBooking
 * @apiName DeleteBooking
 * @apiGroup Booking
 * @apiVersion 1.0.0
 * @apiDescription Deletes a booking by given ID
 *
 * @apiParam (Url Parameter) {Number} id  ID for the booking you want to delete
 * 
 * @apiHeader {string} [Cookie=token=&lt;token_value&gt;]                     Sets an authorization token to access the DELETE endpoint, can be used as an alternative to the Authorization
 * @apiHeader {string} [Authorization=YWRtaW46cGFzc3dvcmQxMjM=]   Basic authorization header to access the DELETE endpoint, can be used as an alternative to the Cookie header
 * 
 * @apiExample Example 1 (Cookie):
 * curl -X DELETE \
  localhost:3001/api/bookings/1 \
  -H 'Content-Type: application/json' \
  -H 'Cookie: token=abc123'
 *
 * @apiExample Example 2 (Basic auth):
 * curl -X DELETE \
  localhost:3001/api/bookings/1 \
  -H 'Content-Type: application/json' \
  -H 'Authorization: YWRtaW46cGFzc3dvcmQxMjM='
 * 
 * @apiSuccess {String} OK Default HTTP 201 response
 * 
 * @apiSuccessExample {json} Response:
 *     HTTP/1.1 201 Created
*/
router.delete("/:id", function (req, res, next) {
  if (
    globalLogins[req.cookies.token] ||
    globalLogins[req.headers.authorization]
  ) {
    Booking.get(req.params.id, function (err, record) {
      if (record) {
        Booking.delete(req.params.id, function (err) {
          res.sendStatus(201);
        });
      } else {
        res.sendStatus(405);
      }
    });
  } else {
    res.sendStatus(403);
  }
});

module.exports = router;
