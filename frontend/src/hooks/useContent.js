import { useState, useEffect } from 'react';
import api from '../services/api';

const useContent = (section) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/content/${section}`);
                setContent(response.data);
            } catch (err) {
                console.error(`Error fetching content for ${section}:`, err);
                setError(err);
                // Fallback to empty object to prevent crashes
                setContent({}); 
            } finally {
                setLoading(false);
            }
        };

        if (section) {
            fetchContent();
        }
    }, [section]);

    return { content, loading, error };
};

export default useContent;
