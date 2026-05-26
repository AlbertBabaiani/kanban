# Kanban | Premium Task Management Web App

<div align="center">

  <img src="https://img.shields.io/badge/Angular_20-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white" alt="Sass" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Responsive-Mobile_First-05A328?style=for-the-badge" alt="Responsive" />

  <br />
  <br />

  <a href="https://kanban-ng.vercel.app">
    <img src="https://img.shields.io/badge/View_Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="View Live Demo" />
  </a>
  
  <a href="https://github.com/AlbertBabaiani/kanban.git">
    <img src="https://img.shields.io/badge/GitHub_Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" />
  </a>

  <a href="https://www.figma.com/design/Ohaa8zpSgY0lKohylLI7wp/kanban-task-management-web-app--Copy-?node-id=0-1&t=AYoQxGurGZyw17xZ-0">
    <img src="https://img.shields.io/badge/Figma_Design_File-000000?style=for-the-badge&logo=figma&logoColor=white" alt="Figma Design" />
  </a>

</div>

---

## About The Project

**Kanban** is a high-performance, fully responsive task and workflow management application designed to match the premium aesthetics of the modern web. Engineered with a strict mobile-first philosophy, it enables users to seamlessly manage, visualize, and orchestrate complex projects via multiple customizable boards, drag-and-drop column pipelines, and subtask completion tracking.

Leveraging a cloud database integration, the web app ensures your workspace is synchronized in real-time. Unauthenticated users are managed by dynamic security guards and redirected to modern, beautifully animated Sign In or Sign Up routes featuring comprehensive password validation and global dark/light theme options.

### Key Technical Concepts

This project showcases cutting-edge web architecture and development best practices:

- **Signals-First State Architecture:** Built using Angular **Signals** (`signal`, `computed`, `effect`) for ultra-efficient, highly responsive local UI and global states. By dropping traditional RxJS subjects in favor of Signals, DOM updates are extremely granular and happen with zero unnecessary renders.
- **Dynamic Board & Subtask CRUD:** Delivers fully-typed interfaces for board creation, custom status column configuration (complete with colorful identifier dots), task details, and nested subtasks. Subtask status state is stored and mapped instantly to the cloud.
- **CDK Drag & Drop Orchestration:** Integrates the `@angular/cdk/drag-drop` module to support fluid, responsive drag and drop behaviors. Users can intuitively reorder tasks within a single column or transition tasks across distinct state columns, updating task statuses instantly both on the client and in the Cloud Firestore database.
- **Functional Security Guards & Lazy Routing:** Employs modern Angular functional route guards (`canActivate` / `canMatch` patterns) via `authGuard` and `guestGuard` to separate authenticated dashboard environments from public guest login spaces. All features are cleanly organized into lazy-loaded standalone components to minimize initial bundle size.
- **Comprehensive Password Policies & Sanitization:** The Sign Up form enforces robust security requirements (minimum 6 characters, at least 1 number, at least 1 uppercase and 1 lowercase letter). Sign In error handlers intercept raw Firebase Auth exceptions, sanitizing them in real-time to strip mechanical SDK syntax (e.g. `Firebase: Error (auth/...)`) and produce white-labeled, user-friendly feedback.
- **Premium Keyboard Accessibility (a11y):** In compliance with high accessibility standards, every single modal overlay (add task, view details, edit board, delete alerts) is fully responsive to keyboard gestures. Pressing the `Escape` key immediately closes the active modal layer, and focus states are carefully guarded to ensure seamless navigation.
- **Custom Global UI & Theme Switching:** Features dynamic Light and Dark mode options saved instantly to `localStorage`. The application logo, sidebar controls, and empty-state board buttons switch visual styles automatically using scoped `:host-context([data-theme='dark']) &` SASS styling tokens.

---

## Built With

- **Angular 20** - Utilizing strictly Standalone Components, Signals, Functional Guards, and modern Control Flow block syntax (`@if`, `@for`).
- **Angular CDK** - Orchestrating smooth, high-fidelity drag-and-drop transitions for kanban task items.
- **Firebase / Firestore** - Offloading secure cloud user authentication and persisting boards, columns, tasks, and subtask trees with zero latency.
- **TypeScript** - Enforcing rigid data models and type safety across the entire CRUD pipeline.
- **SCSS / SASS** - Structuring UI tokens using the modern `@use` module system, nested parent variables, custom host styling contexts, and hardware-accelerated transitions.

---

## Getting Started

### Prerequisites
Make sure you have Node.js (version 18 or higher) and the Angular CLI installed on your machine.

### Installation & Local Run

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AlbertBabaiani/kanban.git
   cd kanban
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   ng serve
   ```
   Open your browser and navigate to `http://localhost:4200/` to preview the app locally.

4. **Build the production package:**
   ```bash
   ng build
   ```
   Optimized files will be generated inside the `dist/` directory.
