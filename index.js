const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const ejsMate = require("ejs-mate");
const form = require("./models/form.js");
const ExpressError = require("./errorsutils/expressError.js");
const wrapAsync= require("./errorsutils/wrapAsync.js");
const {isLoggedIn,isOwner} = require("./middleware.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const {saveRedirecturl} = require("./middleware.js");
const {formschema} = require("./schema.js");
main()
.then((res)=>{
    // console.log(res);
    console.log("connection successful");
}
)
.catch((err)=>console.log(err));
async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/google-form");
};
app.set("views",path.join(__dirname,"views"));
app.set("view engine" , "ejs");
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended : true}));
const methodOverride = require("method-override");
// const chat = require("./models/chat.js");
app.use(methodOverride("_method"));
const User = require("./models/user.js");
const sessionOptions = {
    secret : "mysupersecretcode",
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires: Date.now()+ 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly:true,
    }}
        app.use(session(sessionOptions));
        app.use(flash());
        app.use(passport.initialize());
        app.use(passport.session());
        passport.use(new LocalStrategy(User.authenticate()));
        passport.serializeUser(User.serializeUser());
        passport.deserializeUser(User.deserializeUser());
       
        app.use((req,res,next)=>{
            res.locals.success = req.flash("success");
            res.locals.error= req.flash("error");
            res.locals.currUser = req.user;
            next();
        })
        const validateform = (req,res,next)=>{
            let {error}=  formschema.validate(req.body);
            if(error){
                let errmsg = error.details.map((el)=>el.message).join(",");
             throw new ExpressError(500 , errmsg);
            }
            next();
        }
// const newform = new form({
//     title: " workout session.",
//     description : " i will start it from tomorrow",
//     createdAt : new Date(),
// });
// newform.save().then((res)=>{
//     console.log(res);
// });
app.listen(8080,()=>{
    console.log("you are listening to the port 8080");
});
app.get("/form" , async(req,res)=>{
    let forms = await form.find();
     res.render("index.ejs",{forms});
});
app.post("/form",validateform,isLoggedIn,(req,res)=>{
    console.log(req.body); 
    let {title,description } = req.body;

    let newform = new form ({
        title : title ,
        description : description,
        createdAt : new Date(),
    });
    newform.owner=req.user._id;
    newform.save().then((res)=>{
        console.log("saved")
    });
    res.redirect("/form");
});
app.get("/form/:id/edit",isLoggedIn , isOwner,wrapAsync(async(req,res)=>{
    let {id}=req.params;
      let editform =  await form.findById(id);
        res.render("edit.ejs",{editform});
}))
app.put("/form/:id",validateform,wrapAsync(async(req,res)=>{
    let {id}=req.params;
    let {title : newtitle , description : newdescription} = req.body;
    let updatedform = await form.findByIdAndUpdate(id , {
        title : newtitle , description : newdescription},
    {runValidators:true,new:true}
);
res.redirect("/form");
 }));
 app.delete("/form/:id",wrapAsync(async (req,res)=>{
    let {id}=req.params;
    let deletedform = await form.findByIdAndDelete(id);
    res.redirect("/form");
 }));
 app.get("/signup",(req,res)=>{
    res.render("./user/signup.ejs");
});
 app.post("/signup" , wrapAsync(async(req,res)=>{
    try {
let{username,email,password}=req.body;
const newuser = new User({email,username});
const registeredUser = await User.register(newuser,password);
req.login(registeredUser,(err)=>{
    if(err){
        return next(err);
    }
    req.flash("success","Welcome to g-notes!");
    res.redirect("/form");
})}
catch(e){
    req.flash("error", e.message);
    res.redirect("/signup");
}

}));
app.get("/login" , (req,res)=>{
    res.render("./user/login");
});
app.post("/login", saveRedirecturl,passport.authenticate('local',{
    failureRedirect:"/login",
    failureFlash : true,
}) , wrapAsync( async(req,res)=>{
    req.flash("success","Welcome to g-notes!");
    let redirectUrl =  res.locals.redirectUrl || "/form";
    res.redirect(redirectUrl);
    }));
    app.get("/logout" , (req,res,next)=>{
        req.logout((err)=>{
            if(err){
                return next(err);
            }
            req.flash("success","you have been logged out!");
            res.redirect("/form");
        })
    });
 app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!"));
    })
 app.use((err,req,res,next)=>{
    let {statuscode=500,message="something went wrong"}=err;
    res.status(statuscode).render("alert.ejs",{err});
    // res.status(statuscode).send(message);
});