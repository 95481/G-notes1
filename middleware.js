const form = require("./models/form.js");
module.exports. isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
      req.session.redirectUrl = req.originalUrl;
      req.flash("error","You must be logged In!");
      return res.redirect("/login");
    }
    next();
}
module.exports.saveRedirecturl = (req,res,next)=>{
    if(req.session.redirectUrl){
      res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
  
  };
  module.exports.isOwner = async(req,res,next)=>{
    let{id} = req.params;
    let forms = await form.findById(id);
    if(!forms.owner.equals(res.locals.currUser._id)){
        req.flash("error","you are not the owner");
        return res.redirect(`/form`);
    }
  next();
  }
