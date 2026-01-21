export const formatTelegramDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    // Clear time part for comparison
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // For List Item Time (already implemented logic mostly)
    // But this function is seemingly used for two things now.
    // Let's create a separate helper "formatDateHeader" in the same file to avoid conflicts if needed, or expand.
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};

// New helper for Chat Window Sticky Headers
export const formatChatDateHeader = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const n = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = n - d;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";

    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isThisYear) {
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }); // "January 24"
    } else {
        return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }); // "01/24/23"
    }
};

// Re-implementing the list date logic properly (since I overwrote it briefly above in thought)
export const formatListDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const isThisYear = date.getFullYear() === now.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else if (isThisYear) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Jan 24"
    } else {
        return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }); // "01/24/23"
    }
};
