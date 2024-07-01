const rules = require('./validationRules'),
    validate = require('validate.js');

exports.scrubAndValidate = function(payload, callback){
  if(payload.firstName){
      payload.firstName = payload.firstName.trim();
  }

  if(payload.lastName){
      payload.lastName = payload.lastName.trim();
  }

  callback(payload, validate(payload, rules.returnRuleSet()))
};
