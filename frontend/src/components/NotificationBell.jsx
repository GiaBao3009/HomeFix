import React, { useState, useEffect, useRef } from 'react';
import { Badge, Popover, List, Avatar, Typography, Button, Empty, notification } from 'antd';
import { Bell, Check, Clock } from 'lucide-react';
import api from '../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef(null);
  const lastNotifIdRef = useRef(null); // Track the latest notification ID

  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      
      const newNotifications = listRes.data || [];
      const newUnreadCount = countRes.data || 0;

      // Check for new notifications to show toast
      if (lastNotifIdRef.current !== null && newNotifications.length > 0) {
        const latestId = newNotifications[0].id;
        if (latestId > lastNotifIdRef.current) {
             // Find all new notifications
             const newItems = newNotifications.filter(n => n.id > lastNotifIdRef.current);
             newItems.forEach(item => {
                 // Only notify if it's unread
                 if (!item.read) {
                    notification.open({
                        message: item.title,
                        description: item.message,
                        icon: <Bell style={{ color: '#108ee9' }} />,
                        placement: 'bottomRight',
                    });
                 }
             });
        }
        lastNotifIdRef.current = latestId;
      } else if (newNotifications.length > 0) {
          // First load
          lastNotifIdRef.current = newNotifications[0].id;
      }

      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Error fetching notifications', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 3 seconds
    intervalRef.current = setInterval(fetchNotifications, 3000);
    
    return () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };
  }, []);

  const content = (
    <div className="w-80 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-2 px-2">
        <Text strong>Thông báo</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead}>
            Đánh dấu đã đọc tất cả
          </Button>
        )}
      </div>
      <List
        dataSource={notifications}
        loading={loading}
        locale={{ emptyText: <Empty description="Không có thông báo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        renderItem={item => (
          <List.Item 
            className={`cursor-pointer hover:bg-gray-50 transition-colors px-2 rounded ${!item.read ? 'bg-blue-50' : ''}`}
            onClick={() => !item.read && markAsRead(item.id)}
          >
            <List.Item.Meta
              avatar={
                <Avatar 
                  icon={item.type === 'ORDER' ? <Clock size={16} /> : <Bell size={16} />} 
                  className={item.read ? 'bg-gray-200' : 'bg-blue-500'} 
                />
              }
              title={
                <div className="flex justify-between items-start">
                  <Text strong={!item.read} className="text-sm">{item.title}</Text>
                  {!item.read && <Badge status="processing" />}
                </div>
              }
              description={
                <div className="flex flex-col gap-1">
                  <Text className="text-xs text-gray-600 line-clamp-2">{item.message}</Text>
                  <Text type="secondary" className="text-[10px]">{dayjs(item.createdAt).fromNow()}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Popover 
      content={content} 
      trigger="click" 
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      overlayClassName="notification-popover"
    >
      <div className="relative cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors">
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Bell size={20} className="text-gray-600" />
        </Badge>
      </div>
    </Popover>
  );
};

export default NotificationBell;
