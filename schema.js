const Joi = require('joi');
const form = require('./models/form');

module.exports.formschema = Joi.object({
        title : Joi.string().required(),
         description : Joi.string().required(),
         });