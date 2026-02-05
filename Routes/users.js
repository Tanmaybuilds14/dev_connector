const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwtsecret = config.get('jwtSecret');
const jwt = require('jsonwebtoken');
const User = require('../models/userdb');

// route: POST / (create user)
// desc: Test route
// access: public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include an email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {
      let user = await User.findOneAndUpdate({name: req.body.name}, {upsert: true});
      // see if user exists
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // get user's gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      user = new User({
        name,
        email,
        avatar,
        password
      });

      // encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = {
        user:{
          id : user.id
        }
      }

      jwt.sign(
        payload,
        jwtsecret,
        {expiresIn:360000}, 
        (err,token)=>{
          if(err) throw err;
          res.json({token, msg: 'User registered'});
        });

      console.log('POST /api/users body:', req.body);

    } catch (err) {
      console.error(err.message);
      res.status(500).send('server error');
    }
    
    
  }
);

// quick test endpoint: GET /test
router.get('/test', (req, res) => res.send('Users route OK'));

module.exports = router;