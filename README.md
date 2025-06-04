# Grab It Yourself Scraper

A modern web scraping application that allows you to extract text, images, and PDFs from any website with a clean, user-friendly interface. Built with React, TypeScript, and Vite, this scraper uses the Firecrawl API to efficiently extract content from web pages.

## ✨ Features

- 🌐 Extract text content from any website
- 🖼️ Download images with alt text
- 📄 Find and download PDF documents
- 🔍 Simple and intuitive user interface
- ⚡ Fast and efficient scraping using Firecrawl API
- 🔒 Secure API key management

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Firecrawl API key (get one from [Firecrawl](https://firecrawl.dev))

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/ishaan000/grab-it-yourself-scraper.git
   cd grab-it-yourself-scraper
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your Firecrawl API key:
   ```env
   VITE_FIRECRAWL_API_KEY=your_api_key_here
   ```

### Running the Application

Start the development server:

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

## 🛠️ Building for Production

To create a production build:

```sh
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- [Lovable](https://lovable.dev) for the initial MVP and project scaffolding
- [Firecrawl](https://firecrawl.dev) for the powerful web scraping API
- [Shadcn UI](https://ui.shadcn.com/) for the beautiful UI components
- [Vite](https://vitejs.dev/) for the fast development experience

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
