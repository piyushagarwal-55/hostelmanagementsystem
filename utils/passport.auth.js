const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy; 

const User = require('../models/user.model')
passport.use(
    new LocalStrategy({
        usernameField:'email',
        passwordField:'password'
    },async(email,password,done)=>{
       try {
        const user = await User.findOne({email});


        if(!user){
          return done(null,false,{message:'Username/email not registered'})
        }
        const isMatch = await user.isValidPassword(password);
        if(isMatch){
            return done(null,user);
        }
        else{
            return done(null,false,{message : "Incorrect Password"})
        }

       } catch (error) {
        done(error);
       }
    })
)






passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});
