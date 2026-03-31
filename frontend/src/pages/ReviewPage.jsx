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
            setError('Link danh gia khong hop le');
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
                setError(e.response?.data?.message || e.response?.data || 'Link danh gia khong hop le hoac da het han');
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, [token]);

    const handleSubmit = async () => {
        if (rating === 0) {
            message.warning('Vui long chon so sao');
            return;
        }
        if (!comment.trim()) {
            message.warning('Vui long nhap nhan xet');
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/reviews/by-token/${token}`, { rating, comment, tipAmount });
            setSubmitted(true);
            message.success('Cam on ban da danh gia!');
        } catch (e) {
            message.error(e.response?.data?.message || e.response?.data || 'Khong the gui danh gia');
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
                <Result status="error" title="Loi" subTitle={error} />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="mx-auto mt-12 max-w-lg">
                <Result
                    icon={<CheckCircle size={64} className="mx-auto text-green-500" />}
                    title="Cam on ban da danh gia!"
                    subTitle="Danh gia cua ban giup chung toi cai thien chat luong dich vu."
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
                    <Title level={3} className="!mb-1">Danh gia dich vu</Title>
                    <Text type="secondary">Day la trang fallback cho cac link review cu.</Text>
                </div>

                <div className="mb-6 rounded-xl bg-slate-50 p-4">
                    <div className="mb-2 flex justify-between">
                        <Text type="secondary">Don hang</Text>
                        <Text strong>#{bookingInfo?.bookingId}</Text>
                    </div>
                    <div className="mb-2 flex justify-between">
                        <Text type="secondary">Dich vu</Text>
                        <Text strong>{bookingInfo?.serviceName}</Text>
                    </div>
                    <div className="flex justify-between">
                        <Text type="secondary">Ky thuat vien</Text>
                        <Text strong>{bookingInfo?.technicianName}</Text>
                    </div>
                </div>

                <div className="mb-6 text-center">
                    <Text className="mb-3 block font-semibold">Cham diem ky thuat vien</Text>
                    <Rate value={rating} onChange={setRating} className="text-4xl text-yellow-400" />
                </div>

                <div className="mb-6">
                    <Text className="mb-2 block font-semibold">Nhan xet cua ban</Text>
                    <Input.TextArea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia se trai nghiem cua ban..."
                        className="rounded-xl"
                    />
                </div>

                <div className="mb-6">
                    <Text className="mb-2 block font-semibold">Tien tip cho tho</Text>
                    <InputNumber
                        className="w-full"
                        min={0}
                        step={10000}
                        value={tipAmount}
                        onChange={(value) => setTipAmount(Number(value || 0))}
                        formatter={(value) => `${value || 0}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => Number((value || '0').toString().replace(/\./g, ''))}
                        placeholder="Vi du: 50000"
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
                    Gui danh gia
                </Button>
            </Card>
        </div>
    );
};

export default ReviewPage;
