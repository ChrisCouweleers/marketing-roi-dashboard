# Marketing ROI Dashboard — User Guide

## Overview

The Marketing ROI Dashboard is an interactive reporting tool for marketing teams. Enter your performance data, set goals, add competitor benchmarks, and instantly generate an executive-ready dashboard with charts, KPIs, forecasts, and insights. No logins, no accounts — just open the link and start.

**Live URL:** [https://marketing-roi-dashboard.netlify.app/](https://marketing-roi-dashboard.netlify.app/)

---

## Getting Started

Open the dashboard and you'll land on the **Data Input** screen. Sample data is pre-loaded so you can explore everything before entering your own numbers. When you're ready, replace the sample data, then click **Generate Dashboard**.

---

## Entering Your Data

The input screen has six tabs:

### 📅 Monthly Data
One row per reporting month. Fields: **Month**, **Spend ($)**, **Revenue ($)**, **Leads**, and an optional **Note** for annotating key events (e.g., "Black Friday push" or "New landing pages launched"). Notes show up as markers on the dashboard charts.

### 📡 Channels
One row per marketing channel. Fields: **Channel Name**, **Spend ($)**, **Revenue ($)**.

### 🚀 Campaigns
One row per campaign. Fields: **Campaign Name**, **Channel**, **Spend ($)**, **Revenue ($)**, **Status** (Active / Completed / Paused).

### 🔽 Funnel
Your marketing funnel stages from top to bottom (widest to narrowest). Fields: **Stage Name**, **Volume**. Each stage should generally have a smaller number than the one above it.

### 🎯 Goals
Set performance targets for five key metrics: **Revenue Target**, **Budget Cap**, **Target ROAS**, **Lead Target**, and **Target CPL**. These appear as progress bars on the dashboard KPI cards. Leave any field blank to hide that target.

### ⚔️ Competitors
Pre-filled with Industry Average, Top Performer, and a sample competitor. Each entry has: **Name**, **ROAS**, **CPL ($)**, **Conv. Rate (%)**, and **ROI (%)**. Edit the defaults to match your market, or add new competitors. These are compared against your metrics on the Benchmarks dashboard tab.

### Working with Rows
- Click **+ Add** to add a new row in any section
- Click the **×** button to remove a row
- **Desktop:** Drag the ⠿ handle on the left to reorder rows
- **Mobile:** Use the **▲▼** arrows to reorder rows

---

## Dashboard Views

After clicking **Generate Dashboard**, you'll see six tabs:

### Overview
The main executive summary. Includes five animated KPI cards (Total Revenue, Total Spend, Blended ROAS, Total Leads, Avg CPL) with period-over-period change indicators and goal progress bars. Below the KPIs you'll find a **Date Range** filter to zoom into specific months, a Revenue vs. Spend area chart (with 📌 pins where you added monthly notes), a Budget Allocation donut chart, a ROAS Trend line chart, and a Lead Generation & CPL combo chart.

### Forecasting
Project your revenue, spend, and leads into the future. Choose a horizon of **3, 6, 9, or 12 months** using the buttons at the top. The chart shows your actual data as solid lines transitioning into dashed projected lines (calculated using linear regression). Summary cards below show projected totals for the selected period.

### Channels
A horizontal bar chart ranking every channel by ROI percentage, plus detailed cards for each channel showing spend, revenue, and a visual ROI progress bar.

### Campaigns
A full campaign table (or cards on mobile) with spend, revenue, ROI bars, and status badges. Summary cards show active campaign count, average ROI, best performer, and total pipeline value.

### Funnel
A tapered funnel visualization with stage-to-stage conversion rates and an overall end-to-end conversion metric.

### Benchmarks
A comparison table showing your ROAS, CPL, Conversion Rate, and ROI against every competitor you entered. The best performer in each metric gets a 🏆. Below the table, scorecards show whether you're outperforming or trailing the competitor average for each metric.

### Notes & Annotations
Every dashboard tab has a **Notes & Annotations** section at the bottom. Click **+ Add Note** to attach freeform observations to any section (e.g., "Revenue spike driven by holiday campaign"). Notes are tied to the tab you're viewing.

---

## Exporting Your Report

From the dashboard view, click the green **📤 Export** button in the header. Two options:

- **PDF** — Opens a clean, print-formatted report in a new tab with your browser's print dialog. Save as PDF or send to a printer.
- **CSV** — Downloads a spreadsheet file with all your data organized by section, ready to open in Excel or Google Sheets. Includes monthly notes.

---

## Tips for Best Results

- **Be consistent with time periods.** If your monthly data covers Jul–Feb, make sure your channel and campaign numbers reflect the same window.
- **Funnel stages should decrease.** Each stage should generally have a smaller number than the one above it.
- **Use notes liberally.** Annotating months with context ("budget cut", "new campaign launched") makes the dashboard far more useful when presenting to stakeholders.
- **Set realistic goals.** The progress bars work best when targets are achievable — if everything is at 10%, the bars won't be very informative.
- **Update competitor data periodically.** Benchmarks are only useful if they reflect current market conditions.
- **Data is not saved.** Each session starts fresh with sample data. This is by design for a shared team tool.

---

## Editing Your Data

From the dashboard, click **✏️ Edit** in the header to return to the input screen with your data intact. Make changes and click **Generate Dashboard** again. To start completely fresh, click **↺ Reset** to restore all sample data.

---

## Mobile Support

The dashboard is fully responsive. On phones, KPI cards become a swipeable horizontal row, grids stack to single columns, campaign tables become cards, and drag-and-drop reordering is replaced with ▲▼ arrow buttons.

---

## Tech Stack

- React 18 with recharts for data visualization
- No backend or database — all calculations are client-side
- Hosted on Netlify with automatic deploys from GitHub

---

## Updating the Dashboard

To request changes (new charts, metrics, design tweaks), describe what you need and update the `src/App.js` file on GitHub. Netlify auto-deploys within about a minute.
