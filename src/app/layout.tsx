"use client"

import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [isMapsLoaded, setMapsLoaded] = useState(true);

  return (
    <html lang="en">
      {/* <head><script type="text/javascript" src='https://maps.googleapis.com/maps/api/js?key=AIzaSyBnvG70wcyfAYDGLa5pWH0ClNBmihlwjJk&libraries=places'></script></head> */}
      <body className={inter.className}>{isMapsLoaded ? children : <div>Loading</div>}
        <Script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBnvG70wcyfAYDGLa5pWH0ClNBmihlwjJk&libraries=places" onLoad={()=>setMapsLoaded(true)} defer />
      </body>
    </html>
  )
}
