import './globals.css';

export const metadata = {
  title: 'Music Remix Competition - Monad',
  description: 'Decentralized music remix competition platform on Monad blockchain',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}

