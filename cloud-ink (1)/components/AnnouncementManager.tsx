
import React, { useState } from 'react';
import { SpinnerIcon, MegaphoneIcon, TrashIcon, EditIcon, RefreshIcon } from './icons';
import AnimatedWrapper from './AnimatedWrapper';
import { Announcement } from '../constants';

interface AnnouncementManagerProps {
  announcements: Announcement[];
  onPost: (title: string, content: string) => Promise<void>;
  onDelete: (title: string, content: string) => Promise<void>;
  onUpdate: (oldTitle: string, oldContent: string, newTitle: string, newContent: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const AnnouncementManager: React.FC<AnnouncementManagerProps> = ({ announcements, onPost, onDelete, onUpdate, onRefresh }) => {
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Track the entire original object to use its title/content as keys for update
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date not available';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    try {
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
        return 'Invalid Date';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
        if (editingAnnouncement) {
            await onUpdate(editingAnnouncement.title, editingAnnouncement.content, newTitle, newContent);
            setSuccess("Announcement updated successfully!");
        } else {
            await onPost(newTitle, newContent);
            setSuccess("Announcement posted successfully!");
        }
        setNewTitle('');
        setNewContent('');
        setEditingAnnouncement(null);
    } catch (err: any) {
        if (err.message && err.message.includes("row-level security")) {
            setError("Permission denied: You must enable INSERT/UPDATE policies for the 'public' or 'anon' role on the 'announcements' table in Supabase.");
        } else {
            setError(err.message || "An error occurred.");
        }
        console.error(err);
    } finally {
        setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, announcement: Announcement) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this announcement?")) {
        try {
            await onDelete(announcement.title, announcement.content);
            
            if (editingAnnouncement && announcement.title === editingAnnouncement.title) {
                cancelEdit();
            }
            setSuccess("Announcement deleted.");
            setError(null);
        } catch (err: any) {
            setError("Failed to delete announcement: " + err.message);
        }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
        await onRefresh();
    } catch (err: any) {
        setError("Failed to refresh: " + err.message);
    } finally {
        setRefreshing(false);
    }
  };

  const startEdit = (announcement: Announcement) => {
    setNewTitle(announcement.title);
    setNewContent(announcement.content);
    setEditingAnnouncement(announcement);
    setSuccess(null);
    setError(null);
    window.scrollTo(0, 0);
  };

  const cancelEdit = () => {
    setNewTitle('');
    setNewContent('');
    setEditingAnnouncement(null);
    setSuccess(null);
    setError(null);
  };

  return (
    <AnimatedWrapper delay={0}>
      <div className="max-w-5xl mx-auto">
        <div className="p-8 bg-[#111827]/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center gap-6 mb-8 border-b border-gray-700 pb-6">
            <MegaphoneIcon className="h-16 w-16 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wider">Announcement Manager</h1>
              <p className="mt-2 text-md text-[#A9B4C2]">
                Post new updates to the main dashboard for all employees to see.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#1F2937] p-6 rounded-lg border border-gray-700 h-fit">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">
                {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                    <input 
                        type="text" 
                        required
                        value={newTitle} 
                        onChange={e => setNewTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[#111827] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="e.g., System Maintenance"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                    <textarea 
                        required
                        rows={5}
                        value={newContent} 
                        onChange={e => setNewContent(e.target.value)}
                        className="w-full px-3 py-2 bg-[#111827] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Enter the announcement details here..."
                    />
                </div>

                {success && <div className="text-green-400 text-sm bg-green-900/20 p-2 rounded">{success}</div>}
                {error && <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">{error}</div>}

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-300"
                    >
                        {submitting ? <SpinnerIcon className="animate-spin h-5 w-5" /> : (editingAnnouncement ? "Update Announcement" : "Post Announcement")}
                    </button>
                    {editingAnnouncement && (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300"
                        >
                            Cancel
                        </button>
                    )}
                </div>
              </form>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-600 pb-2 mb-4">
                    <h3 className="text-lg font-semibold text-white">Active Announcements</h3>
                    <button 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        title="Refresh List"
                    >
                        <RefreshIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {announcements.length === 0 ? (
                    <div className="text-center py-10">
                         <p className="text-gray-400 italic">No announcements found.</p>
                         <p className="text-sm text-gray-600 mt-2">Create one to get started, or refresh if data is missing.</p>
                    </div>
                ) : (
                    <div className="space-y-4 h-[600px] overflow-y-auto pr-2">
                        {announcements.map((announcement, index) => (
                            <div key={announcement.id || index} className={`bg-[#1F2937]/50 p-4 rounded-md border ${editingAnnouncement?.title === announcement.title && editingAnnouncement?.content === announcement.content ? 'border-cyan-500' : 'border-gray-700'} relative group transition-all duration-200`}>
                                <div className="flex justify-between items-start mb-2 pr-16">
                                    <h4 className="font-bold text-cyan-300">{announcement.title}</h4>
                                    <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                        {formatDate(announcement.created_at)}
                                    </span>
                                </div>
                                <p className="text-gray-300 text-sm whitespace-pre-wrap">{announcement.content}</p>
                                
                                <div className="absolute top-2 right-2 flex gap-2 z-10">
                                    <button 
                                        type="button"
                                        onClick={() => startEdit(announcement)}
                                        className="p-2 bg-cyan-900 text-cyan-400 rounded-full hover:bg-cyan-800 hover:text-white transition-colors border border-cyan-700/50 shadow-sm"
                                        title="Edit Announcement"
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => handleDelete(e, announcement)}
                                        className="p-2 bg-red-900 text-red-400 rounded-full hover:bg-red-800 hover:text-white transition-colors border border-red-700/50 shadow-sm"
                                        title="Delete Announcement"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </AnimatedWrapper>
  );
};

export default AnnouncementManager;
