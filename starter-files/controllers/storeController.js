const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: '🏬 Add Store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to create
  if(!req.file) {
    next();
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize the image
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our file system, keep going!
  next();
}
exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();;
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  //  1. Query the database for a list of all stores
  const stores = await Store.find();
  // 2. Pass data to the template
  res.render('stores', { title: 'Stores', stores});
};

exports.editStore = async (req, res) => {
  // 1. Find the store given the id
  const store =  await Store.findOne({ _id: req.params.id });

  // 2. Confirm they are the owner of that store
  //  TODO
  // 3. Render out the edit form so the user can update their store
  res.render('editStore', { title: `Edit ${store.name}`, store});
};

exports.updateStore = async (req, res) => {

  // set the location data to be a point
  req.body.location.type = 'Point';
  // find and update the store
  // find one and update takes 3 params i.e Store.findOneAndUpdate(query, data, )
  const store = await Store.findOneAndUpdate({ _id: req.params.id}, req.body, {
    new: true, // return the new store instead of the old one
    runValidators: true
  }).exec(); // run the query
  // redirect them to the store and tell them it worked
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store →</a>`);
  res.redirect(`/stores/${store._id}/edit`);
};