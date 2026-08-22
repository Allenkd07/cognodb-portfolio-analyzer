import { Inter } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import ThemeProvider from '../components/ThemeProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata = {
  title: 'Portfolio Look-Through',
  description: 'See what you actually own, once you look through every fund you hold.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body suppressHydrationWarning>
        <AntdRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
