

export default function classifyNews(text) {
    const categories = {
        'Tech': ['technology', 'software', 'programming', 'AI', 'machine learning'],
        'Business': ['finance', 'stocks', 'market', 'investment', 'economy'],
        'Tourism': ['travel', 'destination', 'vacation', 'hotel', 'sightseeing'],
        'Health': ['health', 'medical', 'doctor', 'hospital', 'wellness'],
        'Sports': ['sports', 'football', 'basketball', 'soccer', 'fitness'],
        'Entertainment': ['entertainment', 'movies', 'music', 'celebrities', 'art'],
        'Food': ['food', 'restaurant', 'cooking', 'recipes', 'cuisine']
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