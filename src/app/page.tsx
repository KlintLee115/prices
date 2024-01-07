"use client"

import Maps from '@/components/Maps';
import OverlayForm from '@/components/OverlayForm';
import SearchItem from '@/components/SearchItem';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

type ItemType = {
  date: string,
  address: string,
  price: number,
  product: string
}

export default function Home() {

  const [prices, setPrices] = useState<ItemType[]>([])
  const [isOverlayOn, setIsOverlayOn] = useState<boolean>(false)
  const searchParams = useSearchParams()
  const strLat = searchParams.get('lat')
  const strLng = searchParams.get('lng')
  const product = searchParams.get('product')

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
  }, [searchParams.get('lat'), searchParams.get('lng'), searchParams.get('product')])

  return (
    <div>
      <OverlayForm isOverlayOn={isOverlayOn}/>
      <div className={isOverlayOn ? "blur-sm" : ""} onClick={()=>isOverlayOn && setIsOverlayOn(false)}>
        <SearchItem lat={strLat ? parseFloat(strLat) : undefined}
          lng={strLng ? parseFloat(strLng) : undefined}
          product={product ?? undefined}

        />
        <div className='flex justify-evenly mt-[5vh] max-h-[70vh]'>
          <Maps />
          <div className='max-h-full max-w-[25%] flex flex-col'>
            <h2>Want to contribute? <button
            onClick={()=>setIsOverlayOn(true)}
            className='bg-black text-white rounded-md px-[1vw] mr-[0.5vw]'>Click me</button>
              to add a new information</h2>
            <div className='mt-[3vh] overflow-y-auto'>
              {prices.map((item: ItemType, key) => {
                return <div key={key} className='border border-black h-fit py-[1vh] px-[3vw]'>
                  <h3>Item: {item.product}</h3>
                  <h3>Price: {item.price}</h3>
                  <h3>Address: {item.address}</h3>
                </div>
              })}
            </div>
            {/* <InsertItem /> */}
          </div>
        </div>
      </div>
    </div>
  )
}
