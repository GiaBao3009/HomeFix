import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, role, fullName } = response.data;
            
            localStorage.setItem('token', token);
            const userData = { email, role, fullName };
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(userData);
            toast.success('Đăng nhập thành công!');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.error || 'Đăng nhập thất bại');
            return false;
        }
    };

    const register = async (data) => {
        try {
            const response = await api.post('/auth/register', data);
            const { token, role, fullName } = response.data;
            
            localStorage.setItem('token', token);
            const userData = { email: data.email, role, fullName };
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(userData);
            toast.success('Đăng ký thành công!');
            return true;
        } catch (error) {
            console.error("Register error:", error);
            const errorData = error.response?.data;
            let errorMessage = 'Đăng ký thất bại';
            
            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (typeof errorData === 'object') {
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    } else {
                        // Join all values from the map (validation errors)
                        errorMessage = Object.values(errorData).join(', ');
                    }
                }
            }
            
            toast.error(errorMessage);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        toast.info('Đã đăng xuất');
    };

    const updateUser = (userData) => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
