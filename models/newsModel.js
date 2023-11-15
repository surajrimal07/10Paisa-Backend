import crypto from 'crypto';
import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
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
}, { collection: 'news' });

newsSchema.index({ unique_key: 1 }, { unique: true });

newsSchema.pre('save', function (next) {
  const hash = crypto.createHash('sha256');
  hash.update(this.title + this.pubDate);
  this.unique_key = hash.digest('hex');
  next();
});

const newsModel = mongoose.model('newsModel', newsSchema);

export default newsModel;
