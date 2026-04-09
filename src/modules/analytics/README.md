# Analytics Feature

This feature provides a comprehensive dashboard for visualizing project metrics, revenue trends, and task performance.

## Components

### AnalyticsPage
The main entry point for the analytics dashboard. It orchestrates the layout and manages global state like the date range filter.

- **Path**: `/dashboard/analytics`
- **Route**: `_dashboard.dashboard.analytics.tsx`

### KPISection
Displays key performance indicators (KPIs) in a grid of cards.
- **Metrics**: Total Revenue, Active Projects, Task Completion Rate, Active Users.
- **Data Source**: `getAnalyticsKPIsFn`

### RevenueChart
A line chart showing revenue trends over a selected period (7, 30, 90 days).
- **Library**: Recharts
- **Data Source**: `getRevenueTrendFn`

### TaskCompletionChart
A line chart showing the number of tasks completed over time.
- **Library**: Recharts
- **Data Source**: `getTaskCompletionTrendFn`

### TaskDistribution
Visualizes task distribution by status and priority using bar charts.
- **Library**: Recharts
- **Data Source**: `getTaskDistributionFn`

### ProjectPerformance
A table displaying project details, including budget usage and task completion progress.
- **Features**: Client-side search/filtering.
- **Data Source**: `getProjectPerformanceFn`

## API

The feature uses TanStack Start server functions for data fetching, integrated with TanStack Query.

- `getAnalyticsKPIsFn`: Aggregates high-level metrics.
- `getRevenueTrendFn`: Fetches daily revenue data.
- `getTaskCompletionTrendFn`: Fetches daily task completion counts.
- `getTaskDistributionFn`: Groups tasks by status and priority.
- `getProjectPerformanceFn`: Retrieves detailed project stats.

## Accessibility

- All charts use color-blind friendly palettes where possible (or distinct patterns/labels).
- Interactive elements (buttons, inputs) are keyboard accessible.
- ARIA labels are used for charts and complex widgets.
- Loading states are communicated via Skeletons.
