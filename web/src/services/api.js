import axios from 'axios';

const API_URL = 'https://sports-api-hazel.vercel.app/api';

export const api = axios.create({
    baseURL: API_URL,
});

export const getSports = async (dateFrom, dateTo) => {
    try {
        const response = await api.get('/get-sports', {
            params: { dateFrom, dateTo }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching sports:", error);
        return [];
    }
};

export const getLeagues = async (sportId, dateFrom, dateTo) => {
    try {
        const response = await api.get('/get-leagues', {
            params: { sportId, dateFrom, dateTo }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching leagues:", error);
        return [];
    }
};

export const getGames = async (champId, dateFrom, dateTo) => {
    try {
        const response = await api.get('/get-games', {
            params: { champId, dateFrom, dateTo }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching games:", error);
        return [];
    }
};

export const searchEvents = async (text) => {
    try {
        const response = await api.get('/search', {
            params: { text }
        });
        return response.data;
    } catch (error) {
        console.error("Error searching events:", error);
        return [];
    }
};
