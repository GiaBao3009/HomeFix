import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Typography, Row, Col, Rate, Divider, Avatar, Tag, message, Carousel, Modal, Form, Input } from 'antd';
import { Clock, Shield, Star, User, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

const ServiceDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canReview, setCanReview] = useState(false);
    const [bookingToReview, setBookingToReview] = useState(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [reviewForm] = Form.useForm();
    const { TextArea } = Input;

    useEffect(() => {
        const checkReviewCapability = async () => {
            try {
                const res = await api.get('/bookings/my-bookings');
                const myBookings = res.data;
                // Get list of booking IDs that already have reviews for this service
                // Note: reviews array contains ReviewDto which has bookingId
                const reviewBookingIds = reviews.map(r => r.bookingId);
                
                const validBooking = myBookings.find(b => 
                    b.serviceId === parseInt(id) && 
                    b.status === 'COMPLETED' &&
                    !reviewBookingIds.includes(b.id)
                );
                
                if (validBooking) {
                    setCanReview(true);
                    setBookingToReview(validBooking);
                } else {
                    setCanReview(false);
                    setBookingToReview(null);
                }
            } catch (e) {
                // Ignore if not logged in
            }
        };
        if (id && !loading) checkReviewCapability();
    }, [id, reviews, loading]);

    const handleReviewSubmit = async (values) => {
        try {
            await api.post('/reviews', {
                bookingId: bookingToReview.id,
                rating: values.rating,
                comment: values.comment
            });
            message.success('Đánh giá thành công!');
            setReviewModalVisible(false);
            reviewForm.resetFields();
            
            // Refresh reviews
            const reviewsRes = await api.get(`/reviews/service/${id}`);
            setReviews(reviewsRes.data);
        } catch (error) {
            message.error('Gửi đánh giá thất bại');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [serviceRes, reviewsRes] = await Promise.all([
                    api.get(`/services/packages/${id}`),
                    api.get(`/reviews/service/${id}`)
                ]);
                setService(serviceRes.data);
                setReviews(reviewsRes.data);
            } catch (error) {
                console.error("Failed to fetch service details:", error);
                message.error("Không thể tải thông tin dịch vụ");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spin size="large" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="text-center py-20">
                <Title level={3}>Dịch vụ không tồn tại</Title>
                <Button onClick={() => navigate('/services')}>Quay lại danh sách</Button>
            </div>
        );
    }

    const averageRating = reviews.length > 0 
        ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
        : 5;

    // Combine main image with additional images
    const allImages = [
        service.imageUrl,
        ...(service.imageUrls || [])
    ].filter(url => url);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
            <Button 
                icon={<ArrowLeft size={16} />} 
                onClick={() => navigate('/services')}
                className="mb-6 border-none shadow-none bg-transparent hover:bg-slate-100"
            >
                Quay lại
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Image & Info */}
                <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
                    <div className="rounded-3xl overflow-hidden shadow-2xl relative group bg-white">
                        {allImages.length > 1 ? (
                            <Carousel autoplay effect="fade" arrows infinite>
                                {allImages.map((url, index) => (
                                    <div key={index} className="h-[220px] sm:h-[340px] md:h-[400px]">
                                        <img 
                                            src={url} 
                                            alt={`${service.name} - ${index + 1}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { 
                                                e.target.onerror = null; 
                                                e.target.src = 'https://placehold.co/800x600?text=Service'; 
                                            }}
                                        />
                                    </div>
                                ))}
                            </Carousel>
                        ) : (
                            <div className="h-[220px] sm:h-[340px] md:h-[400px]">
                                <img 
                                    src={service.imageUrl || 'https://placehold.co/800x600?text=Service'} 
                                    alt={service.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { 
                                        e.target.onerror = null; 
                                        e.target.src = 'https://placehold.co/800x600?text=Service'; 
                                    }}
                                />
                            </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 p-4 sm:p-8 text-white pointer-events-none">
                            <Tag color="blue" className="mb-2 text-sm px-3 py-1 rounded-full border-none bg-blue-600/80 backdrop-blur-sm">
                                {service.categoryName || 'Dịch vụ'}
                            </Tag>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 leading-tight">{service.name}</h1>
                            <div className="flex items-center gap-2 text-yellow-400">
                                <Rate disabled defaultValue={averageRating} allowHalf className="text-yellow-400 text-sm" />
                                <span className="text-white text-sm">({reviews.length} đánh giá)</span>
                            </div>
                        </div>
                    </div>

                    <Card className="shadow-lg rounded-2xl border-none">
                        <Title level={4}>Mô tả chi tiết</Title>
                        <div className="prose max-w-none text-slate-600 leading-relaxed">
                            {service.detailedDescription ? (
                                <div dangerouslySetInnerHTML={{ __html: service.detailedDescription.replace(/\n/g, '<br/>') }} />
                            ) : (
                                <Paragraph className="whitespace-pre-line text-lg">
                                    {service.description}
                                </Paragraph>
                            )}
                        </div>
                        
                        <Divider />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex gap-3 items-start">
                                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <Text strong className="block text-lg">Nhanh chóng</Text>
                                    <Text type="secondary">Có mặt trong 30 phút</Text>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="p-3 bg-green-50 rounded-xl text-green-600">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <Text strong className="block text-lg">Bảo hành</Text>
                                    <Text type="secondary">Cam kết 30 ngày</Text>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <Text strong className="block text-lg">Chuyên nghiệp</Text>
                                    <Text type="secondary">Thợ lành nghề</Text>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                            <Title level={4} className="!mb-0">Đánh giá từ khách hàng ({reviews.length})</Title>
                            {canReview && (
                                <Button type="primary" onClick={() => setReviewModalVisible(true)} className="self-start sm:self-auto">
                                    Viết đánh giá
                                </Button>
                            )}
                        </div>
                        {reviews.length > 0 ? (
                            <div className="grid gap-4">
                                {reviews.map((review) => (
                                    <Card key={review.id} className="shadow-sm hover:shadow-md transition-shadow rounded-xl border-slate-100">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                            <Avatar 
                                                icon={<User />} 
                                                src={review.customerAvatar || review.userAvatar} 
                                                size={48}
                                                className="bg-slate-200 shrink-0 sm:mt-0.5" 
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-1">
                                                    <div className="min-w-0">
                                                        <Text strong className="text-base sm:text-lg block truncate">{review.customerName || review.userName}</Text>
                                                        <Text type="secondary" className="text-xs">
                                                            {dayjs(review.createdAt).format('DD/MM/YYYY HH:mm')}
                                                        </Text>
                                                    </div>
                                                    <Rate disabled defaultValue={review.rating} className="text-sm text-yellow-400 shrink-0" />
                                                </div>
                                                <Paragraph className="text-slate-600 mb-0 mt-2 bg-slate-50 p-3 rounded-lg">
                                                    {review.comment}
                                                </Paragraph>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-2xl">
                                <Text type="secondary">Chưa có đánh giá nào cho dịch vụ này.</Text>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Booking Card — first on mobile for quick booking */}
                <div className="lg:col-span-1 order-1 lg:order-2">
                    <div className="lg:sticky lg:top-24">
                        <Card className="shadow-2xl rounded-3xl border-none overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-5 sm:p-6 -m-6 mb-6 text-white text-center">
                                <Text className="block text-blue-100 mb-1 uppercase tracking-wider text-xs font-bold">Giá dịch vụ</Text>
                                <div className="text-3xl sm:text-4xl font-black break-words">
                                    {service.price?.toLocaleString('vi-VN')}
                                    <span className="text-xl font-normal opacity-80"> đ</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Phí dịch vụ</span>
                                        <span>{service.price?.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Phí di chuyển</span>
                                        <span className="text-green-600 font-medium">Miễn phí</span>
                                    </div>
                                    <Divider className="my-2" />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Tổng cộng</span>
                                        <span className="text-blue-600">{service.price?.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                </div>

                                <Button 
                                    type="primary" 
                                    size="large" 
                                    block
                                    onClick={() => navigate(`/booking/${service.id}`)}
                                    className="h-14 text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                                >
                                    Đặt lịch ngay
                                </Button>
                                
                                <Text type="secondary" className="block text-center text-xs">
                                    Cam kết không phát sinh chi phí phụ
                                </Text>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <Modal
                title="Viết đánh giá dịch vụ"
                open={reviewModalVisible}
                onCancel={() => setReviewModalVisible(false)}
                footer={null}
            >
                <Form
                    form={reviewForm}
                    onFinish={handleReviewSubmit}
                    layout="vertical"
                >
                    <Form.Item 
                        name="rating" 
                        label="Đánh giá" 
                        rules={[{ required: true, message: 'Vui lòng chọn số sao' }]}
                    >
                        <Rate />
                    </Form.Item>
                    <Form.Item 
                        name="comment" 
                        label="Nhận xét"
                        rules={[{ required: true, message: 'Vui lòng nhập nhận xét' }]}
                    >
                        <TextArea rows={4} placeholder="Chia sẻ trải nghiệm của bạn..." />
                    </Form.Item>
                    <div className="flex justify-end gap-2">
                        <Button onClick={() => setReviewModalVisible(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit">Gửi đánh giá</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default ServiceDetailPage;
