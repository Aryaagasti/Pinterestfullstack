var express = require('express');
var router = express.Router();
const User = require("../models/user.model.js");
const Post = require("../models/post.models.js")
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require("../routes/multer.js")




// Passport local strategy configuration
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/profile', isLoggedIn ,async(req, res, next)=> {
  try {
    const user = await User.findOne({username: req.session.passport.user})
    .populate("posts")
    console.log(user);
    res.render("profile",{user}),{title: 'Profile Page'}
  } catch (error) {
    
  }
 
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login Page', error: req.flash('error') });
});


router.get('/register', function(req, res, next) {
  res.render('index',{title: 'Pinterest Registeration'})
});

router.get('/feed', isLoggedIn, async (req, res, next) => {
  try {
      // Fetch the user's posts
      const loggedInUser = await User.findOne({ username: req.session.passport.user }).populate('posts');

       // Fetch posts of other users
    const otherUsersPosts = await Post.find({ userId: { $ne: loggedInUser._id } }).populate('userId');

      // Render the feed view and pass the user object to it
   // Render the feed view and pass the user object and other users' posts to it
   res.render('feed', { title: 'Pinterest Feed', user: loggedInUser, otherPosts: otherUsersPosts });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});


router.post("/register", async (req, res) => {
  try {
    // Destructure username, email, and fullname from request body
    const {username, email, fullname, password} = req.body;

    // Create a new user object with provided data
    const newUser = new User({username, email, fullname});

    // Register the user using passport-local-mongoose
    await User.register(newUser, password);

    // If registration succeeds, authenticate the user and redirect to profile
    passport.authenticate("local")(req, res, () => {
      res.redirect("/profile");
    });

  } catch (error) {
    // Handle registration errors, such as UserExistsError
    console.error(error);
    res.status(400).json({ error: "User registration failed." });
  }
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}));

router.get("/logout", (req, res) => {
  req.logout((err)=>{
    if(err){
      console.log(err);
      return next(err)
    }
    res.redirect('/')
  })
});

//implement multer
router.post('/upload', isLoggedIn,upload.single('file'), async(req, res) => {
 try {
  if (!req.file) {
    return res.status(400).send('No files were uploaded');

    //jo file upload hui hau use save karo as post and uska postid use and post ko
    //userid do
  }
  const user = await User.findOne({username: req.session.passport.user})
  const userId = req.user
  const createPost = await Post.create({image: req.file.filename, userId: userId._id, imageText: req.body.filecaption })

   user.posts.push(createPost._id);
   await user.save()

  res.redirect('/profile');
 } catch (error) {
  console.error(error);
    res.status(400).json({ error: "Fail to creating Post " });
 }
});

//deleting the post new route
router.post('/post/:postId', isLoggedIn, async(req,res)=>{
  try{
    const postId = req.params.postId;
    //vefiy the user has permisiin to delete the post
    const postToDelete = await Post.findById(postId)
    if(!postToDelete || !postToDelete.userId.equals(req.user._id)){
      return res.status(403).send('Unauthorized: You cannot delete this post');
    }
    await Post.deleteOne({_id: postId})

    //upadate the user posts array
    const user = await User.findById(req.user._id);
    user.posts.pull(postId)
    await user.save()
    res.redirect('/profile')
  }catch(error){
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
})

//impleme likes new route
router.post('/like/:postId',isLoggedIn, async(req,res)=>{
  try{
   const postId = req.params.postId
   const userId = req.user._id;

   const post = await Post.findById(postId)
   if(!post){
    return res.status(404).json({ error: "Post not found" });
   }
   //check if user has already like post
   const alreadyLiked = post.likes.includes(userId)
   if (alreadyLiked) {
    // Unlike the post
    post.likes.pull(userId);
} else {
    // Like the post
    post.likes.push(userId);
}

await post.save();

res.status(200).json({ message: "Post liked/unliked successfully" });

  }catch(error){
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
})

//route to upload profile picture
router.post('/uploadProfilePicture', isLoggedIn, upload.single('profilePicture'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    // Get the user by username
    const user = await User.findOne({ username: req.session.passport.user });

    // If user doesn't exist, create a new user
    if (!user) {
        const newUser = new User({ username: req.session.passport.user, profilePicture: req.file.filename });
        await newUser.save();
    } else {
        // If user exists, update the user's profile picture
        user.profilePicture = req.file.filename;
        await user.save();
    }

    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Middleware to check if user is authenticated
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
