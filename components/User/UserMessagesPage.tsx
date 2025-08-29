
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetchUserMessages, apiMarkMessageAsRead, apiMarkAllMessagesAsReadForUser, apiFetchAllUsers } from '../../services/api'; 
import { InternalMessage, User, MessageAttachment } from '../../types';
import { THEME } from '../../constants';
import { EnvelopeIcon, UserCircleIcon, CheckCircleIcon, PencilSquareIcon, ArrowDownTrayIcon as DownloadIcon, CheckIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateUtils';
import { renderMarkdown } from '../../utils/markdownUtils'; // Import markdown renderer
import ComposeMessageModal from './ComposeMessageModal'; 

const UserMessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [initialRecipientForReply, setInitialRecipientForReply] = useState<string | undefined>(undefined);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);


  const fetchMessagesAndUsers = useCallback(async () => {
    if (!user?.id) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [fetchedMessages, fetchedUsersList] = await Promise.all([
        apiFetchUserMessages(user.id),
        apiFetchAllUsers() 
      ]);
      setMessages(fetchedMessages);
      setAllUsers(fetchedUsersList.filter(u => u.id !== user.id)); 
    } catch (err: any) {
      setError(err.message || 'Failed to load messages or users.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMessagesAndUsers();
  }, [fetchMessagesAndUsers]);

  const handleMarkAsRead = async (messageId: string) => {
    if (!user?.id) return;
    const message = messages.find(msg => msg.id === messageId);
    if (message && !message.isRead && (message.recipientId === user.id || message.recipientId === 'ALL_USERS')) {
        try {
        await apiMarkMessageAsRead(messageId, user.id);
        setMessages(prev => prev.map(msg => msg.id === messageId ? {...msg, isRead: true} : msg));
        } catch (err) {
        console.error("Failed to mark message as read:", err);
        }
    }
  };
  
  const handleMarkAllAsRead = async () => {
    const unreadMessagesExist = messages.some(msg => !msg.isRead && (msg.recipientId === user?.id || msg.recipientId === 'ALL_USERS') && msg.senderId !== user?.id);
    if (!user?.id || !unreadMessagesExist) return;
    
    try {
        await apiMarkAllMessagesAsReadForUser(user.id);
        fetchMessagesAndUsers(); 
    } catch (err) {
        console.error("Failed to mark all messages as read:", err);
        setError("Failed to update read status for all messages.");
    }
  };

  const handleMessageSent = () => {
    setIsComposeModalOpen(false);
    fetchMessagesAndUsers(); 
  };
  
  const handleReply = (senderId: string) => {
    if (senderId === 'SYSTEM' || senderId === user?.id) return; 
    setInitialRecipientForReply(senderId);
    setIsComposeModalOpen(true);
  };

  const handleDownloadAttachment = (attachment: MessageAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const ReadReceiptIcon: React.FC<{isRead: boolean}> = ({ isRead }) => (
    <span className={`ml-1 text-xs ${isRead ? 'text-blue-500' : 'text-gray-400'}`} title={isRead ? "Read" : "Sent"}>
        <CheckIcon className="h-3 w-3 inline-block" />
        {isRead && <CheckIcon className="h-3 w-3 inline-block -ml-1.5" />}
    </span>
  );


  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-xl shadow-lg text-center text-${THEME.accentText}`}>
        <svg className={`animate-spin h-8 w-8 text-${THEME.primary} mx-auto mb-2`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading messages...
      </div>
    );
  }

  if (error) {
    return <div className={`p-6 bg-red-100 text-red-700 rounded-xl shadow-lg`}>Error: {error}</div>;
  }

  return (
    <div className={`p-6 bg-white rounded-xl shadow-lg max-w-3xl mx-auto`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className={`text-2xl font-semibold text-${THEME.primary} flex items-center`}>
          <EnvelopeIcon className="h-7 w-7 mr-2" />
          Your Messages
        </h2>
        <div className="flex items-center gap-3">
            {messages.filter(msg => !msg.isRead && (msg.recipientId === user?.id || msg.recipientId === 'ALL_USERS') && msg.senderId !== user?.id).length > 0 && (
                <button
                onClick={handleMarkAllAsRead}
                className={`px-3 py-1.5 text-xs font-medium text-${THEME.secondary} border border-${THEME.secondary} rounded-md hover:bg-${THEME.accent} transition`}
                >
                Mark All as Read
                </button>
            )}
            <button
                onClick={() => { setInitialRecipientForReply(undefined); setIsComposeModalOpen(true);}}
                className={`px-4 py-2 bg-${THEME.primary} text-${THEME.primaryText} text-sm font-medium rounded-md hover:bg-opacity-85 transition flex items-center`}
            >
                <PencilSquareIcon className="h-5 w-5 mr-2" />
                Compose New Message
            </button>
        </div>
      </div>
      
      {messages.length === 0 ? (
        <p className={`text-center text-gray-500 py-8`}>You have no messages.</p>
      ) : (
        <div className="space-y-4">
          {messages.map(message => {
            const isSentByCurrentUser = message.senderId === user?.id;
            const isDirectToCurrentUser = message.recipientId === user?.id;
            const isBroadcast = message.recipientId === 'ALL_USERS';
            
            let displayName = message.senderName;
            let profilePic = message.senderProfilePictureUrl;

            if(isSentByCurrentUser) {
                displayName = "You";
                profilePic = user?.profilePictureUrl;
            }
            
            const canMarkAsRead = !message.isRead && (isDirectToCurrentUser || isBroadcast) && !isSentByCurrentUser;

            return (
                <div 
                key={message.id} 
                className={`p-4 border rounded-lg shadow-sm 
                            ${isSentByCurrentUser ? 'bg-blue-50 ml-auto max-w-[85%]' : 'bg-white mr-auto max-w-[85%]'}
                            ${canMarkAsRead ? `border-${THEME.secondary} ring-1 ring-${THEME.secondary}` : 'border-gray-200'}`}
                >
                <div className={`flex items-start space-x-3 ${isSentByCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {profilePic ? (
                    <img src={profilePic} alt={displayName} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                    <UserCircleIcon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${isSentByCurrentUser ? 'text-right' : ''}`}>
                    <div className={`flex items-center justify-between ${isSentByCurrentUser ? 'flex-row-reverse' : ''}`}>
                        <div className={`${isSentByCurrentUser ? 'text-right' : ''}`}>
                            <p className={`text-sm font-semibold text-${THEME.accentText}`}>
                                {displayName}
                                {isSentByCurrentUser && message.recipientId !== 'ALL_USERS' && <span> to {allUsers.find(u=>u.id === message.recipientId)?.firstName || 'User'}</span>}
                                {isBroadcast && <span className="text-xs text-gray-500 ml-1">(Broadcast)</span>}
                            </p>
                            <p className="text-xs text-gray-500">
                               {formatDate(message.timestamp, { dateStyle: 'medium', timeStyle: 'short' })}
                               {isSentByCurrentUser && <ReadReceiptIcon isRead={message.isRead} />}
                            </p>
                        </div>
                        {canMarkAsRead && (
                        <button 
                            onClick={() => handleMarkAsRead(message.id)}
                            className={`text-xs text-${THEME.secondary} hover:underline focus:outline-none ml-2 flex-shrink-0`}
                            title="Mark as read"
                        >
                            <CheckCircleIcon className="h-5 w-5 inline-block mr-1"/> Mark Read
                        </button>
                        )}
                    </div>
                    {message.content && <div className={`mt-1 text-sm text-gray-700 whitespace-pre-wrap break-words ${isSentByCurrentUser ? 'text-right' : ''}`} dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />}
                    
                    {message.attachment && (
                        <div className={`mt-2 p-2 border border-gray-200 rounded-md ${isSentByCurrentUser ? 'bg-blue-100' : 'bg-gray-50'}`}>
                            {message.attachment.mimeType.startsWith('image/') ? (
                                <img 
                                    src={message.attachment.dataUrl} 
                                    alt={message.attachment.filename} 
                                    className="max-h-48 max-w-full rounded cursor-pointer"
                                    onClick={() => setExpandedImage(message.attachment!.dataUrl)}
                                />
                            ) : (
                                <div className="flex items-center space-x-2">
                                    <DocumentFileIcon className="h-8 w-8 text-gray-400" />
                                    <span className="text-sm text-gray-700 truncate">{message.attachment.filename}</span>
                                </div>
                            )}
                            <button 
                                onClick={() => handleDownloadAttachment(message.attachment!)}
                                className={`mt-1 text-xs text-blue-600 hover:underline flex items-center ${isSentByCurrentUser ? 'justify-end w-full' : '' }`}
                            >
                                <DownloadIcon className="h-4 w-4 mr-1"/> Download ({(message.attachment.size / 1024).toFixed(1)} KB)
                            </button>
                        </div>
                    )}

                    {message.relatedEntityType === 'BillingRecord' && message.relatedEntityId && !isSentByCurrentUser && (
                            <a href={`#/employee/my-billing`} className={`mt-1 text-xs text-${THEME.secondary} hover:underline ${isSentByCurrentUser ? 'text-right block' : 'block'}`}>
                                View Billing Details
                            </a>
                    )}
                    {!isSentByCurrentUser && message.senderId !== 'SYSTEM' && (
                         <button 
                            onClick={() => handleReply(message.senderId)}
                            className={`mt-2 text-xs text-blue-600 hover:underline focus:outline-none`}
                        >
                            Reply
                        </button>
                    )}
                    </div>
                </div>
                </div>
            );
          })}
        </div>
      )}
      {user && (
        <ComposeMessageModal
            isOpen={isComposeModalOpen}
            onClose={() => setIsComposeModalOpen(false)}
            currentUser={user}
            allUsers={allUsers}
            onMessageSent={handleMessageSent}
            onError={(errMsg) => setError(errMsg)} 
            initialRecipientId={initialRecipientForReply} 
            allowRecipientChange={!initialRecipientForReply} 
        />
      )}
      {expandedImage && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 p-4"
            onClick={() => setExpandedImage(null)}
        >
            <img src={expandedImage} alt="Expanded view" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}/>
            <button 
                onClick={() => setExpandedImage(null)} 
                className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                aria-label="Close image preview"
            >
                &times;
            </button>
        </div>
      )}
    </div>
  );
};

// Helper Document Icon
const DocumentFileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

export default UserMessagesPage;