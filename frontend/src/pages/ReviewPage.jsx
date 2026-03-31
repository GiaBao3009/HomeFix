import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, Rate, Input, Button, message, Typography, Spin, Result } from 'antd';
import { Star, CheckCircle } from 'lucide-react';
import api from '../services/api';

const { Title, Text } = Typography;

const ReviewPage = () => {
    const { bookingId } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [loading, setLoading] = useState(true);
    const [bookingInfo, setBookingInfo] = useState(null);
    const [error, setError] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
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
            await api.post(`/reviews/by-token/${token}`, { rating, comment });
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
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-lg mx-auto mt-12">
                <Result status="error" title="Lỗi" subTitle={error} />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="max-w-lg mx-auto mt-12">
                <Result
                    icon={<CheckCircle size={64} className="text-green-500 mx-auto" />}
                    title="Cảm ơn bạn đã đánh giá!"
                    subTitle="Đánh giá của bạn giúp chúng tôi cải thiện chất lượng dịch vụ."
                />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto mt-8">
            <Card className="rounded-2xl shadow-lg">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4">
                        <Star size={32} className="text-white" />
                    </div>
                    <Title level={3} className="!mb-1">Đánh giá dịch vụ</Title>
                    <Text type="secondary">Chia sẻ trải nghiệm của bạn về dịch vụ HomeFix</Text>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between mb-2">
                        <Text type="secondary">Đơn hàng</Text>
                        <Text strong>#{bookingInfo?.bookingId}</Text>
                    </div>
                    <div className="flex justify-between mb-2">
                        <Text type="secondary">Dịch vụ</Text>
                        <Text strong>{bookingInfo?.serviceName}</Text>
                    </div>
                    <div className="flex justify-between">
                        <Text type="secondary">Kỹ thuật viên</Text>
                        <Text strong>{bookingInfo?.technicianName}</Text>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <Text className="block mb-3 font-semibold">Đánh giá kỹ thuật viên</Text>
                    <Rate value={rating} onChange={setRating} className="text-4xl text-yellow-400" />
                    <div className="mt-2 text-sm text-slate-500">
                        {rating > 0 && ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][rating]}
                    </div>
                </div>

                <div className="mb-6">
                    <Text className="block mb-2 font-semibold">Nhận xét của bạn</Text>
                    <Input.TextArea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        className="rounded-xl"
                    />
                </div>

                <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={rating === 0}
                    className="h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 border-none"
                >
                    Gửi đánh giá
                </Button>
            </Card>
        </div>
    );
};

export default ReviewPage;
