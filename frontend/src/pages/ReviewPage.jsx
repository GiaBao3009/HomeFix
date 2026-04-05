import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Input, InputNumber, Rate, Result, Spin, Typography, message } from 'antd';
import { CheckCircle, Star } from 'lucide-react';
import api from '../services/api';

const { Title, Text } = Typography;

const ReviewPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [loading, setLoading] = useState(true);
    const [bookingInfo, setBookingInfo] = useState(null);
    const [error, setError] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [tipAmount, setTipAmount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Link đánh giá không hợp lệ');
            setLoading(false);
            return;
        }

        const fetchInfo = async () => {
            try {
                const res = await api.get(`/reviews/by-token/${token}`);
                setBookingInfo(res.data);
                if (res.data.alreadyReviewed) {
                    setSubmitted(true);
                }
            } catch (e) {
                setError(e.response?.data?.message || e.response?.data || 'Link đánh giá không hợp lệ hoặc đã hết hạn');
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, [token]);

    const handleSubmit = async () => {
        if (rating === 0) {
            message.warning('Vui lòng chọn số sao');
            return;
        }
        if (!comment.trim()) {
            message.warning('Vui lòng nhập nhận xét');
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/reviews/by-token/${token}`, { rating, comment, tipAmount });
            setSubmitted(true);
            message.success('Cảm ơn bạn đã đánh giá!');
        } catch (e) {
            message.error(e.response?.data?.message || e.response?.data || 'Không thể gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto mt-12 max-w-lg">
                <Result status="error" title="Lỗi" subTitle={error} />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="mx-auto mt-12 max-w-lg">
                <Result
                    icon={<CheckCircle size={64} className="mx-auto text-green-500" />}
                    title="Cảm ơn bạn đã đánh giá!"
                    subTitle="Đánh giá của bạn giúp chúng tôi cải thiện chất lượng dịch vụ."
                />
            </div>
        );
    }

    return (
        <div className="mx-auto mt-8 max-w-lg">
            <Card className="rounded-2xl shadow-lg">
                <div className="mb-6 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                        <Star size={32} className="text-white" />
                    </div>
                    <Title level={3} className="!mb-1">Đánh giá dịch vụ</Title>
                    <Text type="secondary">Đây là trang fallback cho các link review cũ.</Text>
                </div>

                <div className="mb-6 rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex justify-between">
                        <Text type="secondary">Đơn hàng</Text>
                        <Text strong>#{bookingInfo?.bookingId}</Text>
                    </div>
                    <div className="mb-2 flex justify-between">
                        <Text type="secondary">Dịch vụ</Text>
                        <Text strong>{bookingInfo?.serviceName}</Text>
                    </div>
                    <div className="flex justify-between">
                        <Text type="secondary">Kỹ thuật viên</Text>
                        <Text strong>{bookingInfo?.technicianName}</Text>
                    </div>
                </div>

                <div className="mb-6 text-center">
                    <Text className="mb-3 block font-semibold">Chấm điểm kỹ thuật viên</Text>
                    <Rate value={rating} onChange={setRating} className="text-4xl text-yellow-400" />
                </div>

                <div className="mb-6">
                    <Text className="mb-2 block font-semibold">Nhận xét của bạn</Text>
                    <Input.TextArea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        className="rounded-xl"
                    />
                </div>

                <div className="mb-6">
                    <Text className="mb-2 block font-semibold">Tiền tip cho thợ</Text>
                    <InputNumber
                        className="w-full"
                        min={0}
                        step={10000}
                        value={tipAmount}
                        onChange={(value) => setTipAmount(Number(value || 0))}
                        formatter={(value) => `${value || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => Number((value || '0').toString().replace(/\./g, ''))}
                        placeholder="Ví dụ: 50000"
                    />
                </div>

                <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={rating === 0}
                    className="h-12 rounded-xl border-none bg-gradient-to-r from-blue-600 to-cyan-600 font-bold"
                >
                    Gửi đánh giá
                </Button>
            </Card>
        </div>
    );
};

export default ReviewPage;
