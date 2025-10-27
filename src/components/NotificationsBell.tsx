"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, usePathname } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
};

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const { darkMode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription for notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('New notification received:', payload);
          fetchNotifications();
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications' },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Auto-mark notifications as read when user navigates to relevant pages
  useEffect(() => {
    const markRelevantNotificationsAsRead = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let notificationTypesToMark: string[] = [];

      // Mark hire request notifications as read when user is on hire-requests page
      if (pathname === '/hire-requests') {
        notificationTypesToMark.push('hire_request');
      }

      // Mark application notifications as read when user is on applications page
      if (pathname === '/employer/applications') {
        notificationTypesToMark.push('new_application');
      }

      if (notificationTypesToMark.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .in('type', notificationTypesToMark)
          .eq('is_read', false);

        if (!error) {
          // Update local state immediately
          setNotifications(prev => 
            prev.map(n => 
              notificationTypesToMark.includes(n.type) && !n.is_read 
                ? { ...n, is_read: true } 
                : n
            )
          );
          setUnreadCount(prev => {
            const relevantUnreadCount = prev - notifications.filter(n => 
              notificationTypesToMark.includes(n.type) && !n.is_read
            ).length;
            return Math.max(0, relevantUnreadCount);
          });
        }
      }
    };

    markRelevantNotificationsAsRead();
  }, [pathname]);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      console.log("📬 Notifications fetched:", data);
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent marking as read when deleting
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const deletedNotification = notifications.find(n => n.id === notificationId);
      
      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification');
    }
  };

  const deleteAllNotifications = async () => {
    if (!confirm("Are you sure you want to delete all notifications?")) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      alert('Failed to delete all notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_submitted':
        return '📝';
      case 'application_status':
        return '🔔';
      case 'new_application':
        return '👤';
      case 'hire_request':
        return '💼';
      case 'hire_status_update':
        return '🤝';
      default:
        return '💡';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setShowDropdown(false);

    // Navigate based on notification type - only for specific types
    if (notification.type === 'hire_request') {
      router.push('/hire-requests');
    } else if (notification.type === 'new_application') {
      // Only navigate for new applications
      router.push('/employer/applications');
    }
    // For other notification types (application_status, hire_status_update, etc.)
    // don't navigate, just mark as read and close dropdown
  };

  const isNotificationClickable = (notification: Notification) => {
    // Only make specific notification types clickable for navigation
    return notification.type === 'hire_request' || notification.type === 'new_application';
  };

  return (
    <div className="relative">
      {/* Original Small Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 rounded-lg transition ${
          darkMode 
            ? "hover:bg-gray-700" 
            : "hover:bg-gray-200"
        }`}
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop - Click outside to close */}
          <div 
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div className={`
            fixed sm:absolute 
            top-16 right-2 sm:right-0 sm:top-full sm:mt-2
            w-[calc(100vw-1rem)] sm:w-96
            max-w-sm sm:max-w-none
            rounded-xl shadow-2xl z-50
            border
            ${darkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
            }
          `}>
            {/* Header */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                    <span className="text-xl">🔔</span>
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        {unreadCount} unread
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        min-h-[36px] flex items-center justify-center
                        ${darkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }
                      `}
                    >
                      Mark All
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={deleteAllNotifications}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        min-h-[36px] flex items-center justify-center
                        ${darkMode 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                        }
                      `}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className={`${notifications.length > 4 ? 'max-h-[60vh] sm:max-h-80 overflow-y-auto' : ''}`}>
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-5xl mb-4 opacity-50">📭</div>
                  <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    No notifications yet
                  </p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    We'll notify you when something arrives
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        relative p-3 rounded-lg mb-2 transition-all duration-200
                        group border
                        ${isNotificationClickable(notification) 
                          ? 'cursor-pointer active:scale-[0.98]' 
                          : 'cursor-default'
                        }
                        ${darkMode 
                          ? 'border-gray-700 hover:bg-gray-700/50' 
                          : 'border-gray-200 hover:bg-gray-50'
                        }
                        ${!notification.is_read 
                          ? darkMode 
                            ? 'bg-blue-900/20 border-blue-700/50' 
                            : 'bg-blue-50 border-blue-200'
                          : ''
                        }
                      `}
                      onClick={() => {
                        if (isNotificationClickable(notification)) {
                          handleNotificationClick(notification);
                        } else {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      {/* Delete Button - Always visible */}
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className={`
                          absolute top-3 right-3 p-2 rounded-lg transition-all
                          min-w-[36px] min-h-[36px] flex items-center justify-center
                          active:scale-95
                          ${darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }
                        `}
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <span className="text-sm">🗑️</span>
                      </button>

                      {/* Notification Content */}
                      <div className="flex items-start gap-3 pr-12">
                        {/* Icon */}
                        <div className={`
                          p-2 rounded-lg text-xl flex-shrink-0
                          ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}
                        `}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1 gap-2">
                            <h4 className={`
                              font-semibold text-sm leading-tight break-words
                              ${darkMode ? 'text-white' : 'text-gray-900'}
                            `}>
                              {notification.title}
                              {isNotificationClickable(notification) && (
                                <span className="ml-1 text-xs opacity-60">🔗</span>
                              )}
                            </h4>
                            
                            {/* Unread Indicator */}
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          
                          {/* Message */}
                          <p className={`
                            text-sm leading-relaxed break-words mb-2
                            ${darkMode ? 'text-gray-300' : 'text-gray-600'}
                          `}>
                            {notification.message}
                          </p>
                          
                          {/* Timestamp */}
                          <p className={`
                            text-xs
                            ${darkMode ? 'text-gray-500' : 'text-gray-400'}
                          `}>
                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Show scroll hint only when there are many notifications */}
            {notifications.length > 4 && (
              <div className={`p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Scroll to see more notifications
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}