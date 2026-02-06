import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, Typography, Spin, message } from 'antd';
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';
import api from '../services/api';

const { Title, Text } = Typography;

const PaymentGateway = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const bookingId = searchParams.get('bookingId');
    const method = searchParams.get('method');
    // const amount = searchParams.get('amount'); // Optional if passed

    const handlePayment = async (success) => {
        setLoading(true);
        try {
            await api.post('/payment/confirm', {
                bookingId: bookingId,
                success: success
            });
            
            if (success) {
                message.success('Thanh toán thành công!');
                navigate('/dashboard'); // Or a dedicated Success page
            } else {
                message.error('Thanh toán thất bại hoặc bị hủy');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            message.error('Lỗi kết nối thanh toán');
        } finally {
            setLoading(false);
        }
    };

    if (!bookingId || !method) {
        return <div className="p-8 text-center">Thông tin thanh toán không hợp lệ</div>;
    }

    const isMomo = method === 'MOMO';
    const bgColor = isMomo ? 'bg-pink-600' : 'bg-blue-600';
    const providerName = isMomo ? 'MoMo' : 'VNPAY';

    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <Card className="w-full max-w-md shadow-xl rounded-2xl overflow-hidden border-0">
                <div className={`${bgColor} p-6 text-center`}>
                    <CreditCard className="w-16 h-16 text-white mx-auto mb-4" />
                    <Title level={3} className="!text-white !mb-0">
                        Cổng thanh toán {providerName}
                    </Title>
                    <Text className="text-white/80">Mô phỏng giao dịch an toàn</Text>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <Text className="block text-slate-500">Mã đơn hàng</Text>
                        <Title level={2} className="!mt-0 !mb-0">#{bookingId}</Title>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-center">
                        <Text className="text-yellow-700">
                            Đây là màn hình mô phỏng. Không có tiền thật bị trừ.
                        </Text>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button 
                            size="large"
                            className="h-12 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            onClick={() => handlePayment(false)}
                            disabled={loading}
                            icon={<XCircle size={18} />}
                        >
                            Hủy giao dịch
                        </Button>
                        <Button 
                            type="primary"
                            size="large"
                            className={`h-12 ${isMomo ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            onClick={() => handlePayment(true)}
                            loading={loading}
                            icon={<CheckCircle size={18} />}
                        >
                            Xác nhận trả
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PaymentGateway;
