import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, DatePicker, Button, Card, Descriptions, Typography, Steps, message, Radio, Space, Modal } from 'antd';
import api from '../services/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { Calendar, MapPin, FileText, CheckCircle, Clock, Shield, Banknote, CreditCard, Smartphone, X, Copy } from 'lucide-react';

// ============ CẤU HÌNH THANH TOÁN  ============
const BANK_CONFIG = {
    bankCode: 'MB',              // Mã ngân hàng (VietQR): MB, VCB, TCB, ACB, ...
    accountNumber: '12333009200416',  // Số tài khoản
    accountName: 'NGUYEN DUC GIA BAO',       // Tên chủ tài khoản
    template: 'compact2',         // Template QR: compact, compact2, qr_only
};
const MOMO_CONFIG = {
    phoneNumber: '0834571574',    // Số điện thoại MoMo
    accountName: 'NGUYEN DUC GIA BAO',       // Tên chủ tài khoản MoMo
};
// ===================================================================

const { Title, Text } = Typography;

const BookingPage = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [qrModal, setQrModal] = useState({ open: false, method: '', bookingId: null, amount: 0 });

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

    const getTransferContent = (bookingId) => `HOMEFIX DH${bookingId}`;

    const getBankQrUrl = (amount, bookingId) => {
        const content = getTransferContent(bookingId);
        return `https://img.vietqr.io/image/${BANK_CONFIG.bankCode}-${BANK_CONFIG.accountNumber}-${BANK_CONFIG.template}.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;
    };

    const getMomoQrUrl = (amount, bookingId) => {
        const content = getTransferContent(bookingId);
        return `https://momosv3.apimienphi.com/api/QRCode?phone=${MOMO_CONFIG.phoneNumber}&amount=${amount}&note=${encodeURIComponent(content)}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Đã sao chép!');
    };

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

            if (values.paymentMethod === 'BANK_TRANSFER' || values.paymentMethod === 'MOMO') {
                toast.success('Đặt lịch thành công! Vui lòng thanh toán.');
                setQrModal({
                    open: true,
                    method: values.paymentMethod,
                    bookingId: response.data.id,
                    amount: response.data.totalPrice
                });
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
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData.error) {
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
                                        <label className="cursor-pointer border-2 border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-green-500 hover:bg-green-50 transition-all has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                                            <Radio value="CASH" className="mr-0" />
                                            <Banknote size={20} className="text-green-600" />
                                            <span className="font-semibold text-slate-700">Tiền mặt</span>
                                        </label>
                                        <label className="cursor-pointer border-2 border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-all has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                                            <Radio value="BANK_TRANSFER" className="mr-0" />
                                            <CreditCard size={20} className="text-blue-600" />
                                            <span className="font-semibold text-slate-700">Ngân hàng</span>
                                        </label>
                                        <label className="cursor-pointer border-2 border-slate-200 rounded-xl p-4 flex items-center gap-3 hover:border-pink-500 hover:bg-pink-50 transition-all has-[:checked]:border-pink-500 has-[:checked]:bg-pink-50">
                                            <Radio value="MOMO" className="mr-0" />
                                            <Smartphone size={20} className="text-pink-600" />
                                            <span className="font-semibold text-slate-700">Ví MoMo</span>
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

            {/* QR Payment Modal */}
            <Modal
                open={qrModal.open}
                onCancel={() => { setQrModal({ ...qrModal, open: false }); navigate('/dashboard'); }}
                footer={null}
                centered
                width={480}
                closeIcon={<X size={20} />}
                className="qr-payment-modal"
            >
                <div className="text-center py-2">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm mb-6 ${qrModal.method === 'MOMO' ? 'bg-gradient-to-r from-pink-500 to-rose-500' : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                        }`}>
                        {qrModal.method === 'MOMO' ? <Smartphone size={18} /> : <CreditCard size={18} />}
                        {qrModal.method === 'MOMO' ? 'Thanh toán MoMo' : 'Chuyển khoản Ngân hàng'}
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mb-2">Quét mã QR để thanh toán</h2>
                    <p className="text-slate-500 mb-6">Mở app {qrModal.method === 'MOMO' ? 'MoMo' : 'Ngân hàng'} → Quét mã QR bên dưới</p>

                    {/* QR Image */}
                    <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 inline-block mb-6 shadow-lg">
                        <img
                            src={qrModal.method === 'MOMO'
                                ? getMomoQrUrl(qrModal.amount, qrModal.bookingId)
                                : getBankQrUrl(qrModal.amount, qrModal.bookingId)
                            }
                            alt="QR Code thanh toán"
                            className="w-64 h-64 object-contain"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
                                    qrModal.method === 'MOMO'
                                        ? `momo://${MOMO_CONFIG.phoneNumber}?amount=${qrModal.amount}&comment=${getTransferContent(qrModal.bookingId)}`
                                        : `${BANK_CONFIG.bankCode}|${BANK_CONFIG.accountNumber}|${qrModal.amount}|${getTransferContent(qrModal.bookingId)}`
                                )}`;
                            }}
                        />
                    </div>

                    {/* Payment Details */}
                    <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-3 mb-6">
                        {qrModal.method === 'BANK_TRANSFER' && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Ngân hàng</span>
                                    <span className="font-bold text-slate-900">{BANK_CONFIG.bankCode}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Số tài khoản</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">{BANK_CONFIG.accountNumber}</span>
                                        <button onClick={() => copyToClipboard(BANK_CONFIG.accountNumber)} className="text-blue-500 hover:text-blue-700">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Chủ tài khoản</span>
                                    <span className="font-bold text-slate-900">{BANK_CONFIG.accountName}</span>
                                </div>
                            </>
                        )}
                        {qrModal.method === 'MOMO' && (
                            <>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Số MoMo</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">{MOMO_CONFIG.phoneNumber}</span>
                                        <button onClick={() => copyToClipboard(MOMO_CONFIG.phoneNumber)} className="text-pink-500 hover:text-pink-700">
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Tên tài khoản</span>
                                    <span className="font-bold text-slate-900">{MOMO_CONFIG.accountName}</span>
                                </div>
                            </>
                        )}
                        <hr className="border-slate-200" />
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">💰 Số tiền</span>
                            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                {Number(qrModal.amount).toLocaleString('vi-VN')} đ
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">📝 Nội dung CK</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-orange-600">{getTransferContent(qrModal.bookingId)}</span>
                                <button onClick={() => copyToClipboard(getTransferContent(qrModal.bookingId))} className="text-orange-500 hover:text-orange-700">
                                    <Copy size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-amber-800 font-medium">⚠️ Vui lòng chuyển <strong>đúng số tiền</strong> và ghi <strong>đúng nội dung</strong> để đơn hàng được xác nhận nhanh nhất.</p>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        block
                        onClick={() => { setQrModal({ ...qrModal, open: false }); navigate('/dashboard'); }}
                        className="h-12 font-bold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 border-none"
                    >
                        Đã thanh toán xong
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default BookingPage;