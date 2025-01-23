// app/page.tsx
'use client';
import { useState } from 'react';
import Summarizer from '@/components/Summarizer';
import QuestionAnswering from '@/components/QuestionAnswering';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'summarizer' | 'qa'>('summarizer');
  const [isNavOpen, setIsNavOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#0E1117] text-white">
      {/* Toggle Button */}
      <button
        onClick={() => setIsNavOpen(!isNavOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-[#1A1D23] hover:bg-gray-600"
      >
        {isNavOpen ? '←' : '→'}
      </button>

      {/* Sidebar with animation */}
      <nav className={`bg-[#1A1D23] w-64 min-h-screen p-4 fixed transition-transform duration-300 ease-in-out ${
        isNavOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="pt-12">
          <h2 className="text-lg font-semibold mb-6">Navigation</h2>
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => setActiveTab('summarizer')}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'summarizer' ? 'bg-gray-600 text-white' : 'hover:bg-gray-600'
                }`}
              >
                Summarizer
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('qa')}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeTab === 'qa' ? 'bg-gray-600 text-white' : 'hover:bg-gray-600'
                }`}
              >
                Question Answering
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main Content - adjust margin based on navbar state */}
      <main className={`flex-1 p-6 transition-all duration-300 ${
        isNavOpen ? 'ml-64' : 'ml-0'
      }`}>
        <header className="mb-8 text-center pt-8">
          <h1 className="text-4xl font-bold">Unified Text Processing Tool</h1>
          <h2 className="text-2xl font-semibold mt-2">
            {activeTab === 'summarizer' ? 'Summarizer' : 'Question Answering'}
          </h2>
        </header>

        <div className="bg-[#1A1D23] p-4 rounded shadow mx-auto max-w-[calc(100%-400px)]">
          {activeTab === 'summarizer' && <Summarizer />}
          {activeTab === 'qa' && <QuestionAnswering />}
        </div>
      </main>
    </div>
  );
}
