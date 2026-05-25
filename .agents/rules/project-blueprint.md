---
trigger: always_on
---

# SYSTEM INSTRUCTIONS & PROJECT CONTEXT

You are an expert Frontend Developer acting as my AI coding assistant.
Below is the complete project blueprint for the Kanban application we are building.
Please read and internalize this document. Reply only with "Context saved. Ready for your first instruction." and wait for my prompt before generating any code.

---

# Kanban Task Management Application - Project Blueprint

## 1. Project Overview

A fully responsive, mobile-first Kanban board application. Users can create multiple boards, customize columns, and manage tasks with subtasks. The app supports seamless drag-and-drop interactions, light and dark themes, user authentication, and real-time data persistence.

## 2. Technical Stack

- **Framework:** Angular 21 (utilizing Signals for reactivity and Standalone Components)
- **UI Components:** Angular Material (customized to match the design system)
- **Styling:** SCSS (Variables, semantic HTML, mobile-first media queries)
- **Database / Backend:** Firebase Firestore (Real-time NoSQL data storage)
- **Authentication:** Firebase Auth (Email & Password login/registration)
- **Storage:** Local Storage (specifically for persisting the Light/Dark theme selection)

## 3. Directory & Asset Structure

To maintain a clean architecture, assets will be organized as follows:
src/
└── assets/
├── fonts/ # Plus Jakarta Sans
├── images/ # Previews and static assets
├── icons/ # SVG icons (board, eye, check, cross, chevron)
└── scss/
├── \_variables.scss # Colors, typography, breakpoints
├── \_mixins.scss # Reusable SCSS blocks
└── \_themes.scss # Light/Dark mode mappings

## 4. Design System Guidelines

Based on the provided design files, the UI must adhere to the following specifications:

### Typography

- **Font Family:** Plus Jakarta Sans
- **Weights:** Medium, Bold
- **Hierarchy:**
  - Heading (XL): Bold, 24px, 30px line height
  - Heading (L): Bold, 18px, 23px line height
  - Heading (M): Bold, 15px, 19px line height
  - Heading (S): Bold, 12px, 15px line height, 2.4px letter spacing
  - Body (L): Medium, 13px, 23px line height
  - Body (M): Bold, 12px, 15px line height

### Color Palette

- **Primary / Accent:** #635FC7 (Main Purple), Hover: #A8A4FF
- **Destructive:** #EA5555 (Red), Hover: #FF9898
- **Dark Theme Backgrounds:** #000112 (Very Dark Blue/Black), #20212C (Dark Grey), #2B2C37 (Darker Grey)
- **Light Theme Backgrounds:** #FFFFFF (White), #F4F7FD (Light Grey/Blue), #E4EBFA (Lighter Blue)
- **Text / Structural:** #828FA3 (Medium Grey), #3E3F4E (Dark Grey outline/text)

### Interactive Elements

- **Buttons:** Primary (Large/Small), Secondary, Destructive. All require distinct :hover states.
- **Forms:** Text fields with Idle, Active (highlighted border), and Error states (red border with "Can't be empty" text).
- **Dropdowns & Checkboxes:** Custom styled to match the theme, replacing native browser defaults.

## 5. Core Functional Requirements

1. **Authentication:** Users must be able to register and log in using an email and password via Firebase Auth. The application routes (boards, tasks) must be protected by an Auth Guard, redirecting unauthenticated users to the login screen.
2. **Responsive Layout:** The UI must adapt optimally across mobile, tablet, and desktop screens.
3. **Hover States:** All interactive elements (tasks, buttons, links) must have clear visual feedback on hover.
4. **CRUD Operations:**
   - **Boards:** Create, Read, Update, Delete. Tied to the authenticated user's ID.
   - **Tasks:** Create, Read, Update, Delete.
5. **Form Validation:** Prevent submission and display inline errors if required fields are empty or invalid during authentication, board, and task creation.
6. **Task Management:** Mark subtasks as complete (storing state in Firestore) and move tasks between columns.
7. **Sidebar Navigation:** Ability to toggle the sidebar's visibility (Hide/Show) with a floating action button to reveal it when hidden.
8. **Theme Toggling:** Switch between Light and Dark modes. The user's preference must be saved in the browser's localStorage and applied on initial load.
9. **Drag & Drop:** Utilize Angular CDK Drag and Drop to allow users to intuitively reorder tasks within a column and drag them across different columns to update their status.

## 6. Firestore Database Schema (Proposed)

Collection: users
{
"uid": "string",
"email": "user@example.com",
"createdAt": "timestamp"
}

Collection: boards
{
"boardId": "string",
"userId": "string", // References the authenticated user
"name": "Platform Launch",
"columns": [
{
"columnId": "string",
"name": "Todo",
"color": "#49C4E5"
}
]
}

Collection: tasks
{
"taskId": "string",
"boardId": "string",
"columnId": "string",
"title": "Build UI for search",
"description": "Optional details...",
"status": "Todo",
"order": 0,
"subtasks": [
{
"title": "Design settings",
"isCompleted": false
}
]
}
