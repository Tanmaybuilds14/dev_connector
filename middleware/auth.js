const jwt = require('jsonwebtoken');
const config = require('config');


const auth = function(req,res,next){
  //get token from header
  const token = req.header('x-auth-token');

  //check if not token
  if(!token){
    return res.status(401).json(({msg:'No token authorization denied'}));
  }

  //verify token
  try{
    const decoded = jwt.verify(token,config.get('jwtSecret'));
    req.user = decoded.user;
    next();
  }catch(err){
    console.error('Token verification failed:', err.message);
    res.status(401).json({msg:"token is not valid"});
  }
}
module.exports = auth;