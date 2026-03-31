import { createContext, useState, useEffect, useContext } from 'react';
import api, { getApiErrorMessage } from '../services/api';
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
            const { token, role, fullName, id, avatarUrl, technicianProfileCompleted, technicianType, technicianApprovalStatus, bankName, bankAccountNumber, bankAccountHolder } = response.data;
            
            localStorage.setItem('token', token);
            const userData = { email, role, fullName, id, avatarUrl, technicianProfileCompleted, technicianType, technicianApprovalStatus, bankName, bankAccountNumber, bankAccountHolder };
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(userData);
            toast.success('Đăng nhập thành công!');
            return userData;
        } catch (error) {
            throw new Error(getApiErrorMessage(error, 'Đăng nhập thất bại'));
        }
    };

    const register = async (data) => {
        try {
            const response = await api.post('/auth/register', data);
            const { token, role, fullName, id, avatarUrl, technicianProfileCompleted, technicianType, technicianApprovalStatus, bankName, bankAccountNumber, bankAccountHolder } = response.data;
            
            localStorage.setItem('token', token);
            const userData = { email: data.email, role, fullName, id, avatarUrl, technicianProfileCompleted, technicianType, technicianApprovalStatus, bankName, bankAccountNumber, bankAccountHolder };
            localStorage.setItem('user', JSON.stringify(userData));
            
            setUser(userData);
            toast.success('Đăng ký thành công!');
            return userData;
        } catch (error) {
            console.error("Register error:", error);
            throw new Error(getApiErrorMessage(error, 'Đăng ký thất bại'));
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

    const refreshUserProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            const profile = response.data || {};
            updateUser({
                fullName: profile.fullName,
                avatarUrl: profile.avatarUrl,
                technicianProfileCompleted: profile.technicianProfileCompleted,
                technicianType: profile.technicianType,
                technicianApprovalStatus: profile.technicianApprovalStatus,
                bankName: profile.bankName,
                bankAccountNumber: profile.bankAccountNumber,
                bankAccountHolder: profile.bankAccountHolder
            });
        } catch (error) {
            console.error('Refresh user profile error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, refreshUserProfile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
