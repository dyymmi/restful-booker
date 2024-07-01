const js2xmlparser = require("js2xmlparser"),
    formurlencoded = require('form-urlencoded').default,
    date = require('date-and-time');

exports.bookingIds = function(req, rawBooking){
  const payload = [];

  rawBooking.forEach(function(b){
    const tmpBooking = {
      bookingId: b.bookingId,
    };

    payload.push(tmpBooking);
  });

  return payload;
}

exports.booking = function(accept, rawBooking){
  try {
    const booking = {
      'firstName': rawBooking.firstName,
      'lastName': rawBooking.lastName,
      'totalPrice': parseInt(rawBooking.totalPrice),
      'depositPaid': Boolean(rawBooking.depositPaid),
      'bookingDates': {
        'checkIn': date.format(new Date(rawBooking.bookingDates.checkIn), 'YYYY-MM-DD'),
        'checkOut': date.format(new Date(rawBooking.bookingDates.checkOut), 'YYYY-MM-DD'),
      }
    };

    if(typeof(rawBooking.additionalNeeds) !== 'undefined'){
      booking.additionalNeeds = rawBooking.additionalNeeds;
    }

    switch(accept){
      case 'application/xml':
        return js2xmlparser.parse('booking', booking);
      case 'application/json':
        return booking;
      case 'application/x-www-form-urlencoded':
        return formurlencoded(booking);
      case '*/*':
        return booking;
      default:
        return null;
    }
  } catch(err) {
    return err.message;
  }
}

exports.bookingWithId = function(req, rawBooking){
  try {
    const booking = {
      'firstName': rawBooking.firstName,
      'lastName': rawBooking.lastName,
      'totalPrice': parseInt(rawBooking.totalPrice),
      'depositPaid': Boolean(rawBooking.depositPaid),
      'bookingDates': {
        'checkIn': date.format(new Date(rawBooking.bookingDates.checkIn), 'YYYY-MM-DD'),
        'checkOut': date.format(new Date(rawBooking.bookingDates.checkOut), 'YYYY-MM-DD'),
      }
    };

    if(typeof(rawBooking.additionalNeeds) !== 'undefined'){
      booking.additionalNeeds = rawBooking.additionalNeeds;
    }

    const payload = {
      "bookingId": rawBooking.bookingId,
      "booking": booking
    };

    switch(req.headers.accept){
      case 'application/xml':
        return js2xmlparser.parse('created-booking', payload);
      case 'application/json':
        return payload;
      case 'application/x-www-form-urlencoded':
        return formurlencoded(payload);
      case '*/*':
        return payload;
      default:
        return null;
    }
  } catch(err) {
    return err.message;
  }
}
