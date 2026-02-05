const express = require('express');
const router = express.Router();
const auth  = require('../middleware/auth');
const User  = require('../models/userdb');
const bcrypt = require('bcryptjs');
const config = require('config');
const jwtsecret = config.get('jwtSecret');
const jwt = require('jsonwebtoken');
const {check,validationResult} = require('express-validator');
//route GET api/auth
//@desc Test route
//@access public
router.get('/',auth,async (req,res)=>{
  try{
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  }catch(err){
    console.error(err.message);
    res.status(500).send('server error');
  }
});

// route: POST / auth
// desc: authenticate user & get token
// access: public
router.post(
  '/',
  [
    check('email', 'Please include an email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      console.log('Auth attempt with email:', email);
      let user = await User.findOne({email});
      // see if user exists
      if (!user) {
        return res
        .status(400)
        .json({ errors: [{ msg: 'Invalid credentials'}] });
      }
      
      console.log('User found, comparing passwords...');
      const ismatch = await bcrypt.compare(password,user.password);

      if(!ismatch){
        return res
        .status(400)
        .json({ errors: [{ msg: 'Invalid credentials'}] });
      }

      console.log('Password matched, generating token...');
      const payload = {
        user:{
          id : user._id
        }
      }

      jwt.sign(
        payload,
        jwtsecret,
        {expiresIn:360000}, 
        (err,token)=>{
          if(err) {
            console.error('JWT sign error:', err.message);
            return res.status(500).json({msg: 'Server error'});
          }
          res.json({token, msg: 'User authenticated'});
        });

      console.log('POST /api/auth body:', req.body);

    } catch (err) {
      console.error('Auth route error:', err.message);
      res.status(500).send('server error');
    }
    
    
  }
);

module.exports = router;