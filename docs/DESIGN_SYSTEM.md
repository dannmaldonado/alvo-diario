# 🎯 ALVO DIÁRIO - Design System

## Identidade Visual Oficial

### Logo
**ALVO DIÁRIO** - Disciplina Tática para sua Aprovação

- **Versão Vertical**: `public/assets/logos/logo-vertical.png`
- **Versão Horizontal**: `public/assets/logos/logo-horizontal.png` (em breve)
- **Componentes**: Círculo alvo + seta chevron + texto

---

## 🎨 Paleta de Cores Oficial

### Primary Colors (Azuis)

| Nome | Hex | RGB | HSL | Uso |
|------|-----|-----|-----|-----|
| **Azul 1** | `#1675F2` | 22, 117, 242 | 219 88% 52% | Brand primária, CTAs, Active states |
| **Azul 2** | `#3084F2` | 48, 132, 242 | 220 97% 57% | Info, Charts, Supporting elements |

### Secondary Colors

| Nome | Hex | RGB | HSL | Uso |
|------|-----|-----|-----|-----|
| **Cinza Secundária** | `#566873` | 86, 104, 115 | 210 14% 39% | Text, Borders, Disabled states |
| **Neutral Light** | `#F1F2F0` | 241, 242, 240 | 60 14% 95% | Backgrounds, Cards, Sidebars |
| **Amarelo Destaque** | `#F2E96D` | 242, 233, 109 | 54 92% 69% | Warnings, Accent, Progress |

---

## 📐 Design Tokens

### Tipografia
- **Font Family**: DM Sans (Google Fonts)
- **Font Weights**: 100-1000 (Variable)
- **Line Height**: 1.5 (default)

### Espaçamento
- **Base Unit**: 4px
- **Scale**: 0, 2, 4, 6, 8, 12, 16, 20, 24, 32... (Fibonacci-like)

### Border Radius
- **Componentes**: 12px (0.75rem)
- **Small Elements**: 8px
- **Buttons**: 8px
- **Full**: 9999px (pills)

### Shadows
- **Small**: Subtle depth
- **Medium**: Card shadows
- **Large**: Modal/overlay shadows

---

## 🎯 Color Usage Guide

### Primary Blue (#1675F2)
✅ **Use for:**
- Primary action buttons
- Active navigation links
- Focus states
- Primary brand accent
- Success states (study progress)

### Secondary Blue (#3084F2)
✅ **Use for:**
- Information alerts
- Charts and graphs
- Secondary actions
- Hover states
- Links in body text

### Amarelo (#F2E96D)
✅ **Use for:**
- Warning alerts
- Achievement badges
- Progress highlights
- Call-to-action accents
- Completion indicators

### Cinza Secundária (#566873)
✅ **Use for:**
- Primary text
- Borders and dividers
- Icons
- Disabled states
- Muted/secondary text

### Neutral Light (#F1F2F0)
✅ **Use for:**
- Page backgrounds
- Card backgrounds
- Sidebar backgrounds
- Input field backgrounds
- Light UI surfaces

---

## 🧩 Component Colors

### Buttons
```
Primary: bg-primary (#1675F2)
Secondary: bg-secondary (#3084F2)
Accent: bg-yellow (#F2E96D)
Ghost: bg-transparent, text-primary
Outline: border-primary, text-primary
```

### Cards & Containers
```
Background: bg-white or bg-neutral (#F1F2F0)
Border: border-gray-300 or border-secondary
Shadow: Small to medium depth
```

### Navigation
```
Active Link: text-primary (#1675F2)
Inactive Link: text-gray-500
Hover: text-primary with opacity
```

### Forms
```
Label: text-gray (#566873)
Input Border: border-gray-300
Focus Ring: ring-primary (#1675F2)
Error: ring-red-500
```

### Badges & Labels
```
Success: bg-primary/10, text-primary
Warning: bg-yellow/10, text-yellow/90
Error: bg-red/10, text-red
Info: bg-secondary/10, text-secondary
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1023px
- **Desktop**: 1024px+

### Mobile-First Approach
- Design for mobile first
- Use `md:` prefix for tablet and up
- Use `lg:` prefix for desktop

---

## ♿ Accessibility

### Color Contrast
- Primary text on white: ✅ WCAG AA (22:1)
- Secondary text on white: ✅ WCAG AA (4.5:1)
- Buttons/CTAs: ✅ WCAG AAA

### Dark Mode
Dark mode colors are automatically adjusted via CSS variables in `index.css`.

### Focus States
- All interactive elements must have visible focus rings
- Use `focus-visible:ring-1 focus-visible:ring-primary`

---

## 🔧 Implementation

### CSS Variables (index.css)
```css
:root {
  --primary: 219 88% 52%;      /* #1675F2 */
  --secondary: 54 92% 69%;      /* #F2E96D */
  --accent: 54 92% 69%;         /* Yellow accent */
  ...
}
```

### TailwindCSS Usage
```jsx
// Primary button with brand color
<button className="bg-primary text-primary-foreground">
  Action
</button>

// Yellow accent
<div className="bg-accent text-accent-foreground">
  Highlight
</div>
```

### Design Tokens (design-tokens.ts)
```typescript
import { designTokens } from '@/lib/design-tokens';

const primaryColor = designTokens.colors.primary[1];
const spacing = designTokens.spacing[4]; // 1rem
```

---

## 📚 References

- **Logo Files**: `public/assets/logos/`
- **Design Tokens**: `src/lib/design-tokens.ts`
- **CSS Variables**: `src/index.css`
- **TailwindCSS Config**: `tailwind.config.js`

---

**Last Updated**: 2026-03-27
**Version**: 1.0
**Brand**: ALVO DIÁRIO
