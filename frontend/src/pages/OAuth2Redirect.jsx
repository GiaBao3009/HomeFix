import { useEffect, useRef } from 'react';
import { message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const OAuth2Redirect = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const token = searchParams.get('token');
        if (!token) {
            message.error('Đăng nhập thất bại: không tìm thấy token.');
            navigate('/login');
            return;
        }

        localStorage.setItem('token', token);

        api.get('/users/profile')
            .then((response) => {
                localStorage.setItem('user', JSON.stringify(response.data));
                message.success('Đăng nhập mạng xã hội thành công!');
                window.location.href = '/';
            })
            .catch((error) => {
                console.error('Failed to fetch profile', error);
                message.error('Không thể lấy thông tin người dùng sau khi đăng nhập.');
                navigate('/login');
            });
    }, [navigate, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
                <h2 className="text-xl font-semibold text-gray-700">Đang xử lý đăng nhập...</h2>
            </div>
        </div>
    );
};

export default OAuth2Redirect;
