import { useState, useEffect, useRef } from 'react';
import { Badge, Popover, List, Avatar, Typography, Button, Empty, notification } from 'antd';
import { Bell, Check, Clock, MessageSquare } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

const NotificationBell = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef(null);
  const lastNotifIdRef = useRef(null);
  const clientRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      
      const newNotifications = listRes.data || [];
      const newUnreadCount = countRes.data || 0;

      if (lastNotifIdRef.current !== null && newNotifications.length > 0) {
        const latestId = newNotifications[0].id;
        if (latestId > lastNotifIdRef.current) {
             const newItems = newNotifications.filter(n => n.id > lastNotifIdRef.current);
             newItems.forEach(item => {
                 if (!item.read) {
                    notification.open({
                        message: item.title,
                        description: item.message,
                        icon: <Bell style={{ color: '#108ee9' }} />,
                        placement: 'bottomRight',
                    });
                    // Browser push notification when tab is hidden
                    if (document.hidden && window.Notification && Notification.permission === 'granted') {
                      new Notification(item.title, {
                        body: item.message,
                        icon: '/favicon.ico'
                      });
                    }
                 }
             });
        }
        lastNotifIdRef.current = latestId;
      } else if (newNotifications.length > 0) {
          lastNotifIdRef.current = newNotifications[0].id;
      }

      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Error fetching notifications', error);
    } finally {
      setLoading(false);
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

  const handleNotificationClick = (item) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    // Navigate to messages for chat-related notifications
    if (item.type === 'CHAT_MESSAGE' || item.type === 'CHAT_CONVERSATION' || item.type === 'CHAT_MENTION') {
      setOpen(false);
      navigate('/messages');
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Request browser notification permission
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const token = localStorage.getItem('token');
    if (token) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const client = new Client({
        brokerURL: `${wsProtocol}://${window.location.host}/ws-chat`,
        reconnectDelay: 5000,
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: () => {}
      });

      client.onConnect = () => {
        client.subscribe('/user/queue/notifications', (frame) => {
          const item = JSON.parse(frame.body);
          setNotifications(prev => [item, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + (item.read ? 0 : 1));
          lastNotifIdRef.current = item.id;
          notification.open({
            message: item.title,
            description: item.message,
            icon: item.type?.startsWith('CHAT_') ? <MessageSquare style={{ color: '#3b82f6' }} /> : <Bell style={{ color: '#108ee9' }} />,
            placement: 'bottomRight',
          });
          // Browser push when tab is hidden
          if (document.hidden && window.Notification && Notification.permission === 'granted') {
            new Notification(item.title, {
              body: item.message,
              icon: '/favicon.ico'
            });
          }
        });
      };

      client.activate();
      clientRef.current = client;
    }

    intervalRef.current = setInterval(fetchNotifications, 15000);
    
    return () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (clientRef.current) {
            clientRef.current.deactivate();
        }
    };
  }, []);

  const getNotificationIcon = (item) => {
    if (item.type === 'CHAT_MESSAGE' || item.type === 'CHAT_CONVERSATION' || item.type === 'CHAT_MENTION') {
      return <Avatar icon={<MessageSquare size={16} />} className={item.read ? (darkMode ? 'bg-slate-700' : 'bg-gray-200') : 'bg-blue-500'} />;
    }
    return <Avatar icon={item.type === 'ORDER' ? <Clock size={16} /> : <Bell size={16} />} className={item.read ? (darkMode ? 'bg-slate-700' : 'bg-gray-200') : 'bg-blue-500'} />;
  };

  const content = (
    <div className={`w-80 max-h-96 overflow-y-auto ${darkMode ? 'bg-slate-800' : ''}`}>
      <div className="flex justify-between items-center mb-2 px-2">
        <Text strong className={darkMode ? '!text-slate-100' : ''}>Thông báo</Text>
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
            className={`cursor-pointer transition-colors px-2 rounded ${
              !item.read 
                ? darkMode ? 'bg-blue-950/50 hover:bg-slate-700' : 'bg-blue-50 hover:bg-blue-100'
                : darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'
            }`}
            onClick={() => handleNotificationClick(item)}
          >
            <List.Item.Meta
              avatar={getNotificationIcon(item)}
              title={
                <div className="flex justify-between items-start">
                  <Text strong={!item.read} className={`text-sm ${darkMode ? '!text-slate-200' : ''}`}>{item.title}</Text>
                  {!item.read && <Badge status="processing" />}
                </div>
              }
              description={
                <div className="flex flex-col gap-1">
                  <Text className={`text-xs line-clamp-2 ${darkMode ? '!text-slate-400' : 'text-gray-600'}`}>{item.message}</Text>
                  <Text type="secondary" className={`text-[10px] ${darkMode ? '!text-slate-500' : ''}`}>{dayjs(item.createdAt).fromNow()}</Text>
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
      <div className={`relative cursor-pointer p-2 rounded-full transition-colors ${
        darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'
      }`}>
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Bell size={20} className={darkMode ? 'text-slate-300' : 'text-gray-600'} />
        </Badge>
      </div>
    </Popover>
  );
};

export default NotificationBell;
