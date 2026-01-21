import React from 'react';

export default function CaseSelector({ cases, onSelectCase }) {
    return (
        <div className="w-1/4 bg-white border-l p-4 h-full flex flex-col">
            <h2 className="font-bold mb-4 text-gray-800">Start New Ticket</h2>
            <p className="text-sm text-gray-500 mb-4">Select a topic to start a new support conversation.</p>

            <div className="space-y-2 overflow-y-auto flex-1">
                <select
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                    onChange={(e) => {
                        if (e.target.value) onSelectCase(e.target.value);
                    }}
                    defaultValue=""
                >
                    <option value="" disabled>-- Select Topic --</option>
                    {cases.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name} ({c.department})
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
