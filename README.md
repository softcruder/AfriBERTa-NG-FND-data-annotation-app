# Data annotation app

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/softcruders-projects/v0-data-annotation-app)

## Overview


## Security & Access Control

### Admin Authorization
This application implements role-based access control with specific restrictions for Google Drive configuration:

- **Admin Users**: Only users with admin email addresses can access Google Drive files for configuration purposes
- **Drive Configuration**: The `/api/drive/files` endpoint is restricted to admin users only
- **Data Access**: Regular annotators can still access CSV data from files pre-configured by admins
- **Admin Emails**: `oladipona17@gmail.com`, `nasirullah.m1901406@st.futminna.edu.ng`

### Data Source Requirement
All sheets and CSV files used as databases must be stored in admin Google Drive accounts to ensure proper access control and data governance.

## Deployment

Your project is live at:

**[https://vercel.com/softcruders-projects/v0-data-annotation-app](https://vercel.com/softcruders-projects/v0-data-annotation-app)**

## Build your app


## How It Works
