const express = require('express');
const router = express.Router();
const {check,validationResult} = require('express-validator');
const auth  = require('../middleware/auth');
const Post = require('../models/postdb');
const Profile = require('../models/profiledb');
const User = require('../models/userdb');


//route GET api/posts
//@desc Create a post
//@access private
router.post('/',[auth,
  [
  check('text','Text is required').not().isEmpty()
]
],
async (req,res)=>{
   const errors = validationResult(req);
   if(!errors.isEmpty()){
    return res.status(500).json({errors : errors.array()});
   }


   try {
    const user = await User.findById(req.user.id).select('-password');

    const newPost = new Post({
     text:req.body.text,
     name:user.name,
     avatar:user.avatar,
     user:req.user.id
   });

   const post = await newPost.save();
   res.json(post);
   } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
   }
   
});

//route GET api/posts
//@desc get all posts
//@access private
router.get('/',auth, async (req,res)=>{
  try {
    const posts = await Post.find().sort({date:-1});
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
    
  }
});

//route GET api/posts
//@desc get posts by id
//@access private
router.get('/:id',auth, async (req,res)=>{
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(404).json({msg:'Post not found'});
    }
    const post = await Post.findById(req.params.id);
    if(!post){
      return res.status(404).json({msg:'Post not found'});
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    if(error.kind === 'ObjectId'){
      return res.status(404).json({msg:'Post not found'});
    }
    res.status(500).send('Server error');
    
  }
});


//route DELETE
//@desc delete posts
//@access private
router.delete('/:id',auth, async (req,res)=>{
  try {
    if(!mongoose.Types.ObjectId.isValid(req.params.id)){
      return res.status(404).json({msg:'Post not found'});
    }
    const post = await Post.findById(req.params.id);

    if(!post){
      return res.status(404).json({msg:'Post not found'});
    }
    //check on user
    if(post.user.toString()!==req.user.id){
      return res.status(404).json({msg:'user not authorized'});
    }

    await post.deleteOne();

    res.json({msg:'Post removed'});
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server error');
    
  }
});


//route PUT api/posts/like/:id
//@desc like a post
//@access private
router.put('/like/:id',auth,async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);

    //check if the post is already been liked
    if(post.likes.filter((like)=>String(like.user)===req.user.id).length>0){
     return res.status(400).json({msg:'Post already liked'});
    }
    post.likes.unshift({user:req.user.id});
    await post.save();


    res.json(post.likes);


  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

//route PUT api/posts/unlike/:id
//@desc unlike a post
//@access private
router.put('/unlike/:id',auth,async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);

    //check if the post is already been liked
    if(post.likes.filter((like)=>String(like.user)===req.user.id).length===0){
     return res.status(400).json({msg:'Post is not liked'});
    }
    //Get remove index
    const removeindex = post.likes.map(like=>like.user.toString()).indexOf(req.user.id);
    post.likes.splice(removeindex,1);
    await post.save();


    res.json(post.likes);


  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});


//route PUT api/posts/comment/:id
//@desc comment on a post
//@access private
router.post('/comment/:id',[auth,
  check('text','text is required')
  .not()
  .isEmpty()
], async(req,res)=>{
    const errors = validationResult(req);
   if(!errors.isEmpty()){
    return res.status(500).json({errors : errors.array()});
   }


   try {
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.id);


    const newcomment = {
     text:req.body.text,
     name:user.name,
     avatar:user.avatar,
     user:req.user.id
   };


   post.comments.unshift(newcomment);

   await post.save();

   res.json(post.comments);
   } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
   }
   
});

//route DELETE api/posts/comment/:id/:comment_id
//@desc delete comment on a post
//@access private
router.delete('/comment/:id/:comment_id',auth, async (req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.find(comment=>comment.id===req.params.comment_id);
    if(!comment){
      return res.status(404).json({msg:'comment not found'});
    }
    //check on user
    if(comment.user.toString()!==req.user.id){
      return res.status(404).json({msg:'user not authorized'});
    }

    const removeindex = post.comments.map(comment=>comment.id.toString()).indexOf(req.params.comment_id);
    post.comments.splice(removeindex,1);
    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server error');
    
  }
});

module.exports = router;