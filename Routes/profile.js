const express = require('express');
const router = express.Router();
const auth  = require('../middleware/auth');
const Profiledb = require('../models/profiledb');
const User = require('../models/userdb');
const request = require('request');
const GithubClientID = require('../config/default.json');
const GithubSecret = require('../config/default.json')
const {check ,validationResult} = require('express-validator');

//route GET api/profile/me
//@desc GET current user profile
//@access public
router.get('/me' , auth , async(req,res)=>{
  try{
    const Profile = await Profiledb.findOne({user:req.user.id}).populate('user',['name','avatar']);
    if(!Profile){
      return res.status(400).json({msg:'There is no profile for this user'});
    }
    res.json(Profile);
  }catch(err){
    console.error(err.message);
    res.status(500).send('server error');
  }
});

//route GET api/profile
//@desc GET all profiles
//@access public
router.get('/', async(req,res)=>{
  try{
    const profiles = await Profiledb.find().populate('user',['name','avatar']);
    res.json(profiles);
  }catch(err){
    console.error(err.message);
    res.status(500).send('server error');
  }
});

//route POST api/profile
//@desc create or update profile
//@access private
router.post('/',[auth,
  check('status','Status is required').not().isEmpty(),
  check('skills','Skills is required').not().isEmpty()
],async (req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,facebook,
    twitter,
    instagram,
    linkedin
  } = req.body;

  //Build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if(company) profileFields.company = company;
  if(website) profileFields.website = website;
  if(location)profileFields.location = location;
  if(bio) profileFields.bio = bio;
  if(status) profileFields.status = status;
  if(githubusername) profileFields.githubusername = githubusername;
  if(skills){
    profileFields.skills = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim());
  }

  // Build social object
  profileFields.social = {}
  if(youtube) profileFields.social.youtube = youtube;
  if(twitter) profileFields.social.twitter = twitter;
  if(facebook) profileFields.social.facebook = facebook;
  if(linkedin) profileFields.social.linkedin = linkedin;
  if(instagram) profileFields.social.instagram = instagram;

  try{
    let profile = await Profiledb.findOne({user:req.user.id});
    if(profile){
      //update
      profile = await Profiledb.findOneAndUpdate({user:req.user.id},{$set:profileFields},{new:true});

      return res.json(profile);
    }
    //create
    profile = new Profiledb(profileFields);
    await profile.save();
    res.json(profile);
  }catch(err){
    console.error(err.message);
    res.status(500).send('server error')
  }
})



//route DELETE api/profile/
//@desc delete profile , user & posts
//@access public
router.delete('/', auth , async(req,res)=>{
  try{
    //remove user and posts
    await Profiledb.findOneAndDelete({user:req.user.id});
    await User.findOneAndDelete({_id:req.user.id});
    res.json({msg:'User deletd'});
  }catch(err){
    console.error(err.message);
    res.status(500).send('server error');
  }
});

//route PUT api/profile/experience
//@desc add profile experience
//@access private
router.put('/experience', [auth,
  check('title','Title is required').not().isEmpty(),
  check('company','company is required').not().isEmpty(),
  check('from','From date is required').not().isEmpty()
] , async(req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
  }

  const {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  } = req.body;

  const newexp = {
    title, 
    company, 
    location, 
    from, 
    to, 
    current, 
    description
  }

  try {
    console.log('req.user.id:', req.user.id);
    console.log('req.user:', req.user);
    const profile = await Profiledb.findOne({user:req.user.id});
    console.log('Found profile:', profile);
    if(!profile){
      return res.status(400).json({msg:'Profile not found'});
    }
    profile.experience.unshift(newexp);
    await profile.save();
    res.json('update successful')
  } catch (err) {
    console.error('Experience route error:', err);
    res.status(500).send('server error');
  }
});

//route GET api/profile/user/:userId
//@desc get profile by user id
//@access public
router.get('/user/:userId', async(req,res)=>{
  try {
    const profile = await Profiledb.findOne({user:req.params.userId}).populate('user',['name','avatar']);

    if(!profile) return res.status(400).json({msg:'Profile not found'});
    res.json(profile);
  } catch (err){
    console.error(err.message);
    if(err.kind === 'ObjectId'){
      return res.status(400).json({msg:'Profile not found'}); 
    }
    res.status(500).send('server error');
  }
});

//route DELETE api/profile/experience/:exp_id
//@desc delete experience from the profile
//@access private
router.delete('/experience/:exp_id' , auth , async (req,res)=>{
  try {
    const profile = await Profiledb.findOne({user:req.user.id});
    // get the remove experience
    const removeidx = profile.experience.findIndex(item => item.id === req.params.exp_id);
    profile.experience.splice(removeidx,1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(err.message);
    return res.status(500).send('server error');
  }
});


//route PUT education
//@desc add education
//@access private//school,degree,fieldofstudy,from,to,current,description
router.put('/education', [auth,
  check('school','school is required').not().isEmpty(),
  check('degree','degree is required').not().isEmpty(),
  check('fieldofstudy','field of study is required').not().isEmpty(),
  check('from','From date is required').not().isEmpty()
] , async(req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
  }

  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  } = req.body;

  const newedu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description
  }

  try {
    console.log('req.user.id:', req.user.id);
    console.log('req.user:', req.user);
    const profile = await Profiledb.findOne({user:req.user.id});
    console.log('Found profile:', profile);
    if(!profile){
      return res.status(400).json({msg:'Profile not found'});
    }
    profile.education.unshift(newedu);
    await profile.save();
    res.json('update successful')
  } catch (err) {
    console.error('education route error:', err);
    res.status(500).send('server error');
  }
});

//route DELETE api/profile/education/:edu_id
//@desc delete education from the profile
//@access private
router.delete('/education/:edu_id' , auth , async (req,res)=>{
  try {
    const profile = await Profiledb.findOne({user:req.user.id});
    // get the removeeducation
    const removeidx = profile.education.findIndex(item => item.id === req.params.edu_id);
    profile.education.splice(removeidx,1);
    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(err.message);
    return res.status(500).send('server error');
  }
});

//route GET api/profile/github/:username
//@desc get user reops from github
//@access public
router.get('/github/:username',(req,res)=>{
  try {
    const option = {
      uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${GithubClientID}&client_sevret=${GithubSecret}`,
      method:'GET',
      headers:{'user-agent':'node.js'}
    };

    request(option,(error,response,body)=>{
      if(error) console.error(error);
      if(response.statusCode!==200){
        return res.status(400).json({msg:'No github profile found'});
      }
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;