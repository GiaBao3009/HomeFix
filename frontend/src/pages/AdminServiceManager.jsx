import { useState, useEffect, useMemo } from 'react';
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    InputNumber,
    Select,
    message,
    Space,
    Upload,
    Typography,
    Card,
} from 'antd';
import { Edit, Trash, Plus, Upload as UploadIcon, Search, Package } from 'lucide-react';
import api from '../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const CATEGORY_FILTER_ALL = 'ALL';

const AdminServiceManager = () => {
    // State
    const [categories, setCategories] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [packageSearch, setPackageSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(CATEGORY_FILTER_ALL);

    // Modal State
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);

    const [packageForm] = Form.useForm();
    const [packageFileList, setPackageFileList] = useState([]);
    const [imageLinkInput, setImageLinkInput] = useState('');

    // Watch form values for preview
    const packageImageUrl = Form.useWatch('imageUrl', { form: packageForm, preserve: true });
    const packageImageUrls = Form.useWatch('imageUrls', { form: packageForm, preserve: true }) || [];

    const isValidHttpUrl = (value) => {
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    };

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const [catRes, pkgRes] = await Promise.all([api.get('/services/categories'), api.get('/services/packages')]);

            setCategories(Array.isArray(catRes.data) ? catRes.data : []);
            const packageData = Array.isArray(pkgRes.data) ? pkgRes.data : [];
            setPackages(packageData);
        } catch (error) {
            console.error("Error fetching services:", error);
            const errorMsg =
                error.response?.data?.message || error.response?.data?.error || 'Không thể tải dữ liệu dịch vụ';
            message.error(errorMsg);
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

            setPackageFileList((prev) => [
                ...prev,
                {
                    uid: file.uid,
                    name: file.name,
                    status: 'done',
                    url: newUrl,
                },
            ]);

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
        const newUrls = currentUrls.filter((url) => url !== urlToRemove);
        packageForm.setFieldValue('imageUrls', newUrls);

        if (packageForm.getFieldValue('imageUrl') === urlToRemove) {
            packageForm.setFieldValue('imageUrl', newUrls[0] || '');
        }

        setPackageFileList((prev) => prev.filter((item) => item.uid !== file.uid));
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
            setImageLinkInput('');
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

    const handleAddImageLink = () => {
        const url = imageLinkInput.trim();

        if (!url) {
            message.warning('Vui lòng nhập link ảnh');
            return;
        }

        if (!isValidHttpUrl(url)) {
            message.error('Link ảnh không hợp lệ');
            return;
        }

        const currentUrls = packageForm.getFieldValue('imageUrls') || [];
        if (currentUrls.includes(url)) {
            message.info('Link ảnh đã tồn tại');
            return;
        }

        const newUrls = [...currentUrls, url];
        packageForm.setFieldValue('imageUrls', newUrls);

        if (!packageForm.getFieldValue('imageUrl')) {
            packageForm.setFieldValue('imageUrl', url);
        }

        setImageLinkInput('');
        message.success('Đã thêm link ảnh');
    };

    const filteredPackages = useMemo(() => {
        const q = packageSearch.trim().toLowerCase();
        return packages.filter((p) => {
            const nameOk = !q || (p.name || '').toLowerCase().includes(q);
            const catOk =
                categoryFilter === CATEGORY_FILTER_ALL ||
                Number(p.categoryId) === Number(categoryFilter);
            return nameOk && catOk;
        });
    }, [packages, packageSearch, categoryFilter]);

    const serviceSummary = useMemo(
        () => ({
            services: packages.length,
            categories: categories.length,
        }),
        [packages, categories],
    );

    const packageColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
        {
            title: 'Ảnh',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            width: 72,
            align: 'center',
            render: (url) =>
                url ? (
                    <img
                        src={url}
                        alt=""
                        className="mx-auto h-10 w-10 rounded-md border border-slate-200 object-cover"
                    />
                ) : (
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                        —
                    </div>
                ),
        },
        { title: 'Tên dịch vụ', dataIndex: 'name', key: 'name' },
        { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName' },
        {
            title: 'Giá',
            dataIndex: 'price',
            key: 'price',
            render: (val) => {
                const n = val != null ? Number(val) : NaN;
                if (Number.isNaN(n)) return '—';
                return `${n.toLocaleString('vi-VN')} đ`;
            },
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<Edit size={16} />}
                        onClick={() => {
                            setEditingPackage(record);
                            packageForm.setFieldsValue({
                                ...record,
                                imageUrls: Array.isArray(record.imageUrls)
                                    ? record.imageUrls
                                    : record.imageUrl
                                      ? [record.imageUrl]
                                      : [],
                            });
                            setImageLinkInput('');
                            setIsPackageModalOpen(true);
                        }}
                    />
                    <Button
                        danger
                        icon={<Trash size={16} />}
                        onClick={() =>
                            Modal.confirm({
                                title: 'Xóa dịch vụ?',
                                onOk: () => handleDeletePackage(record.id),
                            })
                        }
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Quản lý Dịch vụ</h1>
                <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={() => {
                        setEditingPackage(null);
                        packageForm.resetFields();
                        setPackageFileList([]);
                        setImageLinkInput('');
                        setIsPackageModalOpen(true);
                    }}
                >
                    Thêm Dịch vụ
                </Button>
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        <Package size={14} className="text-slate-500" />
                        Dịch vụ: {serviceSummary.services}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                        Danh mục: {serviceSummary.categories}
                    </span>
                </div>
                <Space wrap className="w-full lg:w-auto">
                    <Input
                        allowClear
                        prefix={<Search size={16} className="text-slate-400" />}
                        placeholder="Tìm theo tên dịch vụ…"
                        value={packageSearch}
                        onChange={(e) => setPackageSearch(e.target.value)}
                        className="min-w-[200px] flex-1 lg:max-w-sm"
                    />
                    <Select
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        className="min-w-[200px]"
                        placeholder="Lọc danh mục"
                    >
                        <Option value={CATEGORY_FILTER_ALL}>Tất cả danh mục</Option>
                        {(categories || []).map((c) => (
                            <Option key={c.id} value={c.id}>
                                {c.name}
                            </Option>
                        ))}
                    </Select>
                </Space>
            </div>

            <Card className="rounded-xl border border-slate-200/80 shadow-sm">
                <Table dataSource={filteredPackages} columns={packageColumns} rowKey="id" loading={loading} />
            </Card>

            {/* Package Modal */}
            <Modal
                title={editingPackage ? 'Sửa Dịch vụ' : 'Thêm Dịch vụ'}
                open={isPackageModalOpen}
                onCancel={() => {
                    setImageLinkInput('');
                    setIsPackageModalOpen(false);
                }}
                footer={null}
                width={560}
                styles={{ body: { paddingTop: 20, paddingBottom: 24 } }}
            >
                <Form
                    form={packageForm}
                    onFinish={handlePackageSubmit}
                    layout="vertical"
                    className="[&_.ant-form-item]:mb-5 [&_.ant-form-item:last-child]:mb-0"
                >
                    <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
                        <Select size="large">
                            {(categories || []).map((c) => (
                                <Option key={c.id} value={c.id}>
                                    {c.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="name" label="Tên dịch vụ" rules={[{ required: true }]}>
                        <Input size="large" />
                    </Form.Item>
                    <Form.Item name="price" label="Giá" rules={[{ required: true }]}>
                        <InputNumber className="w-full" min={0} size="large" />
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
                    <Form.Item label="Hình ảnh" className="mb-6">
                        <div className="space-y-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Input
                                    value={imageLinkInput}
                                    onChange={(e) => setImageLinkInput(e.target.value)}
                                    placeholder="Dán link ảnh (https://...)"
                                    size="large"
                                    onPressEnter={(e) => {
                                        e.preventDefault();
                                        handleAddImageLink();
                                    }}
                                />
                                <Button size="large" onClick={handleAddImageLink} className="shrink-0 sm:w-auto">
                                    Thêm link
                                </Button>
                            </div>
                            {imageLinkInput.trim() && isValidHttpUrl(imageLinkInput.trim()) && (
                                <div className="h-24 w-40">
                                    <img
                                        src={imageLinkInput.trim()}
                                        alt="Xem trước link ảnh"
                                        className="h-full w-full rounded-md border object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex flex-wrap gap-4">
                                {(packageImageUrls.length ? packageImageUrls : [packageImageUrl])
                                    .filter(Boolean)
                                    .map((url, index) => (
                                        <div key={index} className="group relative h-20 w-32">
                                            <img
                                                src={url}
                                                alt={`Service ${index}`}
                                                className="h-full w-full rounded-md border object-cover"
                                            />
                                            <div className="absolute inset-0 hidden items-center justify-center rounded-md bg-black/50 group-hover:flex">
                                                <Button
                                                    danger
                                                    size="small"
                                                    icon={<Trash size={14} />}
                                                    onClick={() => handleRemovePackageImage({ url, uid: index })}
                                                />
                                            </div>
                                            {url === packageImageUrl && (
                                                <div className="absolute right-0 top-0 rounded-bl bg-blue-500 px-1 text-xs text-white">
                                                    Main
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                            <Upload customRequest={handlePackageUpload} showUploadList={false} accept="image/*" multiple>
                                <Button icon={<UploadIcon size={16} />} size="large">
                                    Thêm ảnh
                                </Button>
                            </Upload>
                            <Text type="secondary" className="block text-xs leading-relaxed">
                                Ảnh đầu tiên sẽ là ảnh đại diện. Tải lên nhiều ảnh để tạo thư viện ảnh cho dịch vụ.
                            </Text>
                        </div>
                    </Form.Item>
                    <Form.Item className="mb-0 mt-2">
                        <Button type="primary" htmlType="submit" size="large" className="w-full">
                            Lưu
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdminServiceManager;
