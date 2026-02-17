# Logo Loader - Usage Examples

## ✨ Premium Animated Logo Loader

A beautiful liquid-fill animated loader using your logo with wave effects and pulsing glow.

---

## 📦 Installation

The loader is already created in your project:
- Component: `src/components/LogoLoader.jsx`
- Styles: `src/components/LogoLoader.css`
- Demo: `src/pages/demo/LogoLoaderDemo.jsx`

---

## 🎯 Basic Usage

### Example 1: Simple Loading State

```jsx
import { useState } from 'react';
import LogoLoader from '@/components/LogoLoader';

function MyComponent() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <LogoLoader />}
      {/* Your content */}
    </>
  );
}
```

### Example 2: With Custom Size and Message

```jsx
<LogoLoader 
  size="large" 
  message="Processing your request" 
/>
```

### Example 3: Data Fetching

```jsx
import { useState, useEffect } from 'react';
import LogoLoader from '@/components/LogoLoader';

function DataPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LogoLoader message="Loading data..." />;
  }

  return <div>{/* Your content */}</div>;
}
```

---

## 🎨 Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'small'` \| `'medium'` \| `'large'` | `'medium'` | Size of the loader |
| `message` | `string` | `'Loading...'` | Loading message text |

---

## 🌈 Theme Variants

Add a className wrapper for different themes:

```jsx
// Default (Purple gradient)
<LogoLoader />

// Light theme
<div className="light-theme">
  <LogoLoader />
</div>

// Dark theme
<div className="dark-theme">
  <LogoLoader />
</div>

// Brand theme
<div className="brand-theme">
  <LogoLoader />
</div>
```

---

## 📱 Size Examples

```jsx
// Small - 120px (mobile friendly)
<LogoLoader size="small" />

// Medium - 200px (default, balanced)
<LogoLoader size="medium" />

// Large - 280px (desktop, hero sections)
<LogoLoader size="large" />
```

---

## 🔄 Integration Examples

### In Edit/Register Forms

```jsx
// editHomeless.jsx
if (fetching) {
  return <LogoLoader message="Loading homeless user details..." />;
}
```

### In Dashboard Pages

```jsx
// Dashboard.jsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadDashboardData().finally(() => setLoading(false));
}, []);

if (loading) {
  return <LogoLoader size="large" message="Loading dashboard..." />;
}
```

### During Form Submission

```jsx
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  
  try {
    await submitForm(formData);
  } finally {
    setSubmitting(false);
  }
};

return (
  <>
    {submitting && <LogoLoader message="Saving changes..." />}
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  </>
);
```

---

## 🎭 Animation Features

- ✨ **Liquid Fill**: Logo fills from bottom to top
- 🌊 **Wave Effect**: Smooth wave animation at the fill line
- 💫 **Pulsing Glow**: Subtle glow effect around the logo
- 📱 **Responsive**: Adapts to all screen sizes
- 🎨 **Customizable**: Multiple themes and sizes

---

## 🧪 Test the Demo

Visit the demo page to see all variants:

```
/demo/logo-loader
```

Or run:
```bash
npm run dev
```

Then navigate to: `http://localhost:5173/demo/logo-loader`

---

## 🎨 Customization

### Change Background Gradient

Edit `LogoLoader.css`:

```css
.logo-loader-container {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Adjust Animation Speed

```css
/* Faster fill */
.logo-loader-fill {
  animation: fillUp 1.5s ease-in-out infinite;
}

/* Slower wave */
.wave-path {
  animation: waveMove 2.5s ease-in-out infinite;
}
```

### Change Logo Opacity

```css
.logo-loader-bg {
  filter: grayscale(100%) brightness(1.5) opacity(0.5); /* Increase opacity */
}
```

---

## 💡 Tips

1. **Use appropriate sizes**: 
   - Mobile: `small`
   - Desktop: `medium` or `large`

2. **Keep messages short**: 
   - Good: "Loading..."
   - Better: "Please wait"
   - Best: "Loading data..."

3. **Theme consistency**: 
   - Match loader theme with your app theme

4. **Performance**: 
   - Loader uses CSS animations (GPU accelerated)
   - No JavaScript animation loops

---

## 🚀 Ready to Use!

The loader is production-ready and can be used anywhere in your app. Just import and use it! 🎉
