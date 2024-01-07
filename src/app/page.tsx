"use client"

import Maps, { MarkerType } from '@/components/Maps';
import OverlayForm from '@/components/OverlayForm';
import SearchItem from '@/components/SearchItem';
import Script from 'next/script';
import { useState, useEffect } from 'react';

declare const window: Window &
  typeof globalThis & {
    initMap: () => void
  }

type ItemType = {
  date: string,
  address: string,
  price: number,
  product: string,
  location: {
    coordinates: number[]
  }
}

type SearchParamsKeys = {
  lat: string,
  lng: string,
  product: string
}

export default function Home({ searchParams }: { searchParams: SearchParamsKeys }) {

  const [prices, setPrices] = useState<ItemType[]>([])
  const [isOverlayOn, setIsOverlayOn] = useState<boolean>(false)
  const [currMarker, setCurrMarker] = useState<MarkerType | null>(null)
  const [isMapsLoaded, setMapsLoaded] = useState(false);
  const [selectedItemKey, setSelectedItemKey] = useState<number>()

  const strLat = searchParams.lat
  const strLng = searchParams.lng
  const product = searchParams.product

  window.initMap = () => setMapsLoaded(true)

    useEffect(() => {
      if (typeof window !== 'undefined' && window.google) {
        setMapsLoaded(true);
      }
    }, []);

  useEffect(() => {
    (async () => {

      let queries: string[] = []

      if (strLat) queries.push(`lat=${strLat}`)
      if (strLng) queries.push(`lng=${strLng}`)
      if (product) queries.push(`product=${product}`)

      const response = await fetch(`/api/?${queries.join('&')}`);
      const data: any = await response.json();

      !data.error && setPrices(data)
    })()
  }, [searchParams.lat, searchParams.lng, searchParams.product])

  return (
    <>
      <Script
        src='https://maps.googleapis.com/maps/api/js?key=AIzaSyBnvG70wcyfAYDGLa5pWH0ClNBmihlwjJk&libraries=places&callback=initMap' defer />
      {isMapsLoaded ?
        <>
          <OverlayForm isOverlayOn={isOverlayOn} />
          <div className={isOverlayOn ? "blur-sm" : ""} onClick={() => isOverlayOn && setIsOverlayOn(false)}>
            <SearchItem lat={strLat ? parseFloat(strLat) : undefined}
              lng={strLng ? parseFloat(strLng) : undefined}
              product={product ?? undefined}

            />
            <div className='flex justify-evenly mt-[5vh] min-h-[60vh] max-h-[70vh]'>
              <Maps currMarker={currMarker} setSelectedMarker={setCurrMarker}/>
              <div className='max-h-full max-w-[35vw] flex flex-col'>
                <h2>Want to contribute?</h2>
                <h2 className='inline'><button
                  onClick={() => setIsOverlayOn(true)}
                  className='bg-black text-white rounded-md px-[1vw] mr-[0.5vw]'>Click me</button>
                  to add a new information</h2>
                <div className='mt-[3vh] overflow-y-auto'>
                  {prices.map((item: ItemType, key) => {
                    return <div
                    onClick={()=>{
                      setSelectedItemKey(key)
                      setCurrMarker({
                        location: {
                          lng: item.location.coordinates[0],
                          lat: item.location.coordinates[1],
                        },
                        name: item.address
                      })
                    }} 
                    key={key} 
                    className={`border border-black h-fit py-[1vh] px-[3vw] ${key===selectedItemKey ? "bg-cyan-100" : "bg-transparent"}`}>
                      <h3>Item: {item.product}</h3>
                      <h3>Price: {item.price}</h3>
                      <h3>Address: {item.address}</h3>
                    </div>
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
        : <></>
      }
    </>
  )
}
