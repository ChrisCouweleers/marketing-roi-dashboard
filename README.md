# Marketing ROI Dashboard — User Guide

## Overview

The Marketing ROI Dashboard is an interactive reporting tool that lets you input your marketing performance data and instantly generates an executive-ready dashboard with charts, KPIs, and insights. No logins, no accounts — just open the link and start entering your numbers.

**Live URL:** [https://marketing-roi-dashboard.netlify.app/](https://marketing-roi-dashboard.netlify.app/)

---

## Getting Started

When you open the dashboard, you'll land on the **Data Input** screen. Sample data is pre-loaded so you can see how everything works before entering your own numbers.

### Entering Your Data

The input screen has four tabs across the top:

**📅 Monthly Data**
Enter one row per reporting month. Each row needs:
- **Month** — a short label (e.g. "Jan", "Feb", "Q1")
- **Spend ($)** — total marketing spend for that month
- **Revenue ($)** — attributed revenue for that month
- **Leads** — number of leads generated

**📡 Channels**
Enter one row per marketing channel. Each row needs:
- **Channel Name** — e.g. "Paid Search", "Email", "Social Media"
- **Spend ($)** — total spend on that channel
- **Revenue ($)** — total revenue attributed to that channel

**🚀 Campaigns**
Enter one row per campaign. Each row needs:
- **Campaign Name** — the name of the campaign
- **Channel** — which channel(s) it ran on
- **Spend ($)** — campaign budget spent
- **Revenue ($)** — revenue attributed to the campaign
- **Status** — select Active, Completed, or Paused

**🔽 Funnel**
Enter your marketing funnel stages from top to bottom (widest to narrowest). Each row needs:
- **Stage Name** — e.g. "Impressions", "Clicks", "Leads", "MQLs", "SQLs", "Closed Won"
- **Volume** — the number of people/actions at that stage

### Adding & Removing Rows
- Click the green **+ Add** button in each section to add a new row
- Click the red **×** button next to any row to remove it
- You need at least one row in each section

### Generating the Dashboard
Once your data is entered, click the green **Generate Dashboard →** button at the bottom. Your dashboard will be calculated and displayed instantly.

---

## Reading the Dashboard

The dashboard has four tabs:

### Overview
The main executive summary showing:
- **KPI cards** at the top — Total Revenue, Total Spend, Blended ROAS, Total Leads, and Average CPL. Each card shows a percentage change comparing the second half of your data to the first half.
- **Revenue vs. Spend chart** — an area chart showing both metrics over time
- **Budget Allocation** — a donut chart showing how spend is distributed across channels
- **ROAS Trend** — a line chart tracking return on ad spend month over month
- **Lead Generation & CPL** — a combined bar/line chart showing lead volume alongside cost per lead

### Channel Performance
- **ROI Comparison** — a horizontal bar chart ranking every channel by ROI percentage
- **Channel cards** — detailed cards for each channel showing spend, revenue, and a visual ROI progress bar

### Campaigns
- **Campaign table** — every campaign listed with spend, revenue, ROI bar, and status badge
- **Summary cards** — active campaign count, average ROI, best-performing campaign, and total pipeline value

### Funnel Analysis
- **Visual funnel** — a tapered visualization showing volume at each stage
- **Conversion rates** — stage-to-stage conversion percentages with progress bars
- **Overall conversion** — the end-to-end conversion rate from your first stage to your last

---

## Tips for Best Results

- **Be consistent with time periods.** If your monthly data covers Jul–Feb, make sure your channel and campaign numbers reflect the same period.
- **Funnel stages should decrease.** Each stage should generally have a smaller number than the one above it. If they don't, the conversion rates will show values over 100%.
- **Use the sample data first.** Click through the generated dashboard with the pre-loaded sample data to understand what each chart shows before entering your own.
- **Data is not saved.** Each person enters their own data each session. If you refresh the page, you'll start fresh with sample data again.

---

## Editing Your Data

From the dashboard view, click the **✏️ Edit Data** button in the top-right corner to go back to the input screen. Your previously entered data will still be there — make your changes and click **Generate Dashboard →** again.

To start over entirely, click **↺ Reset to Sample** to restore the original sample data.

---

## Questions or Updates

For changes to the dashboard itself (new charts, different metrics, design tweaks), contact the project owner to request an update.
