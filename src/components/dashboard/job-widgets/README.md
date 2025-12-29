# Job Dashboard Widgets

A collection of dashboard widgets for the Jobs page, inspired by modern dashboard design patterns.

## Overview

This implementation adds 5 dashboard widgets to the `/dashboard/jobs` page:

1. **Total Applications** - Shows total applications with weekly trend and sparkline chart
2. **Active Jobs** - Displays count of active jobs with top 3 departments
3. **Interviews Scheduled** - Shows upcoming interview count
4. **Active Applicants** - Total applicants with weekly growth and sparkline
5. **Hiring Pipeline** - Visual pipeline showing candidates in each stage (New, Screening, Interview, Offer)

## Files Created

```
/src/components/dashboard/job-widgets/
├── job-dashboard-widget.tsx               # Base reusable widget component
├── total-applications-widget.tsx          # Total applications widget
├── active-jobs-widget.tsx                 # Active jobs widget
├── interviews-scheduled-widget.tsx        # Interviews widget
├── active-applicants-widget.tsx           # Active applicants widget
├── hiring-pipeline-widget.tsx             # Hiring pipeline widget
├── job-dashboard-widgets.tsx              # Main wrapper component
├── index.tsx                              # Export file
└── README.md                              # This file
```

## API Endpoint

**Endpoint:** `GET /api/jobs/dashboard-widgets`

**Location:** `/src/models/Jobs/route.ts` (lines 1180-1342)

**Response Structure:**
```json
{
  "success": true,
  "widgets": {
    "applications": {
      "total": 245,
      "change": 12.5,
      "label": "Last Week",
      "chartData": [10, 15, 20, 25, 30, ...]
    },
    "jobs": {
      "count": 18,
      "topDepartments": ["Engineering", "Marketing", "Sales"]
    },
    "interviews": {
      "count": 3,
      "nextInterview": {
        "candidateName": "John Doe",
        "time": "2:30 PM"
      }
    },
    "applicants": {
      "total": 1867,
      "newThisWeek": 52,
      "chartData": [100, 120, 150, ...]
    },
    "pipeline": {
      "stages": [
        { "name": "New", "count": 45, "color": "bg-blue-500" },
        { "name": "Screening", "count": 30, "color": "bg-yellow-500" },
        { "name": "Interview", "count": 15, "color": "bg-purple-500" },
        { "name": "Offer", "count": 5, "color": "bg-green-500" }
      ]
    }
  }
}
```

## Integration

The widgets are already integrated into the jobs page at:
`/src/app/(dashboard)/dashboard/jobs/_components/jobs-client.tsx`

They appear between the page header and the actionable stats cards.

## Usage

The widgets are automatically displayed on the `/dashboard/jobs` page. They fetch data on mount and display loading skeletons while fetching.

### Using Individual Widgets

If you want to use widgets individually:

```tsx
import {
  TotalApplicationsWidget,
  ActiveJobsWidget,
  InterviewsScheduledWidget,
  ActiveApplicantsWidget,
  HiringPipelineWidget,
} from '@/components/dashboard/job-widgets'

export const MyCustomDashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch data...

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <TotalApplicationsWidget data={data?.applications} loading={loading} />
      <ActiveJobsWidget data={data?.jobs} loading={loading} />
      <InterviewsScheduledWidget data={data?.interviews} loading={loading} />
      <ActiveApplicantsWidget data={data?.applicants} loading={loading} />
    </div>
  )
}
```

## Features

- ✅ **Responsive Design** - Mobile-friendly grid layout
- ✅ **Loading States** - Skeleton loaders while data fetches
- ✅ **Trend Indicators** - Up/down arrows showing positive/negative trends
- ✅ **Mini Charts** - Sparkline charts for visualizing trends
- ✅ **Progress Bars** - Pipeline widget shows visual progress bars
- ✅ **Real Data** - Pulls actual data from MongoDB via API
- ✅ **Auto-refresh** - Data fetches on component mount

## Customization

### Modifying Widget Data

To modify what data is shown, edit the API endpoint at:
`/src/models/Jobs/route.ts` (line 1180)

### Styling

All widgets use Tailwind CSS classes and can be customized:

```tsx
<JobDashboardWidget
  className="custom-class"  // Add custom classes
  // ... other props
/>
```

### Adding New Widgets

1. Create a new widget component in `/src/components/dashboard/job-widgets/`
2. Follow the pattern of existing widgets
3. Add data fetching logic to the API endpoint
4. Export from `index.tsx`
5. Add to `job-dashboard-widgets.tsx`

## Data Sources

The widgets pull data from:
- **Job** model - Active jobs, departments
- **Applicant** model - Applications, applicants, pipeline stages

## Performance

- Single API call fetches all widget data
- MongoDB aggregation pipelines for efficient querying
- Chart data limited to last 30 days to minimize payload
- Loading states prevent layout shift

## Browser Support

Compatible with all modern browsers:
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)

## Troubleshooting

### Widgets show "No data"
- Check MongoDB connection
- Verify API endpoint is accessible at `/api/jobs/dashboard-widgets`
- Check browser console for errors

### API returns error
- Check authentication middleware
- Verify user is logged in
- Check MongoDB models are properly imported

### Styling issues
- Ensure Tailwind CSS is properly configured
- Check that shadcn/ui components are installed
- Verify all required dependencies are installed

## Dependencies

- `react` - UI framework
- `lucide-react` - Icon library
- `@/components/ui/*` - shadcn/ui components
- `@/lib/utils` - Utility functions (cn)
- `hono` - API framework
- `mongodb` - Database

## Future Enhancements

Potential improvements:
- Real-time updates via WebSocket
- Date range filters
- Export widget data
- Custom widget configurations
- Interview scheduling integration
- Email notifications for pipeline changes

## Support

For issues or questions about the widgets:
1. Check this README
2. Review the example implementations
3. Check API endpoint responses
4. Verify database connections

---

**Implementation Date:** December 2024
**Framework:** Next.js 15 with App Router
**Styling:** Tailwind CSS + shadcn/ui
