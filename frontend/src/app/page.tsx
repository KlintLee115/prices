"use client"

import Maps, { MarkerType } from '@/components/Maps';
import OverlayForm from '@/components/OverlayForm';
import SearchItem from '@/components/SearchItem';
import { BasePricesResponseType, FormattedPricesResponseType, PriceCard, SessionInfo, URL_Endpoints } from '@/lib/general';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useState, useEffect } from 'react';

export default function Home() {

  const SortOptions = {
    PriceLTH:
      { value: "Price_LTH", display: "Price Low to High" },
    PriceHTL:
      { value: "Price_HTL", display: "Price High to Low" },
    RatingLTH: {
      value: "Rating_LTH", display: "Rating Low to High"
    },
    RatingHTL: { value: "Rating_HTL", display: "Rating High to Low" }
  } as const

  const searchParams = useSearchParams()
  const [prices, setPrices] = useState<Map<number, FormattedPricesResponseType>>(new Map())
  const [isOverlayOn, setIsOverlayOn] = useState<boolean>(false)
  const [currMarker, setCurrMarker] = useState<MarkerType | null>(null)
  const [isMapsLoaded, setMapsLoaded] = useState(false);
  const { data: session } = useSession()

  const router = useRouter()
  const [selectedItemKey, setSelectedItemKey] = useState<number>(NaN);

  const strLat = searchParams.get('lat')
  const strLng = searchParams.get('lng')
  const product = searchParams.get('product') ?? undefined
  const strRadius = searchParams.get('radius')

  const lat = strLat ? parseFloat(strLat) : NaN
  const lng = strLng ? parseFloat(strLng) : NaN
  const radius = strRadius ? parseInt(strRadius) : NaN

  const checkUser = () => !(session?.user) && router.push('http://localhost:3000/api/auth/signin')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      setMapsLoaded(true);
    }

    (async () => {
      const response = await fetch('/api/send', {
        method:"POST"
      })

      console.log(await response.json())
    })()

  }, []);

  if (!SessionInfo.get("Email") && session?.user) {
    SessionInfo.session = session
  }

  useEffect(() => {
    const email = SessionInfo.get("Email");

    async function getPricesData(): Promise<Map<number, FormattedPricesResponseType>> {
      const pricesResponse = await fetch(`${URL_Endpoints.BASE_URL}/getPricesData?${searchParams.toString()}`)
      const pricesData: { error: string } | BasePricesResponseType[] = await pricesResponse.json()

      if (pricesResponse.status !== 200 || !Array.isArray(pricesData)) {
        throw (pricesData as { error: string }).error
      }

      const feedback: { feedback: { dislikes: number[], likes: number[] } } = await (await fetch(`${URL_Endpoints.BASE_URL}/getUserFeedbacks`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })).json()

      const newMap: Map<number, FormattedPricesResponseType> = new Map();

      pricesData.forEach(item => {

        const isLiked = feedback.feedback.likes.includes(item.id)
        const isDisliked = feedback.feedback.dislikes.includes(item.id)

        newMap.set(item.id, {
          ...item,
          likes: parseInt(item.likes),
          dislikes: parseInt(item.dislikes),
          isLiked: isLiked,
          isDisliked: isDisliked,
          price: parseInt(item.price),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lng),
        })
      })

      return newMap
    }


    if (email && strLat && strLng) {
      getPricesData().then(data => setPrices(data))
    }

  }, [session?.user?.email, searchParams.get('radius'), searchParams.get('sortType'), searchParams.get('lat'), searchParams.get('lng'), searchParams.get('product')])

  function ListPrices() {

    return (
      <div className='mt-[5vh] overflow-y-auto'>
        {Array.from(prices.keys()).map(id => (
          <PriceCard
            setPrices={setPrices}
            checkUser={checkUser}
            currSelectedItemKey={selectedItemKey} setCurrMarker={setCurrMarker}
            setSelectedItemKey={setSelectedItemKey}
            key={id} id={id} prices={prices}
          />
        )
        )}
      </div>
    );
  }

  return (
    <>
      <Script
        src='https://maps.googleapis.com/maps/api/js?key=AIzaSyBnvG70wcyfAYDGLa5pWH0ClNBmihlwjJk&libraries=places' onLoad={() => setMapsLoaded(true)} defer />
      {isMapsLoaded ?
        strLat && strLng ?
          <>
            <OverlayForm isOverlayOn={isOverlayOn} />
            <div className={isOverlayOn ? "blur-sm" : ""} onClick={() => isOverlayOn && setIsOverlayOn(false)}>
              <SearchItem lat={lat}
                lng={lng}
                radius={radius}
                product={product}
              />
              <div className='flex justify-evenly mt-[5vh] min-h-[60vh] max-h-[70vh]'>
                <Maps currMarker={currMarker} setSelectedMarker={setCurrMarker} />
                <div className='max-h-full max-w-[35vw]'>
                  <div className='flex justify-between'>
                    <h3 className='flex-1'>Rating</h3>
                    <div className='flex flex-[3] justify-evenly'>
                      <div className='flex items-center'>
                        <h3>top: </h3><div className='bg-cyan-300 w-3 h-3'></div>
                      </div>

                      <div className='flex items-center'>
                        <h3>bottom: </h3><div className='bg-red-400 w-3 h-3'></div>
                      </div>
                    </div>
                  </div>
                  <div className='flex flex-col mt-5'>
                    <h2>Want to contribute?</h2>
                    <h2 className='inline'><button
                      onClick={() => setIsOverlayOn(true)}
                      className='bg-black text-white rounded-md px-[1vw] mr-[0.5vw]'>Click me</button>
                      to add a new information</h2>
                  </div>
                  <select className='float-right' name="sort" onChange={e => {
                    const newUrlSearchParams = new URLSearchParams(searchParams)
                    newUrlSearchParams.set('sortType', e.target.value)
                    router.push(`/?${newUrlSearchParams.toString()}`)
                  }}>
                    <option value={SortOptions.PriceLTH.value}>{SortOptions.PriceLTH.display}</option>
                    <option value={SortOptions.PriceHTL.value}>{SortOptions.PriceHTL.display}</option>
                    <option value={SortOptions.RatingLTH.value}>{SortOptions.RatingLTH.display}</option>
                    <option value={SortOptions.RatingHTL.value}>{SortOptions.RatingHTL.display}</option>
                  </select>
                  <ListPrices />
                </div>
              </div>
            </div>
          </>
          : <>
            <SearchItem lat={lat}
              radius={radius}
              lng={lng}
              product={product}
            />
          </>
        : <div>ok</div>
      }
    </>
  )
}