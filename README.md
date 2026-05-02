# 📧 Dedubmail — Email List Deduplicator

A fast, private, browser-based tool for merging and deduplicating email lists from multiple files. Upload `.txt`, `.csv`, or `.xlsx` files, instantly remove duplicate entries, and download a single clean list of unique emails — all without sending any data to a server.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
  - [Building for Production](#building-for-production)
- [How It Works](#how-it-works)
- [File Format Support](#file-format-support)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Dedubmail** solves a common problem for marketers, developers, and data analysts: you have several email lists from different sources and need one clean, duplicate-free list. Dedubmail handles this entirely in your browser — no uploads, no accounts, no backend.

---

## Features

- 📂 **Multi-file upload** — drag-and-drop or click to select multiple files at once
- 🔍 **Exact, case-sensitive deduplication** — `User@Example.com` and `user@example.com` are treated as distinct entries
- 📋 **Order preserved** — the first occurrence of each entry is kept; later duplicates are discarded
- 📊 **Per-file stats** — see how many entries each uploaded file contains
- 📈 **Progress indicator** — a live progress bar tracks processing across large files
- 👁 **Preview panel** — inspect up to 200 results before downloading
- ⬇️ **One-click download** — export the deduplicated list as a `.txt` file
- 🔒 **100 % client-side** — your data never leaves the browser
- 🌗 **Light & dark theme** — respects system preference via CSS custom properties

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| UI components | [shadcn/ui](https://ui.shadcn.com/) (built on [Radix UI](https://www.radix-ui.com/)) |
| Routing | [React Router v6](https://reactrouter.com/) |
| Data fetching | [TanStack Query v5](https://tanstack.com/query) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Excel parsing | [SheetJS (xlsx)](https://sheetjs.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Testing | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9 (or [Bun](https://bun.sh/) — a `bun.lockb` is also included)

### Installation

```bash
git clone https://github.com/Benedict258/Dedubmail.git
cd Dedubmail
npm install
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

The optimised output is placed in the `dist/` directory.  
Preview the production build locally:

```bash
npm run preview
```

---

## How It Works

1. **Upload files** — Drag and drop (or click the upload zone) to add one or more `.txt`, `.csv`, or `.xlsx` / `.xls` files.
2. **Process** — Click **Process Files**. Each file is parsed in sequence; a progress bar shows completion.
3. **Deduplication logic** (`src/lib/email-dedup.ts`):
   - Text / CSV files are split on newlines; each non-empty trimmed line is one entry.
   - Excel files are read with SheetJS; every non-empty cell value across all sheets is an entry.
   - A `Set` tracks entries already seen. The first occurrence is added to the output list; any later identical string is counted as a duplicate.
4. **Review results** — A summary card shows total entries processed, duplicates removed, and unique emails found.
5. **Download** — Click **Download .txt** to save the clean list.

---

## File Format Support

| Format | Extension(s) | Parsing strategy |
|--------|-------------|-----------------|
| Plain text | `.txt` | One entry per line |
| Comma-separated | `.csv` | One entry per line (single-column lists) |
| Excel | `.xlsx`, `.xls` | All non-empty cell values across all sheets |

---

## Project Structure

```
Dedubmail/
├── public/               # Static assets
├── src/
│   ├── components/
│   │   ├── NavLink.tsx   # Reusable navigation link component
│   │   └── ui/           # shadcn/ui component library
│   ├── hooks/
│   │   ├── use-mobile.tsx  # Responsive breakpoint hook
│   │   └── use-toast.ts    # Toast notification hook
│   ├── lib/
│   │   ├── email-dedup.ts  # Core deduplication logic
│   │   └── utils.ts        # Shared utilities (cn helper)
│   ├── pages/
│   │   ├── Index.tsx     # Main application page
│   │   └── NotFound.tsx  # 404 fallback page
│   ├── test/
│   │   ├── example.test.ts # Example test suite
│   │   └── setup.ts        # Vitest setup file
│   ├── App.tsx           # Root component with routing
│   ├── index.css         # Global styles & design tokens
│   └── main.tsx          # Application entry point
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server (hot-reload) |
| `npm run build` | Create an optimised production build |
| `npm run build:dev` | Create a development-mode build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint across the codebase |
| `npm run test` | Run the test suite once with Vitest |
| `npm run test:watch` | Run tests in interactive watch mode |

---

## Testing

Tests are located in `src/test/` and use [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/).

```bash
# Run all tests once
npm run test

# Run in watch mode during development
npm run test:watch
```

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m "feat: describe your change"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please make sure `npm run lint` and `npm run test` pass before submitting.

---

## License

This project is open source. See the repository for licensing details.
