import './globals.css';

export const metadata = {
  title: 'SONAD - Sound on Monad',
  description: 'Decentralized music platform and remix competitions on Monad blockchain',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-900 text-white min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

