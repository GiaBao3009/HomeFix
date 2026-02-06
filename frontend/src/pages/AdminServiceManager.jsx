import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tabs, message, Space, Upload } from 'antd';
import { Edit, Trash, Plus, Upload as UploadIcon } from 'lucide-react';
import api from '../services/api';

const { TextArea } = Input;
const { Option } = Select;

const AdminServiceManager = () => {
    // State
    const [categories, setCategories] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingPackage, setEditingPackage] = useState(null);

    const [categoryForm] = Form.useForm();
    const [packageForm] = Form.useForm();
    const [packageFileList, setPackageFileList] = useState([]);

    // Watch form values for preview
    const categoryIconUrl = Form.useWatch('iconUrl', categoryForm);
    const packageImageUrl = Form.useWatch('imageUrl', packageForm);

    // File Upload Handler
    const handleUpload = async ({ file, onSuccess, onError }) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSuccess(response.data);
            message.success('Tải ảnh lên thành công');
        } catch (error) {
            console.error('Upload error:', error);
            onError(error);
            message.error('Tải ảnh lên thất bại');
        }
    };

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            console.log("Fetching services data...");
            const [catRes, pkgRes] = await Promise.all([
                api.get('/services/categories'),
                api.get('/services/packages')
            ]);
            console.log("Categories API Response:", catRes.data);
            console.log("Packages API Response:", pkgRes.data);
            
            // Ensure data is always an array
            const validCategories = Array.isArray(catRes.data) ? catRes.data : [];
            const validPackages = Array.isArray(pkgRes.data) ? pkgRes.data : [];
            
            setCategories(validCategories);
            setPackages(validPackages);

            if (validCategories.length === 0) {
                console.warn("No categories found. Database might be empty.");
            }
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

    // Category Handlers
    const handleCategorySubmit = async (values) => {
        try {
            if (editingCategory) {
                await api.put(`/services/categories/${editingCategory.id}`, values);
                message.success('Cập nhật danh mục thành công');
            } else {
                await api.post('/services/categories', values);
                message.success('Tạo danh mục thành công');
            }
            setIsCategoryModalOpen(false);
            categoryForm.resetFields();
            setEditingCategory(null);
            fetchData();
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Thao tác thất bại';
            message.error(errorMsg);
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await api.delete(`/services/categories/${id}`);
            message.success('Xóa danh mục thành công');
            fetchData();
        } catch (error) {
            console.error(error);
            message.error('Xóa thất bại');
        }
    };

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

    // Columns
    const categoryColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button icon={<Edit size={16} />} onClick={() => {
                        setEditingCategory(record);
                        categoryForm.setFieldsValue(record);
                        setIsCategoryModalOpen(true);
                    }} />
                    <Button danger icon={<Trash size={16} />} onClick={() => Modal.confirm({
                        title: 'Xóa danh mục?',
                        content: 'Hành động này sẽ xóa tất cả dịch vụ trong danh mục này.',
                        onOk: () => handleDeleteCategory(record.id)
                    })} />
                </Space>
            )
        }
    ];

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
            <h1 className="mb-4 text-2xl font-bold">Quản lý Dịch vụ</h1>
            <Tabs items={[
                {
                    key: '1',
                    label: 'Danh mục',
                    children: (
                        <>
                            <Button type="primary" icon={<Plus size={16} />} className="mb-4" onClick={() => {
                                setEditingCategory(null);
                                categoryForm.resetFields();
                                setIsCategoryModalOpen(true);
                            }}>Thêm Danh mục</Button>
                            <Table dataSource={categories} columns={categoryColumns} rowKey="id" loading={loading} />
                        </>
                    )
                },
                {
                    key: '2',
                    label: 'Dịch vụ',
                    children: (
                        <>
                            <Button type="primary" icon={<Plus size={16} />} className="mb-4" onClick={() => {
                                setEditingPackage(null);
                                packageForm.resetFields();
                                setPackageFileList([]);
                                setIsPackageModalOpen(true);
                            }}>Thêm Dịch vụ</Button>
                            <Table dataSource={packages} columns={packageColumns} rowKey="id" loading={loading} />
                        </>
                    )
                }
            ]} />

            {/* Category Modal */}
            <Modal
                title={editingCategory ? "Sửa Danh mục" : "Thêm Danh mục"}
                open={isCategoryModalOpen}
                onCancel={() => setIsCategoryModalOpen(false)}
                footer={null}
            >
                <Form form={categoryForm} onFinish={handleCategorySubmit} layout="vertical">
                    <Form.Item name="name" label="Tên danh mục" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="iconUrl" label="Icon URL" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Icon">
                        <Space direction="vertical">
                            {categoryIconUrl && (
                                <img 
                                    src={categoryIconUrl} 
                                    alt="Category Icon" 
                                    className="object-cover w-20 h-20 rounded border"
                                />
                            )}
                            <Upload
                                customRequest={({ file, onSuccess, onError }) => handleUpload({ 
                                    file, 
                                    onSuccess: (data) => {
                                        categoryForm.setFieldValue('iconUrl', data.fileUrl);
                                        onSuccess(data);
                                    }, 
                                    onError 
                                })}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <Button icon={<UploadIcon size={16} />}>Tải ảnh lên</Button>
                            </Upload>
                        </Space>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="w-full">Lưu</Button>
                    </Form.Item>
                </Form>
            </Modal>

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
                    <Form.Item name="description" label="Mô tả">
                        <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="imageUrl" label="Image URL" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Hình ảnh">
                        <Space direction="vertical">
                            {packageImageUrl && (
                                <img 
                                    src={packageImageUrl} 
                                    alt="Service Image" 
                                    className="object-cover w-32 h-20 rounded border"
                                />
                            )}
                            <Upload
                                customRequest={({ file, onSuccess, onError }) => handleUpload({ 
                                    file, 
                                    onSuccess: (data) => {
                                        packageForm.setFieldValue('imageUrl', data.fileUrl);
                                        onSuccess(data);
                                    }, 
                                    onError 
                                })}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <Button icon={<UploadIcon size={16} />}>Tải ảnh lên</Button>
                            </Upload>
                        </Space>
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
