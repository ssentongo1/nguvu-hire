"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { MessageSquare, Search, Filter, Eye, Trash2, Mail, User, Calendar } from "lucide-react";

type Message = {
  id: string;
  type: 'hire_request' | 'application' | 'system';
  title: string;
  message: string;
  from_user: string;
  to_user: string;
  from_name: string;
  to_name: string;
  created_at: string;
  status: 'read' | 'unread';
  related_id?: string;
};

export default function AdminMessagesPage() {
  const router = useRouter();
  const { darkMode } = useTheme();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setAuthLoading(false);
      fetchMessages();
    } else {
      router.push("/admin/ads/lock");
    }
  }, [router]);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      // Fetch hire requests
      const { data: hires, error: hiresError } = await supabase
        .from('hires')
        .select('*')
        .order('created_at', { ascending: false });

      if (hiresError) throw hiresError;

      // Fetch notifications (system messages)
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;

      // Transform data into unified message format
      const hireMessages: Message[] = (hires || []).map(hire => ({
        id: hire.id,
        type: 'hire_request',
        title: 'Hire Request',
        message: hire.employer_message,
        from_user: hire.employer_id,
        to_user: hire.job_seeker_id,
        from_name: 'Employer', // Would need to fetch actual names
        to_name: hire.job_seeker_name,
        created_at: hire.created_at,
        status: 'unread',
        related_id: hire.id
      }));

      const systemMessages: Message[] = (notifications || []).map(notif => ({
        id: notif.id,
        type: 'system',
        title: notif.title,
        message: notif.message,
        from_user: 'system',
        to_user: notif.user_id,
        from_name: 'System',
        to_name: 'User',
        created_at: notif.created_at,
        status: notif.is_read ? 'read' : 'unread',
        related_id: notif.related_id
      }));

      const allMessages = [...hireMessages, ...systemMessages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMessages(allMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const lockAdmin = () => {
    sessionStorage.removeItem("admin_authenticated");
    router.push("/admin/ads/lock");
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const deleteMessage = async (messageId: string, messageType: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const table = messageType === 'hire_request' ? 'hires' : 'notifications';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      fetchMessages();
      alert("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Error deleting message");
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.from_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.to_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || message.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'hire_request': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'application': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      case 'system': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="mt-4">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const textMuted = darkMode ? "text-gray-300" : "text-gray-600";
  const textPrimary = darkMode ? "text-white" : "text-gray-900";

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      darkMode ? "bg-gradient-to-br from-blue-900 via-purple-900 to-black text-white" : "bg-gray-50 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Messages Management</h1>
            <p className={`${textMuted}`}>Monitor and manage user communications</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigateTo("/admin")}
              className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition text-base backdrop-blur-lg"
            >
              ← Back to Dashboard
            </button>
            <button
              onClick={lockAdmin}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-base backdrop-blur-lg"
            >
              🔒 Lock
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`mb-6 p-6 rounded-xl backdrop-blur-lg border-2 ${
          darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-white/10 border-white/20 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="all">All Types</option>
                <option value="hire_request">Hire Requests</option>
                <option value="system">System Messages</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className={`rounded-xl backdrop-blur-lg border-2 ${
          darkMode ? "bg-white/10 border-white/20" : "bg-white/80 border-gray-200"
        }`}>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className={textMuted}>Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>No messages found</h3>
              <p className={textMuted}>
                {searchQuery || typeFilter !== "all" 
                  ? "Try adjusting your search or filters"
                  : "No messages to display"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="grid grid-cols-1 gap-0">
                {filteredMessages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`p-6 border-b ${
                      darkMode ? "border-white/20" : "border-gray-200"
                    } ${index === filteredMessages.length - 1 ? 'border-b-0' : ''} ${
                      message.status === 'unread' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-xl font-bold ${textPrimary}`}>
                            {message.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getMessageTypeColor(message.type)}`}>
                            {message.type.toUpperCase()}
                          </span>
                          {message.status === 'unread' && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                              UNREAD
                            </span>
                          )}
                        </div>
                        
                        <p className={`mb-3 line-clamp-2 ${textMuted}`}>
                          {message.message}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className={textMuted}>From: {message.from_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className={textMuted}>To: {message.to_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={textMuted}>
                              {new Date(message.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => deleteMessage(message.id, message.type)}
                          className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition backdrop-blur-lg"
                          title="Delete Message"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && filteredMessages.length > 0 && (
          <div className={`mt-4 p-4 rounded-lg backdrop-blur-lg ${
            darkMode ? "bg-white/10 border border-white/20" : "bg-white/80 border border-gray-200"
          }`}>
            <div className="flex justify-between items-center">
              <p className={`text-sm ${textMuted}`}>
                Showing {filteredMessages.length} of {messages.length} messages
              </p>
              <div className="flex gap-4 text-sm">
                <span className={`px-2 py-1 rounded-full ${getMessageTypeColor('hire_request')}`}>
                  Hire Requests: {messages.filter(m => m.type === 'hire_request').length}
                </span>
                <span className={`px-2 py-1 rounded-full ${getMessageTypeColor('system')}`}>
                  System: {messages.filter(m => m.type === 'system').length}
                </span>
                <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  Unread: {messages.filter(m => m.status === 'unread').length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}