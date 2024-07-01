exports.returnRuleSet = function(){
  const constraints = {
    firstName: {presence: true},
    lastName: {presence: true},
    totalPrice: {presence: true},
    depositPaid: {presence: true},
    'bookingDates.checkIn': {presence: true},
    'bookingDates.checkOut': {presence: true},
  };

  return constraints
}
