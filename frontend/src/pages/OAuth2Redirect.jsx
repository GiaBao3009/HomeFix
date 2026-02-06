import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message } from 'antd';
import api from '../services/api';

const OAuth2Redirect = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            
            // Fetch user profile
            api.get('/users/profile')
                .then(response => {
                    const user = response.data;
                    localStorage.setItem('user', JSON.stringify(user));
                    message.success('Đăng nhập Google thành công!');
                    // Force reload to update AuthContext
                    window.location.href = '/';
                })
                .catch(error => {
                    console.error('Failed to fetch profile', error);
                    message.error('Không thể lấy thông tin người dùng');
                    navigate('/login');
                });
        } else {
            message.error('Đăng nhập thất bại: Không tìm thấy token');
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Đang xử lý đăng nhập...</h2>
            </div>
        </div>
    );
};

export default OAuth2Redirect;
