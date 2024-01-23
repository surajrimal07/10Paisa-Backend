import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const watchlistSchema = new Schema({
    user: {
        type: String,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    stocks: [{
        type: String,
        ref: 'Asset'
    }],
});

const Watchlist = mongoose.model('Watchlist', watchlistSchema);

export default Watchlist;
