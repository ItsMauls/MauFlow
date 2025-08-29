'use client';

import React, { useState } from 'react';
import { 
  GlassContainer, 
  GlassCard, 
  GlassButton, 
  ResponsiveGrid, 
  StickyBottomBar 
} from './ui';

export const GlassmorphismDemo: React.FC = () => {
  const [showBottomBar, setShowBottomBar] = useState(true);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const demoCards = [
    {
      id: '1',
      title: 'High Priority Task',
      description: 'This is a high priority task with red accent colors',
      priority: 'high' as const,
    },
    {
      id: '2',
      title: 'Medium Priority Task',
      description: 'This is a medium priority task with yellow accent colors',
      priority: 'medium' as const,
    },
    {
      id: '3',
      title: 'Low Priority Task',
      description: 'This is a low priority task with green accent colors',
      priority: 'low' as const,
    },
    {
      id: '4',
      title: 'Interactive Card',
      description: 'Click me to see the selection effect!',
      priority: undefined,
    },
    {
      id: '5',
      title: 'Another Card',
      description: 'Demonstrating the responsive grid layout',
      priority: 'medium' as const,
    },
    {
      id: '6',
      title: 'Final Card',
      description: 'Shows how cards adapt to different screen sizes',
      priority: 'low' as const,
    },
  ];

  return (
    <GlassContainer background="mesh">
      <div className="p-4 md:p-6 lg:p-8 pb-24">
        {/* Header */}
        <div className="max-w-screen-xl mx-auto mb-8">
          <GlassCard className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Glassmorphism UI Components
            </h1>
            <p className="text-white/80 mb-6">
              Semi-transparent cards with blur effects, responsive design, and mobile-friendly interactions
            </p>
            
            {/* Button showcase */}
            <div className="flex flex-wrap gap-3 justify-center">
              <GlassButton variant="primary">Primary</GlassButton>
              <GlassButton variant="secondary">Secondary</GlassButton>
              <GlassButton variant="success">Success</GlassButton>
              <GlassButton variant="danger">Danger</GlassButton>
            </div>
          </GlassCard>
        </div>

        {/* Features showcase */}
        <div className="max-w-screen-xl mx-auto mb-8">
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md">
            <GlassCard className="text-center">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold text-white mb-2">Mobile First</h3>
              <p className="text-white/80 text-sm">
                Touch-friendly buttons with 44px minimum tap areas
              </p>
            </GlassCard>
            
            <GlassCard className="text-center">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-semibold text-white mb-2">Priority Colors</h3>
              <p className="text-white/80 text-sm">
                Red for high, yellow for medium, green for low priority
              </p>
            </GlassCard>
            
            <GlassCard className="text-center">
              <div className="text-2xl mb-2">📐</div>
              <h3 className="font-semibold text-white mb-2">Responsive Grid</h3>
              <p className="text-white/80 text-sm">
                1 column on mobile, 2-3 on tablet, 3-4 on desktop
              </p>
            </GlassCard>
            
            <GlassCard className="text-center">
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-semibold text-white mb-2">Glassmorphism</h3>
              <p className="text-white/80 text-sm">
                Frosted glass effect with subtle gradients
              </p>
            </GlassCard>
          </ResponsiveGrid>
        </div>

        {/* Interactive cards */}
        <div className="max-w-screen-xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Interactive Demo Cards
          </h2>
          
          <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="lg">
            {demoCards.map((card) => (
              <GlassCard
                key={card.id}
                priority={card.priority}
                onClick={() => setSelectedCard(
                  selectedCard === card.id ? null : card.id
                )}
                className={`transition-all duration-300 ${
                  selectedCard === card.id 
                    ? 'ring-2 ring-white/50 scale-105' 
                    : 'hover:scale-102'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white">
                    {card.title}
                  </h3>
                  {card.priority && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      card.priority === 'high' ? 'bg-red-500/20 text-red-200' :
                      card.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-200' :
                      'bg-green-500/20 text-green-200'
                    }`}>
                      {card.priority}
                    </div>
                  )}
                </div>
                
                <p className="text-white/80 text-sm mb-4">
                  {card.description}
                </p>
                
                <div className="flex gap-2">
                  <GlassButton size="sm" variant="primary">
                    Action
                  </GlassButton>
                  <GlassButton size="sm" variant="secondary">
                    More
                  </GlassButton>
                </div>
                
                {selectedCard === card.id && (
                  <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white/70 text-sm">
                      ✨ This card is selected! The glassmorphism effect creates beautiful depth.
                    </p>
                  </div>
                )}
              </GlassCard>
            ))}
          </ResponsiveGrid>
        </div>
      </div>

      {/* Sticky Bottom Bar Demo */}
      <StickyBottomBar show={showBottomBar}>
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Try typing here..."
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 
                     text-white placeholder-white/60 backdrop-blur-md
                     focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40
                     min-h-[44px]"
          />
        </div>
        <GlassButton>
          Submit
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => setShowBottomBar(!showBottomBar)}
        >
          {showBottomBar ? 'Hide' : 'Show'}
        </GlassButton>
      </StickyBottomBar>
    </GlassContainer>
  );
};