const axios = require('axios');

class XApi {
    static async getRetweets(tweetId) {
        try {
            const response = await axios.get(`https://api.x.com/2/tweets/${tweetId}/retweeted_by`, {
                headers: {
                    Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`,
                },
            });
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching retweets:', error.message);
            return [];
        }
    }
}

module.exports = XApi;