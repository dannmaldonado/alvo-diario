# PHASE-3-STORY-304: UX/UI Refactoring — Information Density, Responsivity & Visual Hierarchy

**Epic:** Phase 3 — UX/UI Modernization  
**Project:** alvo-diario  
**Status:** Planning / Handed off to @ux-design-expert Uma  
**Created:** 2026-05-08  
**Effort:** 8-12 hours  
**Assigned Agent:** @ux-design-expert Uma (UX/UI Design)  

---

## Context

The platform has grown with multiple features (cronogramas, sessions, analytics, daily ratings, materials) but the UI feels "carregada" (overloaded) with too much information. User feedback:

- Dashboard and analysis pages have information density issues
- Mobile/tablet responsivity needs improvement
- Visual hierarchy and spacing inconsistent across components
- New features (AI questions, daily missions) need thoughtful UX integration

**Goal:** Modernize the UI to feel "premium", clean, responsive, and feature-ready for Phase 3+ features.

---

## Scope

✅ **Confirmed by User:**
- [ ] Information density (remove clutter, consolidate cards)
- [ ] Responsive design (mobile 360px, tablet 768px, desktop 1024px+)
- [ ] Visual hierarchy & spacing (typography, colors, component spacing)
- [ ] New feature UX prep (AI questions, daily missions visibility)

❌ **Out of Scope:**
- Complete redesign from scratch
- Technology change (stays React + Shadcn/ui + Tailwind)
- Logo/branding changes

---

## Technical Constraints

**Stack:** React 18 + Shadcn/ui + Tailwind CSS (NO changes)  
**No Breaking Changes:** Existing features must continue working  
**Compatibility:** Must work with AI Question System (Phase 3 features coming later)  

---

## Pages to Audit & Refactor

| Page | Current Issues | Priority | Effort |
|------|---|----------|--------|
| DashboardPage.tsx | Too many cards, info overload | HIGH | 2-3h |
| ProgressAnalysisPage.tsx | Chart density, legend crowding | HIGH | 2-3h |
| StudySessionPage.tsx | Layout during session, button placement | MEDIUM | 1-2h |
| CronogramaPage.tsx | List + detail view spacing | MEDIUM | 1h |
| MateriaisPage.tsx | Card layout, list styling | LOW | 1h |
| LoginPage / SignupPage | Consistency, form spacing | LOW | 0.5h |
| ProfilePage.tsx | Card layout, readability | MEDIUM | 1h |

**Total:** 8-10 hours design audit + recommendations

---

## Deliverables from @ux-design-expert Uma

### 1. Audit Report (1-2h)
- [ ] Accessibility review (contrast, focus states, semantic HTML)
- [ ] Component hierarchy assessment
- [ ] Responsive breakpoint analysis (360, 768, 1024, 1440px)
- [ ] Information density heatmap (which pages have overload?)
- [ ] Color/typography consistency check

### 2. Design System Updates (2-3h)
- [ ] Updated spacing scale (padding/margin guidelines)
- [ ] Typography hierarchy refinement (font sizes, weights)
- [ ] Color palette documentation (ensure contrast ratios)
- [ ] Component breakpoint rules (how Shadcn components respond)
- [ ] Visual rhythm guide (card spacing, gaps)

### 3. Page-by-Page Recommendations (2-3h)
**DashboardPage:**
- [ ] Consolidate widgets (e.g., merge stats into single card)
- [ ] Reduce card count by grouping related data
- [ ] Mobile layout: stack vertically below 768px
- [ ] Suggested mockup/Figma link

**ProgressAnalysisPage:**
- [ ] Redesign charts to fit smaller screens
- [ ] Legend positioning for readability
- [ ] Toggle chart type or filter on mobile
- [ ] Suggested mockup/Figma link

**StudySessionPage:**
- [ ] Large touch targets for study controls (buttons)
- [ ] Minimize distractions during session
- [ ] Full-screen option for focus mode
- [ ] Suggested mockup/Figma link

