const LocalStrategy=require("passport-local").Strategy
const { pool}=require("./dbconfig")
const bcrypt = require("bcrypt")

function initialize(passport){
    console.log("initialized");
    const authenticateUser = (email,password,done)=>{
        console.log(email,password);
        pool.query(`SELECT * FROM students WHERE email=$1`, [email],
        (err,results)=>{
            if (err) {
                throw err
            }
            console.log(results.rows);
            if(results.rows.length>0){
                const user = results.rows[0]
                bcrypt.compare(password,user.password,(err,isMatch)=>{
    if(err){
        console.log(err);
    }
    if(isMatch){
            return done(null,user);
    }else{
        return done(null,false,{message:"password is not correct"})
       
      
    }
 }) 
            } else{
                return done(null,false,{message:"Email not regisered"})
            }
        })
    }
    passport.use(
        new LocalStrategy({
            usernameField:"email",
            passwordField:"password"
        },authenticateUser)
    )
    passport.serializeUser((user,done)=>done(null,user.id))
    passport.deserializeUser((id,done)=>{
        pool.query(`select * from students where id =$1`, [id], (err,results)=>{
            if (err) throw err
            return done(null,results.rows(0))
        })
    }
    )
}


module.exports = initialize