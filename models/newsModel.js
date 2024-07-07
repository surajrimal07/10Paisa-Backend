import crypto from 'crypto';
import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import mongooseSequence from 'mongoose-sequence';
import classifyNews from './textClassify.js';


const AutoIncrement = mongooseSequence(mongoose);

const newsSchema = new mongoose.Schema({
  id: {
    type: Number
  },
  title: {
    type: String,
    required: true,
  },
  link: String,
  description: String,
  img_url: String,
  pubDate: {
    type: String,
    required: true,
  },
  source: String,
  unique_key: {
    type: String,
    required: true,
    unique: true,
  },
  category: String,
  readingTime: Number,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d'
  }
}, { collection: 'news' });

newsSchema.plugin(AutoIncrement, { id: 'news_id', inc_field: 'id' });
newsSchema.plugin(mongoosePaginate);

newsSchema.index({ unique_key: 1 });

newsSchema.pre('save', function (next) {
  const hash = crypto.createHash('sha256');
  hash.update(this.title + this.pubDate);
  this.unique_key = hash.digest('hex');
  next();
});

newsSchema.pre('save', function (next) {
  this.category = classifyNews(this.title + this.description);
  next();
});

newsSchema.pre('save', function (next) {

  const readingTime = Math.ceil(this.description.split(' ').length / 3);
  this.readingTime = readingTime;
  next();
});



const newsModel = mongoose.model('newsModel', newsSchema);

export default newsModel;