### 4. Responsive Design Spec (1h)
- [ ] Mobile breakpoints: 360px, 480px, 640px
- [ ] Tablet breakpoints: 768px, 1024px
- [ ] Desktop: 1280px, 1440px, 1920px
- [ ] Guidance on Tailwind breakpoints to use
- [ ] Navigation strategy (sidebar collapse, mobile menu)

### 5. Component Library Update (1h)
- [ ] Button spacing and sizes for mobile
- [ ] Card padding consistency
- [ ] Form input heights and label placement
- [ ] Modal dialog responsivity
- [ ] Custom component guidelines

---

## Implementation Path (@dev follows)

Once Uma delivers recommendations:

### Phase 1: Utility Class Audit (1h)
- Review all `className` attrs for hardcoded sizes
- Identify Tailwind overrides needed

### Phase 2: Dashboard Refactor (2h)
- Apply Uma's consolidation recommendations
- Add responsive classes
- Test on mobile/tablet

### Phase 3: Analysis Page (1.5h)
- Implement chart responsivity
- Test legend layout on small screens

### Phase 4: Other Pages (2-3h)
- Apply recommendations systematically
- Ensure consistency

### Phase 5: Test & Polish (1h)
- Responsive testing on real devices
- Accessibility audit
- Cross-browser testing

---

## Acceptance Criteria

✅ **Dashboard:**
- [ ] No info overload on 1024px+ screens
- [ ] Mobile layout stacks logically below 768px
- [ ] Cards have consistent padding and spacing
- [ ] No horizontal scroll on any breakpoint

✅ **Charts/Analytics:**
- [ ] Charts render correctly on tablet (768px)
- [ ] Legend doesn't obscure data
- [ ] Touch-friendly on mobile

✅ **Responsivity:**
- [ ] All pages work on: 360px, 768px, 1024px, 1440px
- [ ] No broken layouts
- [ ] Forms are usable on mobile
- [ ] Navigation works on all sizes

✅ **Visual Hierarchy:**
- [ ] Clear primary/secondary actions
- [ ] Typography scale is consistent
- [ ] Whitespace supports readability
- [ ] Color contrast meets WCAG AA

✅ **Feature Prep:**
- [ ] AI question card mockup designed
- [ ] Daily mission card mockup designed
- [ ] Space allocated in dashboard for new features

---

## Success Metrics

- User perception: Platform feels "premium" and clean
- No regression in existing features
- Pages load at <3s on 4G
- 95+ Lighthouse score on all pages
- Mobile usability: no pinch-zoom needed

---

## Notes for @ux-design-expert Uma

1. **Current Stack:** React 18, Shadcn/ui (Radix primitives), Tailwind CSS — no framework changes
2. **Key Pages:** Dashboard is the most complex; focus there first
3. **Mobile-First Approach:** Design for 360px first, scale up to desktop
4. **New Features Coming:** AI questions (Phase 3) and daily missions need space on dashboard
5. **Timeline:** User wants this done before implementing Phase 3 features
6. **Constraint:** Zero breaking changes — existing routes, state management, API contracts stay the same

---

## Handoff Protocol

**From:** @dev (current session)  
**To:** @ux-design-expert Uma  
**Context:** UX/UI modernization + responsivity + prep for Phase 3 AI features  
**Deliverable:** Design audit + recommendations + component guidelines  
**Return:** Uma delivers Figma mockups + CSS/Tailwind guidance for @dev to implement

---

## Related Stories

- **PHASE-3-STORY-301:** Daily Rating (uses improved UX/UI foundation)
- **PHASE-3-STORY-302:** Rating-based Streak (analytics page refactoring)
- **PHASE-3-STORY-303:** Rating-based Points (dashboard widget updates)
- **Track C (Roadmap):** AI Question System Phase 1 (needs new UI components)

---

*Created for handoff to @ux-design-expert Uma — 2026-05-08*
