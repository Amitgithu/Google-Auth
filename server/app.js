// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const express = require("express");
const app = express();
const cors = require("cors");
require("./db/connection"); // Database connection setup
const PORT = 8080;
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const userdb = require("./model/userSchema"); // User schema for MongoDB

// Google OAuth credentials
const clientid = "YOUR GOOGLE CLIENTID";
const clientsecret = "YOUR GOOGLE CLIENTSECRET";

// Middleware to handle CORS (Cross-Origin Resource Sharing)
app.use(cors({
    origin: "http://localhost:5173", // Frontend origin
    methods: "GET,POST,PUT,DELETE", // Allowed HTTP methods
    credentials: true // Allow credentials (cookies, authorization headers)
}));

// Middleware to parse JSON request bodies
app.use(express.json());

// Setup session middleware
app.use(session({
    secret: "YOUR SECRET KEY", // Secret key for session encryption
    resave: false, // Do not save session if unmodified
    saveUninitialized: true // Save uninitialized sessions
}));

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session()); // Persistent login sessions

// Configure Google OAuth strategy
passport.use(
    new OAuth2Strategy({
        clientID: clientid,
        clientSecret: clientsecret,
        callbackURL: "/auth/google/callback", // Callback URL after Google authentication
        scope: ["profile", "email"] // Scopes for Google profile and email
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if the user already exists in the database
            let user = await userdb.findOne({ googleId: profile.id });

            // If user does not exist, create a new user
            if (!user) {
                user = new userdb({
                    googleId: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    image: profile.photos[0].value
                });

                // Save the new user to the database
                await user.save();
            }

            // Return the user object
            return done(null, user);
        } catch (error) {
            // Handle any errors that occur
            return done(error, null);
        }
    })
);

// Serialize user into the session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
    done(null, user);
});

// Route for initiating Google OAuth login
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Route for handling Google OAuth callback
app.get("/auth/google/callback", passport.authenticate("google", {
    successRedirect: "http://localhost:5173/dashboard", // Redirect on successful authentication
    failureRedirect: "http://localhost:5173/login" // Redirect on failed authentication
}));

// Route to check if the user is logged in
app.get("/login/success", async (req, res) => {
    if (req.user) {
        res.status(200).json({ message: "User logged in", user: req.user });
    } else {
        res.status(400).json({ message: "Not authorized" });
    }
});

// Route for logging out the user
app.get("/logout", (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect("http://localhost:5173"); // Redirect to homepage after logout
    });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server started at port ${PORT}`);
});
