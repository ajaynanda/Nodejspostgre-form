const {Client} = require("pg")
const client = new Client()
const express= require("express")
require("dotenv").config();
const app =  express()
const session= require("express-session")
const flash = require("express-flash")
const {pool} = require("./dbconfig");
const bcrypt=require("bcrypt")
const passport = require("passport");
const initializePassport = require("./passportconfig")
initializePassport(passport)
const PORT=process.env.port || 5000;
app.set('view engine','ejs')
app.listen(5000,()=>console.log(`server running on ${PORT}`))
app.use(express.static('../FSWD-MAJOR-JULY'))
app.use(express.urlencoded({extended:false}))
app.use(session({
    secret : 'secret',
    resave:false,
    saveUninitialized:false
})
)   
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.get("/",checkAuthenticated,(req,res)=>{
  res.render("index")
})
app.get("/login",checkAuthenticated,(req,res)=>{
  
    res.render("login")
})

app.get("/logout",(req,res)=>{
    req.logOut()
    req.flash("success_msg", "you have logged out")
    res.redirect("login")
})
app.get("/dashboard",checkNotAuthenticated,(req,res)=>{
    res.render("dashboard",{user:"ajay"} )
});

app.post("/login",async(req,res)=>{
    let{name , phone , email , password} = req.body;
    console.log({
        name,
        phone,
        email,
        password
    }); 
   //form validations
    let errors=[];

   
    if(password.length < 6){
        errors.push ({message:"Password should contain atleast 6 characters"})
    }
    if(phone.length!=10){
errors.push({message:"Please enter valid phone number"})
    }
    if (errors.length > 0){
        res.render("index", {errors,name,phone,email,password});
        console.log("Error login of user");
    }else{
        console.log({
            name,
            phone,
            email,
            password
        }); 
    //to store hasshpassword in database
        let hashpwd= await bcrypt.hash(password,10);
        console.log(hashpwd);
    
      //to verify if email is already registered
        pool.query(
            `SELECT * FROM students
            WHERE email=$1`,[email],(err,results)=>{
if(err){
    throw err;
}
console.log(results.rows)
if(results.rows.length > 0){
    errors.push({message:"email already regstered"})
    res.render("index",{errors})
   
}
//storing data to database
else{
    
   pool.query( `INSERT INTO students (name,phone,email,password)
    VALUES($1,$2,$3,$4)
    RETURNING id, password`,
    [name,phone,email,hashpwd],(err,results)=>{
        if(err)  throw err
        console.log("Saved to database");
        console.log(results.rows);
        req.flash('success_msg',"You have successfully registered..... please log in")
        res.redirect("login")
    }
   )
}
            }
        )
    }
    
})
//passport authentication

app.post("/login",passport.authenticate("local",{
successRedirect: "/dashboard",
failureRedirect: "/login",
failureFlash:true


})
)
function checkAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        res.redirect("/dashboard")
    }
    next()
}
function checkNotAuthenticated(req,res,next){
    if(req.isAuthenticated()){
    
    return next()
    }
    res.redirect("/login")
}

pool.connect();
pool.query(`select * from students`,(err,results)=>{
    if (!err){
        console.log(results.rows);
    }
    if(err){
        console.log("404 found");
    }
    pool.end()
})
