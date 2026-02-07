import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Upload, Typography } from 'antd';
import { Edit, Trash, Plus, Upload as UploadIcon } from 'lucide-react';
import api from '../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const AdminServiceManager = () => {
    // State
    const [categories, setCategories] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Modal State
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);

    const [packageForm] = Form.useForm();
    const [packageFileList, setPackageFileList] = useState([]);

    // Watch form values for preview
    const packageImageUrl = Form.useWatch('imageUrl', packageForm);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, pkgRes] = await Promise.all([
                api.get('/services/categories'),
                api.get('/services/packages')
            ]);
            
            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            setPackages(Array.isArray(pkgRes.data) ? pkgRes.data : []);
        } catch (error) {
            console.error("Error fetching services:", error);
            message.error('Không thể tải dữ liệu dịch vụ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Package Handlers
    const handlePackageUpload = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newUrl = response.data.fileUrl;
            
            const currentUrls = packageForm.getFieldValue('imageUrls') || [];
            const newUrls = [...currentUrls, newUrl];
            packageForm.setFieldValue('imageUrls', newUrls);
            
            // Set main image if empty
            if (!packageForm.getFieldValue('imageUrl')) {
                packageForm.setFieldValue('imageUrl', newUrl);
            }

            setPackageFileList(prev => [...prev, {
                uid: file.uid,
                name: file.name,
                status: 'done',
                url: newUrl,
            }]);

            onSuccess(response.data);
            message.success('Tải ảnh lên thành công');
        } catch (error) {
            console.error('Upload error:', error);
            onError(error);
            message.error('Tải ảnh lên thất bại');
        }
    };

    const handleRemovePackageImage = (file) => {
        const urlToRemove = file.url;
        const currentUrls = packageForm.getFieldValue('imageUrls') || [];
        const newUrls = currentUrls.filter(url => url !== urlToRemove);
        packageForm.setFieldValue('imageUrls', newUrls);
        
        if (packageForm.getFieldValue('imageUrl') === urlToRemove) {
            packageForm.setFieldValue('imageUrl', newUrls[0] || '');
        }
        
        setPackageFileList(prev => prev.filter(item => item.uid !== file.uid));
    };

    const handlePackageSubmit = async (values) => {
        try {
            if (editingPackage) {
                await api.put(`/services/packages/${editingPackage.id}`, values);
                message.success('Cập nhật dịch vụ thành công');
            } else {
                await api.post('/services/packages', values);
                message.success('Tạo dịch vụ thành công');
            }
            setIsPackageModalOpen(false);
            packageForm.resetFields();
            setEditingPackage(null);
            fetchData();
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Thao tác thất bại';
            message.error(errorMsg);
        }
    };

    const handleDeletePackage = async (id) => {
        try {
            await api.delete(`/services/packages/${id}`);
            message.success('Xóa dịch vụ thành công');
            fetchData();
        } catch (error) {
            message.error('Xóa thất bại');
        }
    };

    const packageColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'Tên dịch vụ', dataIndex: 'name', key: 'name' },
        { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName' },
        { title: 'Giá', dataIndex: 'price', key: 'price', render: (val) => `${val.toLocaleString()} đ` },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button icon={<Edit size={16} />} onClick={() => {
                        setEditingPackage(record);
                        packageForm.setFieldsValue(record);
                        setIsPackageModalOpen(true);
                    }} />
                    <Button danger icon={<Trash size={16} />} onClick={() => Modal.confirm({
                        title: 'Xóa dịch vụ?',
                        onOk: () => handleDeletePackage(record.id)
                    })} />
                </Space>
            )
        }
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Quản lý Dịch vụ</h1>
                <Button type="primary" icon={<Plus size={16} />} onClick={() => {
                    setEditingPackage(null);
                    packageForm.resetFields();
                    setPackageFileList([]);
                    setIsPackageModalOpen(true);
                }}>Thêm Dịch vụ</Button>
            </div>

            <Table dataSource={packages} columns={packageColumns} rowKey="id" loading={loading} />

            {/* Package Modal */}
            <Modal
                title={editingPackage ? "Sửa Dịch vụ" : "Thêm Dịch vụ"}
                open={isPackageModalOpen}
                onCancel={() => setIsPackageModalOpen(false)}
                footer={null}
            >
                <Form form={packageForm} onFinish={handlePackageSubmit} layout="vertical">
                    <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
                        <Select>
                            {(categories || []).map(c => (
                                <Option key={c.id} value={c.id}>{c.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="name" label="Tên dịch vụ" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="price" label="Giá" rules={[{ required: true }]}>
                        <InputNumber className="w-full" min={0} />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả ngắn">
                        <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="detailedDescription" label="Mô tả chi tiết">
                        <TextArea rows={5} placeholder="Nhập mô tả chi tiết, xuống dòng để tạo đoạn mới..." />
                    </Form.Item>
                    <Form.Item name="imageUrl" label="Image URL" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item name="imageUrls" label="Danh sách ảnh" hidden>
                        <Select mode="tags" />
                    </Form.Item>
                    <Form.Item label="Hình ảnh">
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-4">
                                {(packageForm.getFieldValue('imageUrls') || [packageImageUrl]).filter(Boolean).map((url, index) => (
                                    <div key={index} className="relative w-32 h-20 group">
                                        <img 
                                            src={url} 
                                            alt={`Service ${index}`} 
                                            className="object-cover w-full h-full rounded border"
                                        />
                                        <div className="hidden absolute inset-0 justify-center items-center rounded bg-black/50 group-hover:flex">
                                            <Button 
                                                danger 
                                                size="small" 
                                                icon={<Trash size={14} />}
                                                onClick={() => handleRemovePackageImage({ url, uid: index })}
                                            />
                                        </div>
                                        {url === packageImageUrl && (
                                            <div className="absolute top-0 right-0 px-1 text-xs text-white bg-blue-500 rounded-bl">
                                                Main
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Upload
                                customRequest={handlePackageUpload}
                                showUploadList={false}
                                accept="image/*"
                                multiple
                            >
                                <Button icon={<UploadIcon size={16} />}>Thêm ảnh</Button>
                            </Upload>
                            <Text type="secondary" className="block text-xs">
                                Ảnh đầu tiên sẽ là ảnh đại diện. Tải lên nhiều ảnh để tạo thư viện ảnh cho dịch vụ.
                            </Text>
                        </div>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">Lưu</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminServiceManager;
