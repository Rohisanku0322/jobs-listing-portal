const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var router = express.Router();

const keys = require("../config/keys");
const auth = require("../middleware/auth");
const { validateUserInput, validateRecruiterInput, validateApplicantInput } = require("../validation");
// Load User model
const User = require("../models/Users");
 
// Getting all the users
router.get("/", function(req, res) {
    User.find(function(err, users) {
		if (err) {
			console.log(err);
		} else {
			res.json(users);
		}
	})
});

// Add a user to db
router.post("/register", (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const role = req.body.role;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    
    const contact = req.body.contact;
    // const bio = req.body.bio;

    const { valid, errors } = validateUserInput(email, name, role, password, confirmPassword)
    
    if(!valid)
    {
        return res.status(400).json({
            error: errors
        });
    }

    if (req.body.role == "Applicant")
    {
        const { valid, errors } = validateApplicantInput(req.body.institution, req.body.startYear, req.body.endYear)
        
        if(!valid)
        {
            return res.status(400).json({
                error: errors
            });
        }
    }

    else if (req.body.role == "Recruiter")
    {
        const { valid, errors } = validateRecruiterInput(req.body.contact)
        
        if(!valid)
        {
            return res.status(400).json({
                error: errors
            });
        }
    }
            
	User.findOne({ email }).then(user => {
		// Check if user email exists
        try
        {
            if (!user) 
            {
                const newUser = new User({
                    role: req.body.role,
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password,
                    bio: req.body.bio,
                    contact: Number(req.body.contact),
                    education: [
                        {
                            institution: req.body.institution,
                            startYear: req.body.startYear,
                            endYear: req.body.endYear
                        }
                    ],
                    skills: req.body.skills
                });

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => res.json(user))
                        .catch(err => console.log(err));
                    });
                });
            } 

            else
            {
                return res.status(409).json({
                    userError: "User already registered!"
                });
            }
        }
        
        catch (err) 
        {
            res.status(500).send("Error: User could not be saved");
        }
	});
});

// Login
router.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    
	User.findOne({ email }).then(user => {
		// Check if user email exists
        if (!user) 
        {
			return res.status(404).json({
				error: "User not found"
			});
        }

        else
        {
            bcrypt.compare(password, user.password).then(isMatch => {
                if (isMatch) 
                {
                    const payload = {
                        user: {
                            id: user.id
                          }
                    };
            
                    jwt.sign(
                    payload,
                    keys.secretOrKey,
                    {
                        expiresIn: 3600
                    },
                    (err, token) => {
                        if (err) throw err;
                        res.status(200).json({
                            success: true,
                            token: "Bearer " + token
                        });
                    });
                }
            
                else
                {
                    return res.status(400).json({
                        error: "Passwords do not match!"
                    });
                }
            });
	    }
    });
});

router.post("/addJob/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.jobsApplied.push({ _id: req.body._id });
        await user.save();
        res.status(200).json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ userError: "Error: Job Listing could not be added" });
    }
});


router.post("/editUser/:id", async (req, res) => {
    if (req.body.role === "Recruiter") {
        const { valid, errors } = validateRecruiterInput(req.body.contact);
        if (!valid) {
            return res.status(400).json({ error: errors });
        }
    }

    try {
        const user = await User.findById(req.params.id);
        if (req.body.contact) user.contact = req.body.contact;
        if (req.body.bio) user.bio = req.body.bio;
        if (req.body.education) {
            user.education = req.body.education.map(edu => ({
                institution: edu.institution,
                startYear: edu.startYear,
                endYear: edu.endYear
            }));
        }
        if (req.body.skills) user.skills = req.body.skills;
        if (req.body.rating) user.rating = (user.rating + req.body.rating) / 2;
        await user.save();
        res.status(200).json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ userError: "Error: User details could not be updated" });
    }
});


router.get("/me", auth, async (req, res) => {
    try 
    {
      const user = await User.findById(req.user.id);
      res.json(user);
    } 
    
    catch (e) 
    {
      res.send({ message: "Error in Fetching user" });
    }
  });

router.get("/getApp/:id", async (req, res) => {
    try 
    {
      const user = await User.findById(req.params.id);
      res.json(user);
    } 
    
    catch (e) 
    {
      res.send({ message: "Error in fetching applicant" });
    }
  });

router.post("/getApps", async (req, res) => {
    try 
    {
        var users = [];
    
        for(var i = 0; i < req.body.applicantIds.length; i++)
        {
            const user = await User.findById(req.body.applicantIds[i]._id);
            users.push(user);
        }

        res.status(200).json({users: users});
    } 
    
    catch (e) 
    {
      res.send({ message: "Error in fetching applicant" });
    }
  });

module.exports = router;
