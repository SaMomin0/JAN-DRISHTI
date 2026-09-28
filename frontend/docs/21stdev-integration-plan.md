# 21st.dev Component Integration Plan & Design System Architecture

This plan outlines the integration mapping of 21st.dev components across all routes in the **JAN-DRISHTI MPLADS Monitoring Platform** (`frontend/`).

---

## 🎨 Design System Specifications

| Element | Specification |
|---------|---------------|
| **Theme Base** | Dark Slate Mode (`#0b0f19` background, `#111827` surface cards, `#1f2937` borders) |
| **Primary Accents** | Electric Blue (`#3b82f6`), Indigo (`#6366f1`), Emerald Disbursal (`#10b981`), Amber Warning (`#f59e0b`), Red Critical (`#ef4444`) |
| **Typography** | System Sans Font (`Inter`, `-apple-system`, `BlinkMacSystemFont`), Monospace (`Fira Code`, `JetBrains Mono`) for IDs & amounts |
| **Visual Effects** | Glassmorphism (`backdrop-blur-md bg-gray-900/80`), Mouse Spotlight Glow, Animated SVG Background Paths |
| **Tone & Style** | Reliable, trustworthy, government-grade intelligence platform. Strictly non-accusatory language. |

---

## 🗺️ Page-by-Page Integration Mapping

### 1. App Shell (`frontend/src/components/layout/`)
- **Components Integrated**: `Navbar` (Top Executive Header), `Sidebar` (Collapsible Navigation), `CommandPalette` (`Cmd+K` global search), `Toast` notifications, `DataFreshness` timestamp.
- **Backend API Integration**: `/health` status endpoint.

### 2. Welcome & Executive Dashboard (`frontend/src/app/page.tsx`)
- **Components Integrated**: `SpotlightCard`, `GlassCard`, `KPIStatCard`, `BentoGrid`, `DonutRiskChart`, `RadialProgressGauge`, `BarChart`, `TopMPTable`, `TopVendorTable`, `CriticalAlertBanner`.
- **Backend API Integration**: `/api/v1/statistics`, `/api/v1/risk/distribution`, `/api/v1/risk/factors`, `/api/v1/risk-cases`.

### 3. Work Records Directory (`frontend/src/app/projects/page.tsx`)
- **Components Integrated**: `SearchInput`, `AdvancedFilterPanel`, `ComboboxAutocomplete`, `StateFilterDropdown`, `DataGridTable`, `ExpandableTableRow`, `PaginationBar`, `EmptyTableState`.
- **Backend API Integration**: `/api/v1/projects` (Paginated search & filters).

### 4. Project Investigation Room (`frontend/src/app/projects/[id]/page.tsx`)
- **Components Integrated**: `ProjectHeaderCard`, `RiskScoreGaugeCard`, `FinancialProgressCard`, `ExplainableFactorBreakdown`, `AISignalCard`, `EvidenceComparisonCard`, `StripedLedgerTable`, `VerticalTimelineStepper`, `PeerComparablesList`, `PrintAuditBriefButton`.
- **Backend API Integration**: `/api/v1/projects/{work_id}`, `/risk`, `/anomalies`, `/evidence`, `/comparables`, `/history`.

### 5. Risk Cases & Anomaly Workspace (`frontend/src/app/risk/page.tsx`)
- **Components Integrated**: `SeverityBadge`, `PriorityCard`, `SelectableBatchTable`, `ModalDialogBlur`, `AuditActivityLogFeed`, `ReviewChecklist`, `VerificationStatusTag`.
- **Backend API Integration**: `/api/v1/risk-cases`, `/api/v1/risk-cases/{case_id}/status`.

### 6. Pipeline Execution Room (`frontend/src/app/analysis/page.tsx`)
- **Components Integrated**: `ShimmerActionButton`, `WorkflowProgressTracker`, `RunHistoryLogTable`, `DatasetHashBadge`, `ConfirmationAlertDialog`.
- **Backend API Integration**: `/api/v1/analysis-runs` (`GET` & `POST`).

### 7. Geographic Map Room (`frontend/src/app/map/page.tsx`)
- **Components Integrated**: `StateRiskHeatmapLegend`, `LocationMarkerPopupCard`, `GeographicStateFilterGrid`, `RegionalSummaryCard`, `MapControlOverlay`.
- **Backend API Integration**: `/api/v1/statistics`, `/api/v1/projects`.

### 8. AI Intelligence Assistant (`frontend/src/app/ai/page.tsx`)
- **Components Integrated**: `AIAssistantChat`, `ChatMessageBubble`, `AISourceCitationCard`, `PromptInputBox`, `StreamingResponseIndicator`, `NaturalLanguageSQLCard`.
- **Backend API Integration**: Live natural language search across SQLite database (`/api/v1/projects`, `/statistics`).

### 9. Audit Reports Generator (`frontend/src/app/reports/page.tsx`)
- **Components Integrated**: `ReportTemplateWizard`, `PrintableReportPreviewModal`, `ResponsibleAIBanner`, `SplitActionDropdownButton`.
- **Backend API Integration**: `/api/v1/statistics`, `/api/v1/risk-cases`.

### 10. Real-time Notifications Drawer (`frontend/src/components/layout/NotificationDrawer.tsx`)
- **Components Integrated**: `NotificationCenterDrawer`, `AISignalNotificationItem`, `UnreadBadgeCounter`.
- **Backend API Integration**: `/api/v1/ai-signals`.

### 11. System Settings & Diagnostics (`frontend/src/app/settings/page.tsx`)
- **Components Integrated**: `SystemInformationWidget`, `HealthStatusGrid`, `ThresholdConfigForm`, `ThemePreferenceToggle`.
- **Backend API Integration**: `/health`, database metadata.

### 12. Help & Documentation (`frontend/src/app/help/page.tsx`)
- **Components Integrated**: `SearchableHelpAccordion`, `RiskGlossaryCard`, `OnboardingTourWalkthrough`, `RadialOrbitalTimeline`.
- **Backend API Integration**: Static system documentation & AI engine architecture specs.

---

## 🔄 Verification & Quality Plan
1. Every component will render cleanly in dark mode.
2. All data paths bind to real API endpoints and real database records.
3. Next.js production build (`npm run build`) must complete with 0 errors.
4. Backend pytest suite (`pytest backend`) must pass 33/33 tests.
