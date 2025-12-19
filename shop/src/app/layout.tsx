import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CartProvider } from '@/lib/cart-context'
import { LanguageProvider } from '@/lib/language-context'
import { AuthProvider } from '@/lib/auth-context'
import { cookies } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ReversEl Shop - أدوات مصممة بإبداع',
  description: 'متجر إلكتروني لبيع الأدوات المصممة بإبداع وجودة عالية',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Read language from cookie on server-side
  const languageCookie = cookies().get('language')
  const initialLanguage = (languageCookie?.value === 'en' || languageCookie?.value === 'ar') ? languageCookie.value : 'ar'

  // Fetch initial translations on server-side
  let initialMessages = {}
  try {
    const response = await fetch(`http://localhost:3000/translations/${initialLanguage}.json`, {
      cache: 'no-store' // Ensure fresh data
    })
    initialMessages = await response.json()
  } catch (error) {
    console.error('Failed to load initial translations:', error)
  }

  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <LanguageProvider initialLanguage={initialLanguage} initialMessages={initialMessages}>
          <AuthProvider>
            <CartProvider>
              <div className="min-h-screen flex flex-col" suppressHydrationWarning>
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
              </div>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
