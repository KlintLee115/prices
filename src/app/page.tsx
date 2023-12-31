"use client"

import InsertItem from '@/components/InsertItem';
import Maps from '@/components/Maps';
import SearchItem from '@/components/SearchItem';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

type ItemType = {
  date: string,
  locationStr: string,
  price: number,
  product: string
}

export default function Home() {

  const [prices, setPrices] = useState<ItemType[]>([])
  const searchParams = useSearchParams()
  const strLat = searchParams.get('lat')
  const strLng = searchParams.get('lng')

  const lat = strLat ? parseFloat(strLat) : undefined
  const lng = strLng ? parseFloat(strLng) : undefined

  useEffect(() => {
    async function getData() {
      const response = await fetch('/api/getitem', {
        method: "POST",
        body: JSON.stringify({
          lat: lat, lng: lng
        })
      });
      const data: any = await response.json();

      if (data.item !== null) {
        if (data.length > 0) {
          setPrices(data)
        }
      }
    }

    getData()
  }, [searchParams.get('lat'), searchParams.get('lng')]);

  return (
    <div>
      <SearchItem />
      <div className='flex justify-evenly mt-[5vh]'>
        <Maps />
        <div>
          <div className='max-w-[30vw]'>
            {prices.map((item: ItemType, key) => {
              return <div key={key} className='border border-black h-fit px-[5vw]'>
                <h3>Item: {item.product}</h3>
                <h3>Price: {item.price}</h3>
                <h3>Address: {item.locationStr}</h3>
              </div>
            })}
          </div>
          <InsertItem />
        </div>
      </div>
    </div>
  )
}
