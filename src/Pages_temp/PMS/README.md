# PMS System Structure and Usage

## File Structure

```
src/
└── Pages/
    └── PMS/
        ├── index.js                      # Export file for PMS components
        ├── Dashboard/
        │   └── PMSDashboard.jsx          # Main PMS dashboard with overview stats and quick access
        └── PerformanceReviews/
            └── PerformanceReviews.jsx    # Performance review listing and management page
```

## Service Structure

```
src/
└── services/
    └── PMS/
        └── PMSService.js                 # API service for PMS functionality
```

## How the Components Work

1. **Sidebar Integration**
   - PMS is now a top-level section in the sidebar
   - PMS Dashboard is the first item for an overview
   - All PMS modules are accessible from the sidebar

2. **PMSDashboard**
   - Shows overview statistics of the PMS system
   - Displays KPI performance metrics
   - Lists recent performance reviews
   - Provides quick access cards to all PMS modules
   - Shows upcoming deadlines

3. **PerformanceReviews**
   - Lists all performance reviews with filtering options
   - Allows searching and sorting reviews
   - Provides status cards for tracking review progress
   - Has a tabbed interface to quickly view reviews by status

## Adding More PMS Components

To add more PMS components for the other menu items:

1. Create a new folder in `src/Pages/PMS/` for the component (e.g., `Goals`, `KPIs`, etc.)
2. Create the component JSX file inside that folder
3. Add the component to `src/Pages/PMS/index.js` exports
4. Update the Dashboard.jsx switch statement to include the new component

Example:

```jsx
// In Dashboard.jsx
} else if (activeItem === "goals") {
  return <Goals />;
} else if (activeItem === "kpis") {
  return <KPIs />;
}
```

## API Integration

The PMSService.js file contains methods for interacting with the backend API for PMS functionality. The methods follow RESTful patterns and include:

- CRUD operations for reviews
- Dashboard statistics retrieval
- Data fetching for all PMS modules

These can be expanded as needed for additional functionality.
