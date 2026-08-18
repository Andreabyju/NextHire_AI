import React from 'react';
import { Outlet } from 'react-router-dom';
import MentorSidebar from '../../components/mentor/MentorSidebar';

export default function MentorLayout() {
  return (
    <div className="flex min-h-screen bg-[#050816] text-white">
      <MentorSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
