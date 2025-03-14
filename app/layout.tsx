import { type Metadata } from "next";
import { NextUIProvider } from '@nextui-org/react'
import "./globals.css"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <NextUIProvider>
          {children}
        </NextUIProvider>
        <ToastContainer />
      </body>
    </html>
  )
}