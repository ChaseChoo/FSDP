# OCBC ATM Design System - Implementation Guide

## Design Specifications

### Color Palette
```
Primary Red:        #ea2a33
Background Light:   #f8f6f6
Background Dark:    #211111

Tailwind Slate:
- 50:   #f8fafc
- 100:  #f1f5f9
- 200:  #e2e8f0
- 300:  #cbd5e1
- 400:  #94a3b8
- 500:  #64748b
- 600:  #475569
- 700:  #334155
- 800:  #1e293b
- 900:  #0f172a
- 950:  #020817
```

### Typography
**Font**: Public Sans (Google Fonts)
```html
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
```

**Font Weights**:
- 300: Light (small captions)
- 400: Regular (body text)
- 500: Medium (labels)
- 600: Semibold (card titles)
- 700: Bold (headings)

**Font Sizes**:
- Heading 1: 48px, bold
- Heading 2: 44px, bold
- Heading 3: 28px, bold
- Title: 20px, semibold
- Body: 16px, regular
- Small: 14px, regular
- Caption: 12px, regular

### Icons
**Library**: Material Symbols Outlined
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

**Icon Usage**:
- Card slots: `credit_card`
- QR codes: `qr_code_scanner`
- Face recognition: `sentiment_satisfied`, `face_recognition`
- Wallets: `wallet`, `account_balance_wallet`
- Transfers: `send`, `arrow_forward`
- Mobile: `smartphone`, `mobile_friendly`
- Clock: `schedule`, `clock`
- Help: `help`, `help_outline`
- Success: `check_circle`
- Error: `error`, `warning`
- Back: `arrow_back`
- Home: `home`
- Person: `person_add`, `account_circle`
- Settings: `settings`, `language`, `volume_up`
- Info: `info`, `security`, `verified_user`

### Border Radius
```
Small:  0.25rem (4px)
Lg:     0.5rem  (8px)
Xl:     0.75rem (12px)
2Xl:    1rem    (16px)
3Xl:    1.5rem  (24px)
Full:   9999px
```

### Spacing Scale
```
0:    0px
0.5:  2px
1:    4px
1.5:  6px
2:    8px
2.5:  10px
3:    12px
4:    16px
5:    20px
6:    24px
8:    32px
10:   40px
12:   48px
```

### Box Shadows
```
Light Shadow:   0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
Medium Shadow:  0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
Large Shadow:   0 25px 50px -12px rgba(0, 0, 0, 0.25)
Primary Glow:   0 10px 30px rgba(234, 42, 51, 0.3)
```

## Layout Components

### Header
```html
<header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-10 py-4 z-10">
```
- Height: 64px (py-4 = 16px * 2)
- Background: White (light) / slate-950 (dark)
- Border: 1px bottom
- Logo + Company Name on left
- Language + Exit buttons on right

### Main Content Container
```html
<main class="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">
<div class="max-w-[1000px] w-full">
```
- Centered content
- Max width constraint (varies by page: 600px for single cards, 900px for grids, 1000px+ for dashboard)
- Responsive padding (px-4 mobile, px-8+ desktop)

### Card Layout
```html
<div class="bg-white dark:bg-slate-900 rounded-3xl p-12 shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800">
```
- Background: White (light) / slate-900 (dark)
- Padding: 48px
- Border radius: 24px
- Border: 1px
- Shadow: Large (light only)

### Button Styles

**Primary Button** (Call to action):
```html
<button class="px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
```

**Secondary Button** (Outline):
```html
<button class="px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-lg hover:border-primary transition-colors">
```

**Small Icon Button**:
```html
<button class="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary hover:text-white transition-colors">
```

### Grid Layouts

**Main Menu Grid** (3 columns on desktop):
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
```

**Non-Cash Services Grid** (2-3 columns):
```html
<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
```

**Quick Tiles Grid** (4 columns on desktop):
```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
```

### Form Inputs
```html
<input type="text" class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white" />
```
- Padding: 12px
- Border: 1px
- Rounded: 8px

### Status Messages

**Loading**:
```html
<div class="px-4 py-3 rounded-lg border flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
<div class="loading-spinner"></div>
<span class="text-blue-900 dark:text-blue-200 text-sm font-medium">Loading...</span>
</div>
```

**Success**:
```html
<div class="px-4 py-3 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
<span class="text-green-900 dark:text-green-200">✓ Success!</span>
</div>
```

**Error**:
```html
<div class="px-4 py-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
<span class="text-red-900 dark:text-red-200">✗ Error</span>
</div>
```

**Warning**:
```html
<div class="px-4 py-3 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
<span class="text-amber-900 dark:text-amber-200">⚠ Warning</span>
</div>
```

## Animation Patterns

### Hover Effects
```css
.hover-tts {
    transition: all 0.18s ease;
}

.group:hover {
    transform: translateY(-2px);
    box-shadow: enhanced;
}
```

### Transitions
```css
transition-colors      /* For color changes */
transition-all         /* For all properties */
duration-200          /* 200ms duration */
ease-in-out           /* Smooth animation */
```

### Loading Spinner
```css
@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-spinner {
    animation: spin 1s linear infinite;
}
```

## Responsive Breakpoints (Tailwind)

```
sm:   640px  (mostly not used)
md:   768px  (primary mobile/tablet break)
lg:   1024px (tablet/desktop)
xl:   1280px (desktop)
2xl:  1536px (large desktop)
```

## Dark Mode

**Enabled globally**:
```html
<html class="light" lang="en">
```

**Dark classes used**:
- `dark:bg-slate-900` (card background)
- `dark:bg-slate-950` (page background)
- `dark:border-slate-800` (borders)
- `dark:text-white` (text)
- `dark:bg-blue-900/20` (status backgrounds)

**CSS** (not needed, handled by Tailwind):
```css
@media (prefers-color-scheme: dark) {
    /* Dark mode styles */
}
```

## Accessibility

- ✓ Semantic HTML (header, main, footer)
- ✓ ARIA labels where needed
- ✓ Color contrast ratios met (WCAG AA)
- ✓ Keyboard navigation supported
- ✓ Focus states visible
- ✓ Screen reader friendly

## Page Template Structure

```html
<!DOCTYPE html>
<html class="light" lang="en">
<head>
    <!-- Tailwind + Fonts + Icons -->
</head>
<body class="bg-background-light dark:bg-background-dark">
    <div class="layout-container">
        <header><!-- Navigation --></header>
        <main class="flex-1 flex flex-col items-center justify-center">
            <div class="max-w-[XXXpx] w-full">
                <!-- Page content -->
            </div>
        </main>
        <footer><!-- Info --></footer>
    </div>
</body>
</html>
```

## Configuration

### Tailwind Config
```javascript
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#ea2a33",
                "background-light": "#f8f6f6",
                "background-dark": "#211111",
            },
            fontFamily: {
                "display": ["Public Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
        },
    },
}
```

## Future Enhancements

- Add CSS variables for easier theme switching
- Create reusable component library
- Implement proper animation sequences
- Add loading skeleton screens
- Optimize image assets
- Add PWA support
