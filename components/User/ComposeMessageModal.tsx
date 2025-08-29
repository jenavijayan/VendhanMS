
import React, { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiSendInternalMessage } from '../../services/api';
import { User, MessageRecipient, MessageAttachment } from '../../types';
import { THEME } from '../../constants';
import { XMarkIcon, PaperAirplaneIcon, PaperClipIcon, CameraIcon, TrashIcon as RemoveIcon } from '@heroicons/react/24/outline';

// Make html2canvas globally available after CDN load
declare var html2canvas: any;


interface ComposeMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[]; // Users available for selection
  onMessageSent: () => void;
  onError: (errorMessage: string) => void;
  initialRecipientId?: MessageRecipient; // Can be userId or 'ALL_USERS'
  initialContent?: string;
  allowRecipientChange?: boolean;
  forceBroadcast?: boolean; // If true, recipient is fixed to 'ALL_USERS'
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ComposeMessageModal: React.FC<ComposeMessageModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onMessageSent,
  onError,
  initialRecipientId = '',
  initialContent = '',
  allowRecipientChange = true,
  forceBroadcast = false,
}) => {
  const [recipientId, setRecipientId] = useState<MessageRecipient>(initialRecipientId);
  const [content, setContent] = useState(initialContent);
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setRecipientId(forceBroadcast ? 'ALL_USERS' : initialRecipientId || '');
      setContent(initialContent || '');
      setAttachment(null); // Reset attachment when modal opens
      onError(''); 
    }
  }, [isOpen, initialRecipientId, initialContent, forceBroadcast, onError]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        onError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          filename: file.name,
          mimeType: file.type,
          dataUrl: reader.result as string,
          size: file.size,
        });
        onError(''); // Clear previous errors
      };
      reader.onerror = () => {
        onError('Failed to read the file.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureScreenshot = async () => {
    onError('');
    setIsLoading(true); // Indicate activity
    try {
      const mainAppContainer = document.getElementById('root'); // Or a more specific container if desired
      if (!mainAppContainer) {
          throw new Error("App container not found for screenshot.");
      }
      if (typeof html2canvas === 'undefined') {
          throw new Error("Screenshot library (html2canvas) is not loaded. Ensure it's in index.html.");
      }

      const canvas = await html2canvas(mainAppContainer, { 
        logging: false, 
        useCORS: true, 
        scale: Math.min(1, 1200 / mainAppContainer.offsetWidth) // Optional: scale down very large screenshots
      });
      const dataUrl = canvas.toDataURL('image/png');
      setAttachment({
        filename: `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`,
        mimeType: 'image/png',
        dataUrl: dataUrl,
        size: dataUrl.length, // Approximate size, actual binary size would differ
      });
    } catch (err: any) {
      console.error("Screenshot failed:", err);
      onError(err.message || 'Failed to capture screenshot.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input if it was used
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onError(''); 

    if (!content.trim() && !attachment) {
      onError('Message content or an attachment is required.');
      return;
    }
    if (!forceBroadcast && recipientId === '') {
      onError('Please select a recipient.');
      return;
    }
    
    setIsLoading(true);
    try {
      await apiSendInternalMessage({
        senderId: currentUser.id,
        recipientId: forceBroadcast ? 'ALL_USERS' : recipientId,
        content: content.trim(),
        attachment: attachment,
      });
      onMessageSent();
      onClose(); 
    } catch (err: any) {
      onError(err.message || 'Failed to send message.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectBaseClasses = `mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`;
  const buttonPrimaryClasses = `flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-${THEME.primaryText} bg-${THEME.primary} hover:bg-opacity-85 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${THEME.primary} disabled:opacity-50 transition`;
  const iconButtonClasses = `p-2 text-gray-500 hover:text-${THEME.secondary} focus:outline-none focus:ring-2 focus:ring-${THEME.secondary} rounded-md`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-xl my-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold text-${THEME.primary}`}>Compose Message</h3>
          <button onClick={onClose} className={`text-gray-400 hover:text-gray-600`}>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recipient" className={`block text-sm font-medium text-${THEME.accentText}`}>To:</label>
            {forceBroadcast ? (
                 <input
                    type="text"
                    value="ALL USERS (Broadcast)"
                    readOnly
                    className={`${selectBaseClasses} bg-gray-100 cursor-not-allowed`}
                />
            ) : allowRecipientChange ? (
              <select
                id="recipient"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className={selectBaseClasses}
                required={!forceBroadcast}
              >
                <option value="" disabled>Select a recipient</option>
                {currentUser.role === 'admin' && <option value="ALL_USERS">ALL USERS (Broadcast)</option>}
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            ) : ( 
                <input
                    type="text"
                    value={allUsers.find(u => u.id === recipientId)?.email || (recipientId === 'ALL_USERS' ? 'ALL_USERS' : 'Specific User')}
                    readOnly
                    className={`${selectBaseClasses} bg-gray-100 cursor-not-allowed`}
                />
            )}
          </div>
          <div>
            <label htmlFor="messageContent" className={`block text-sm font-medium text-${THEME.accentText}`}>Message:</label>
            <textarea
              id="messageContent"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${THEME.secondary} focus:border-${THEME.secondary} sm:text-sm`}
              placeholder="Type your message here..."
            />
          </div>

          {attachment && (
            <div className="mt-2 p-3 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Attachment:</p>
                  {attachment.mimeType.startsWith('image/') ? (
                    <img src={attachment.dataUrl} alt={attachment.filename} className="max-h-20 max-w-full rounded mt-1" />
                  ) : (
                     <DocumentIcon className="h-10 w-10 text-gray-400 mt-1" />
                  )}
                  <p className="text-xs text-gray-500 truncate" title={attachment.filename}>{attachment.filename} ({(attachment.size / 1024).toFixed(1)} KB)</p>
                </div>
                <button type="button" onClick={removeAttachment} className={`${iconButtonClasses} text-red-500 hover:text-red-700`} title="Remove attachment">
                  <RemoveIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 mt-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className={iconButtonClasses} title="Attach file">
              <PaperClipIcon className="h-6 w-6" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" />
            
            <button type="button" onClick={handleCaptureScreenshot} className={iconButtonClasses} title="Capture app screenshot" disabled={isLoading}>
              {isLoading && attachment?.filename.startsWith('screenshot-') ? 
                <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> :
                <CameraIcon className="h-6 w-6" />
              }
            </button>
            <p className="text-xs text-gray-500">Max file size: {MAX_FILE_SIZE_MB}MB. Allowed: Images, PDF, DOC, TXT.</p>
          </div>


          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50`}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading || (!content.trim() && !attachment)} className={buttonPrimaryClasses}>
              {isLoading ? 'Sending...' : <><PaperAirplaneIcon className="h-5 w-5 mr-2 transform rotate-45" /> Send Message</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// Helper Document Icon (if not already available or for simplicity here)
const DocumentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );

export default ComposeMessageModal;