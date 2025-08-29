# Glassmorphism UI Components

A collection of reusable React components with glassmorphism styling, built for modern web applications with mobile-first design principles.

## Components

### Core Components

#### `GlassCard`
Semi-transparent card with frosted glass effect and priority-based color coding.

```tsx
import { GlassCard } from '@/components/ui';

<GlassCard priority="high" onClick={() => console.log('clicked')}>
  <h3>High Priority Task</h3>
  <p>This card has a red accent for high priority items</p>
</GlassCard>
```

**Props:**
- `priority`: 'high' | 'medium' | 'low' - Adds colored accents
- `blur`: 'sm' | 'md' | 'lg' - Controls backdrop blur intensity
- `onClick`: () => void - Makes card interactive
- `className`: string - Additional CSS classes

#### `GlassButton`
Interactive button with glassmorphism styling and multiple variants.

```tsx
import { GlassButton } from '@/components/ui';

<GlassButton variant="primary" size="md" loading={isLoading}>
  Submit
</GlassButton>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success'
- `size`: 'sm' | 'md' | 'lg' - Controls button size (all sizes are touch-friendly)
- `loading`: boolean - Shows loading spinner
- `disabled`: boolean - Disables interaction

#### `GlassContainer`
Full-screen container with animated background elements.

```tsx
import { GlassContainer } from '@/components/ui';

<GlassContainer background="gradient">
  {/* Your app content */}
</GlassContainer>
```

**Props:**
- `background`: 'gradient' | 'solid' | 'mesh' - Background style

### Layout Components

#### `ResponsiveGrid`
Responsive grid that adapts to different screen sizes.

```tsx
import { ResponsiveGrid } from '@/components/ui';

<ResponsiveGrid 
  columns={{ mobile: 1, tablet: 2, desktop: 3 }}
  gap="md"
>
  {items.map(item => <GlassCard key={item.id}>{item.content}</GlassCard>)}
</ResponsiveGrid>
```

**Props:**
- `columns`: Object defining columns for each breakpoint
- `gap`: 'sm' | 'md' | 'lg' - Grid gap size

#### `StickyBottomBar`
Sticky bottom navigation/action bar with glassmorphism styling.

```tsx
import { StickyBottomBar } from '@/components/ui';

<StickyBottomBar show={isVisible}>
  <input type="text" placeholder="Quick action..." />
  <GlassButton>Submit</GlassButton>
</StickyBottomBar>
```

## API Integration

### TanStack Query Setup

The components work seamlessly with TanStack Query for API calls:

```tsx
import { useApiQuery, useApiMutation } from '@/hooks/useApi';

function TaskList() {
  const { data: tasks, isLoading } = useApiQuery(['tasks'], '/api/tasks');
  const createTask = useApiMutation('/api/tasks', 'POST');

  return (
    <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
      {tasks?.map(task => (
        <GlassCard key={task.id} priority={task.priority}>
          <h3>{task.title}</h3>
          <GlassButton onClick={() => createTask.mutate(task)}>
            Update
          </GlassButton>
        </GlassCard>
      ))}
    </ResponsiveGrid>
  );
}
```

## Design Principles

### Mobile-First
- All interactive elements have minimum 44px touch targets
- Responsive grid adapts from 1 column (mobile) to 2-3 columns (desktop)
- Touch-friendly spacing and sizing

### Priority Color System
- **Red**: High priority items
- **Yellow**: Medium priority items  
- **Green**: Low priority items
- **White/Gray**: Default/neutral items

### Glassmorphism Effects
- Semi-transparent backgrounds with backdrop blur
- Subtle gradients and shadows
- Frosted glass appearance
- Smooth hover and interaction animations

## Usage Examples

### Basic Task Card
```tsx
<GlassCard priority="high">
  <h3>Important Task</h3>
  <p>This needs immediate attention</p>
  <GlassButton variant="danger">Complete</GlassButton>
</GlassCard>
```

### Interactive Dashboard
```tsx
<GlassContainer>
  <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
    {items.map(item => (
      <GlassCard 
        key={item.id}
        priority={item.priority}
        onClick={() => selectItem(item.id)}
      >
        {item.content}
      </GlassCard>
    ))}
  </ResponsiveGrid>
  
  <StickyBottomBar>
    <GlassButton onClick={addNewItem}>Add Item</GlassButton>
  </StickyBottomBar>
</GlassContainer>
```

## Customization

All components accept `className` props for additional styling and use the `cn()` utility function for proper class merging with Tailwind CSS.

```tsx
<GlassCard className="custom-shadow hover:scale-110">
  Custom styled card
</GlassCard>
```