import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, DatePicker, Button, Card, Descriptions, Typography, Steps, message, Radio, Space } from 'antd';
import api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { Calendar, MapPin, FileText, CheckCircle, Clock, Shield } from 'lucide-react';

const { Title, Text } = Typography;

const BookingPage = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const fetchService = async () => {
            try {
                const response = await api.get(`/services/packages/${serviceId}`);
                setService(response.data);
            } catch (error) {
                console.error(error);
                toast.error('Không tìm thấy dịch vụ');
                navigate('/services');
            }
        };
        if (serviceId) {
            fetchService();
        }
    }, [serviceId, navigate]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const bookingData = {
                serviceId: parseInt(serviceId),
                bookingTime: values.bookingTime.toISOString(),
                address: values.address,
                note: values.note,
                couponCode: values.couponCode,
                paymentMethod: values.paymentMethod
            };
            
            const response = await api.post('/bookings', bookingData);
            
            if (values.paymentMethod === 'MOMO' || values.paymentMethod === 'VNPAY') {
                const paymentRes = await api.post('/payment/create-url', {
                    bookingId: response.data.id,
                    method: values.paymentMethod,
                    amount: response.data.totalPrice
                });
                window.location.href = paymentRes.data.paymentUrl;
            } else {
                    toast.success('Đặt lịch thành công!');
                    navigate('/dashboard');
                }
            } catch (error) {
                console.error("Booking error:", error);
                const errorData = error.response?.data;
                let errorMessage = 'Đặt lịch thất bại';
                
                if (errorData) {
                    if (typeof errorData === 'string') {
                        errorMessage = errorData;
                    } else if (typeof errorData === 'object') {
                        if (errorData.error) {
                            errorMessage = errorData.error;
                        } else {
                            errorMessage = Object.values(errorData).join(', ');
                        }
                    }
                }
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
    };

    if (!service) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full border-b-4 border-blue-600 animate-spin"></div>
                    <p className="text-lg text-slate-600">Đang tải thông tin dịch vụ...</p>
                </div>
            </div>
        );
    }

    const steps = [
        {
            title: 'Chọn dịch vụ',
            icon: <CheckCircle size={20} />
        },
        {
            title: 'Điền thông tin',
            icon: <FileText size={20} />
        },
        {
            title: 'Xác nhận',
            icon: <CheckCircle size={20} />
        }
    ];

    return (
        <div className="py-8 mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1 className="mb-4 text-5xl font-black text-slate-900">Xác nhận đặt dịch vụ</h1>
                <p className="text-xl text-slate-600">Hoàn tất thông tin để đặt lịch dịch vụ của bạn</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-12">
                <Steps
                    current={1}
                    items={steps.map((step) => ({
                        title: <span className="font-semibold">{step.title}</span>,
                        icon: <div className="flex justify-center items-center w-10 h-10 bg-blue-100 rounded-full">
                            {step.icon}
                        </div>
                    }))}
                    className="mx-auto max-w-2xl"
                />
            </div>
            
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                {/* Service Info - Sticky Sidebar */}
                <div className="lg:col-span-2">
                    <div className="sticky top-8">
                        <Card className="overflow-hidden rounded-3xl border-0 shadow-xl">
                            {/* Service Image */}
                            <div className="relative -m-6 mb-6 h-48">
                                <img 
                                    src={service.imageUrl || 'https://images.unsplash.com/photo-1581578731117-104f8a746950?auto=format&fit=crop&q=80&w=600'}
                                    alt={service.name}
                                    className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t to-transparent from-black/60"></div>
                                <div className="absolute right-4 bottom-4 left-4">
                                    <h3 className="text-2xl font-bold text-white">{service.name}</h3>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Text className="block mb-1 text-sm text-slate-500">Danh mục</Text>
                                    <div className="inline-block px-3 py-1.5 font-semibold text-blue-700 bg-blue-50 rounded-lg">
                                        {service.categoryName}
                                    </div>
                                </div>

                                <div>
                                    <Text className="block mb-1 text-sm text-slate-500">Đơn giá</Text>
                                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                        {service.price.toLocaleString('vi-VN')} đ
                                    </div>
                                </div>

                                <div>
                                    <Text className="block mb-2 text-sm text-slate-500">Mô tả</Text>
                                    <p className="leading-relaxed text-slate-700">
                                        {service.description || "Dịch vụ chuyên nghiệp với đội ngũ kỹ thuật viên giàu kinh nghiệm"}
                                    </p>
                                </div>

                                {/* Features */}
                                <div className="pt-4 space-y-3 border-t border-slate-100">
                                    <div className="flex gap-3 items-center text-slate-700">
                                        <div className="flex justify-center items-center w-8 h-8 bg-green-100 rounded-full">
                                            <CheckCircle size={16} className="text-green-600" />
                                        </div>
                                        <span className="font-medium">Đội ngũ chuyên nghiệp</span>
                                    </div>
                                    <div className="flex gap-3 items-center text-slate-700">
                                        <div className="flex justify-center items-center w-8 h-8 bg-blue-100 rounded-full">
                                            <Shield size={16} className="text-blue-600" />
                                        </div>
                                        <span className="font-medium">Bảo hành 30 ngày</span>
                                    </div>
                                    <div className="flex gap-3 items-center text-slate-700">
                                        <div className="flex justify-center items-center w-8 h-8 bg-amber-100 rounded-full">
                                            <Clock size={16} className="text-amber-600" />
                                        </div>
                                        <span className="font-medium">Phục vụ nhanh chóng</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Booking Form */}
                <div className="lg:col-span-3">
                    <Card className="rounded-3xl border-0 shadow-xl">
                        <Title level={3} className="flex gap-3 items-center mb-6">
                            <div className="flex justify-center items-center w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl">
                                <FileText size={24} className="text-white" />
                            </div>
                            Thông tin đặt lịch
                        </Title>

                        <Form layout="vertical" onFinish={onFinish} size="large">
                            <Form.Item
                                label={
                                    <span className="flex gap-2 items-center font-semibold text-slate-700">
                                        <Calendar size={18} className="text-blue-600" />
                                        Thời gian hẹn
                                    </span>
                                }
                                name="bookingTime"
                                rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
                            >
                                <DatePicker 
                                    showTime 
                                    format="DD/MM/YYYY HH:mm" 
                                    className="w-full rounded-xl border-slate-200"
                                    placeholder="Chọn ngày và giờ"
                                    disabledDate={(current) => current && current < dayjs().endOf('day')}
                                />
                            </Form.Item>

                            <Form.Item
                                label={
                                    <span className="flex gap-2 items-center font-semibold text-slate-700">
                                        <MapPin size={18} className="text-blue-600" />
                                        Địa chỉ thực hiện
                                    </span>
                                }
                                name="address"
                                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
                            >
                                <Input.TextArea 
                                    rows={3} 
                                    placeholder="Nhập địa chỉ chi tiết (số nhà, đường, quận/huyện, thành phố)..."
                                    className="rounded-xl border-slate-200"
                                />
                            </Form.Item>

                            <Form.Item
                                label={
                                    <span className="flex gap-2 items-center font-semibold text-slate-700">
                                        <FileText size={18} className="text-blue-600" />
                                        Ghi chú cho thợ
                                    </span>
                                }
                                name="note"
                            >
                                <Input.TextArea 
                                    rows={4} 
                                    placeholder="Mô tả tình trạng hư hỏng, yêu cầu đặc biệt, thời gian thuận tiện..."
                                    className="rounded-xl border-slate-200"
                                />
                            </Form.Item>

                            {/* Info Box */}
                            <div className="p-6 mb-6 bg-blue-50 rounded-2xl border border-blue-200">
                                <div className="flex gap-3 items-start">
                                    <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 bg-blue-500 rounded-full">
                                        <CheckCircle size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="mb-2 font-bold text-slate-900">Lưu ý quan trọng</h4>
                                        <ul className="space-y-1 text-sm text-slate-700">
                                            <li>• Vui lòng kiểm tra kỹ thông tin trước khi xác nhận</li>
                                            <li>• Thợ sẽ liên hệ với bạn trước 30 phút</li>
                                            <li>• Thanh toán sau khi hoàn thành dịch vụ</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <Form.Item
                                label={
                                    <span className="flex gap-2 items-center font-semibold text-slate-700">
                                        <FileText size={18} className="text-blue-600" />
                                        Mã giảm giá (Nếu có)
                                    </span>
                                }
                                name="couponCode"
                            >
                                <Input 
                                    placeholder="Nhập mã giảm giá..." 
                                    className="rounded-xl border-slate-200"
                                />
                            </Form.Item>

                            <Form.Item
                                label={
                                    <span className="flex gap-2 items-center font-semibold text-slate-700">
                                        <Shield size={18} className="text-blue-600" />
                                        Phương thức thanh toán
                                    </span>
                                }
                                name="paymentMethod"
                                initialValue="CASH"
                            >
                                <Radio.Group className="w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <label className="cursor-pointer border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-all">
                                            <Radio value="CASH" className="mr-0" />
                                            <span className="font-medium">Tiền mặt</span>
                                        </label>
                                        <label className="cursor-pointer border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-pink-500 hover:bg-pink-50 transition-all">
                                            <Radio value="MOMO" className="mr-0" />
                                            <span className="font-medium">Ví MoMo</span>
                                        </label>
                                        <label className="cursor-pointer border border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-all">
                                            <Radio value="VNPAY" className="mr-0" />
                                            <span className="font-medium">VNPAY</span>
                                        </label>
                                    </div>
                                </Radio.Group>
                            </Form.Item>

                            <Form.Item className="mb-0">
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    block 
                                    size="large" 
                                    loading={loading}
                                    className="h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 border-none shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                                >
                                    Xác nhận đặt lịch
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BookingPage;