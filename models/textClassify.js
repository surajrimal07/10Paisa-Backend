

export default function classifyNews(text) {
    const categories = {
        'Tech': ['technology', 'software', 'programming', 'AI', 'machine learning'],
        'Business': ['finance', 'stocks', 'market', 'investment', 'economy'],
        'Tourism': ['travel', 'destination', 'vacation', 'hotel', 'sightseeing'],
        'Health': ['health', 'medical', 'doctor', 'hospital', 'wellness'],
        'Sports': ['sports', 'football', 'basketball', 'soccer', 'fitness'],
        'Entertainment': ['entertainment', 'movies', 'music', 'celebrities', 'art'],
        'Food': ['food', 'restaurant', 'cooking', 'recipes', 'cuisine'],
        'Science': ['science', 'research', 'discovery', 'experiment', 'lab'],
        'Politics': ['politics', 'government', 'election', 'democracy', 'policy'],
        'National': ['nepal', 'kathmandu', 'pokhara', 'biratnagar', 'lalitpur'],
        'Nepse': ['nepse', 'stock', 'share', 'trading', 'invest', 'share', 'bajar', 'nepal stock', 'cdsc', 'ipo', 'dividend', 'bonus', 'right share', 'stock market', 'nepal stock exchange', 'nepal share market', 'nepal stock market',],
    };

    text = text.toLowerCase();

    for (const category in categories) {
        const keywords = categories[category];
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return category;
            }
        }
    }

    return 'National';
}