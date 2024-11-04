const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const formschema =new  mongoose.Schema({
    title : {
        type : String,
        required : true,
    },
    description : String,
    createdAt : {
        type:Date,
        default : Date.now()
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },

})
const form = mongoose.model("form",formschema);
module.exports = form;