import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Rate, Input, Button, Card, message, Result, Spin } from 'antd';
import { StarFilled, CheckCircleFilled } from '@ant-design/icons';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const { TextArea } = Input;

export default function ReviewPage() {
    const { bookingId } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { darkMode } = useTheme();

    const [loading, setLoading] = useState(true);
    const [bookingInfo, setBookingInfo] = useState(null);
    const [error, setError] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Link đánh giá không hợp lệ');
            setLoading(false);
            return;
        }
        api.get(`/reviews/by-token/${token}`)
            .then(res => {
                setBookingInfo(res.data);
                if (res.data.alreadyReviewed) {
                    setSubmitted(true);
                }
            })
            .catch(err => {
                setError(err.response?.data?.message || err.response?.data || 'Link đánh giá không hợp lệ hoặc đã hết hạn');
            })
            .finally(() => setLoading(false));
    }, [token]);

    const handleSubmit = async () => {
        if (rating < 1) {
            message.warning('Vui lòng chọn số sao');
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/reviews/by-token/${token}`, { rating, comment });
            setSubmitted(true);
            message.success('Cảm ơn bạn đã đánh giá!');
        } catch (err) {
            message.error(err.response?.data?.message || err.response?.data || 'Không thể gửi đánh giá');
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
                <Result status="warning" title="Không thể đánh giá" subTitle={error} />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="max-w-lg mx-auto mt-12">
                <Result
                    icon={<CheckCircleFilled style={{ color: '#52c41a' }} />}
                    title="Cảm ơn bạn đã đánh giá!"
                    subTitle="Đánh giá của bạn giúp chúng tôi cải thiện chất lượng dịch vụ."
                />
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto mt-8">
            <Card
                className={`shadow-xl rounded-2xl ${darkMode ? 'bg-slate-800 border-slate-700' : ''}`}
            >
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-bold mb-4">
                        HF
                    </div>
                    <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        Đánh giá dịch vụ
                    </h2>
                    <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Đơn hàng #{bookingInfo?.bookingId}
                    </p>
                </div>

                <div className={`rounded-xl p-4 mb-6 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <div className="flex justify-between mb-2">
                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Dịch vụ</span>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {bookingInfo?.serviceName}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>Kỹ thuật viên</span>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {bookingInfo?.technicianName}
                        </span>
                    </div>
                </div>

                <div className="text-center mb-6">
                    <p className={`mb-3 font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Bạn đánh giá dịch vụ thế nào?
                    </p>
                    <Rate
                        value={rating}
                        onChange={setRating}
                        character={<StarFilled />}
                        style={{ fontSize: 36 }}
                    />
                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {rating === 5 ? 'Tuyệt vời!' : rating === 4 ? 'Rất tốt' : rating === 3 ? 'Bình thường' : rating === 2 ? 'Chưa hài lòng' : 'Rất tệ'}
                    </p>
                </div>

                <div className="mb-6">
                    <TextArea
                        rows={4}
                        placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className={darkMode ? 'bg-slate-700 border-slate-600 text-white' : ''}
                    />
                </div>

                <Button
                    type="primary"
                    size="large"
                    block
                    loading={submitting}
                    onClick={handleSubmit}
                    className="h-12 rounded-xl font-semibold text-base"
                >
                    Gửi đánh giá
                </Button>
            </Card>
        </div>
    );
}
