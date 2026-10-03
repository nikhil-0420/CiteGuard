# CiteGuard Frontend Handoff

## 1. What This Is
The frontend only displays finished audit reports. The reasoning runs in agents on the Nuroen platform, and the backend handles setting the GitHub status and serving reports.

## 2. How to Run
- **Install**: Run `npm install` and then build or serve the application.
- **Mock Mode**: Controlled via `VITE_USE_MOCK`. When set to true, the application runs entirely locally using mock JSON responses and simulates backend behavior deterministically.
- **Live Mode**: Set `VITE_USE_MOCK` to false. 
- **API Base URL Configuration**: Set via the `VITE_API_URL` environment variable.

## 3. Screens and States
- **Gate Banner**: Implemented and verified in mock mode.
- **Findings**: Implemented and verified in mock mode.
- **Evidence**: Implemented and verified in mock mode.
- **Agent Trace**: Implemented and verified in mock mode.
- **Review Panel**: Implemented and verified in mock mode. *(Note: Must become read-only in live mode)*
- **Demo Mode**: Implemented and verified in mock mode.
- **Results Page (Eval Page)**: Implemented and verified in mock mode.

## 4. Known Gaps
- Live API integration remains unverified.
- The review panel must become read-only in live mode because approvals happen on GitHub.
- Auto-refresh while pending is not implemented; the application currently fetches the report once and does not poll for updates.
- Agent names are missing in the trace.
- The audio briefing UI needs to be hidden when the briefing is absent.

## 5. Data and Wording Rules
- The data shape comes from the contract and must **not** be changed from the frontend.
- **Banned Words**: Do not use the words "fabricated", "fake", or "fraudulent" anywhere in the UI. 
- **Preferred Wording**: Use "could not verify" or "not supported in reviewed evidence".

## 6. Ownership
- **Nehaa**: Edits only the frontend folder.
- **Nikhil**: Contract changes go through Nikhil.
- **Sam**: Backend questions go to Sam.
