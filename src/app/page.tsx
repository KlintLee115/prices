"use client"

import Maps, { MarkerType } from '@/components/Maps';
import OverlayForm from '@/components/OverlayForm';
import SearchItem from '@/components/SearchItem';
import { BasePricesResponseType, FeedbackType, FormattedPricesResponseType, Icons, SessionInfo, handleFeedback } from '@/lib/general';
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
  const product = searchParams.get('product')
  const radius = searchParams.get('radius')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      setMapsLoaded(true);
    }

    if (!SessionInfo.get("Email") && session?.user) {
      SessionInfo.session = session
    }

  }, []);

  useEffect(() => {
    const email = SessionInfo.get("Email");

    if (email && strLat && strLng && radius) {

      (async () => {

        const pricesResponse = await fetch(`http://localhost:3000/getPricesData?${searchParams.toString()}`)
        const pricesData: { error: string } | BasePricesResponseType[] = await pricesResponse.json()

        if (pricesResponse.status !== 200 || !Array.isArray(pricesData)) {
          throw (pricesData as { error: string }).error
        }

        const feedback: { feedback: { dislikes: number[], likes: number[] } } = await (await fetch('http://localhost:3000/getUserFeedbacks', {
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

        setPrices(newMap)
      })()
    }
  }, [session?.user?.email, searchParams.get('radius'), searchParams.get('sortType'), searchParams.get('lat'), searchParams.get('lng'), searchParams.get('product')])

  return (
    <>
      <Script
        src='https://maps.googleapis.com/maps/api/js?key=AIzaSyBnvG70wcyfAYDGLa5pWH0ClNBmihlwjJk&libraries=places' onLoad={() => setMapsLoaded(true)} defer />
      {isMapsLoaded ?
        strLat && strLng && radius ?
          <>
            <OverlayForm isOverlayOn={isOverlayOn} />
            <div className={isOverlayOn ? "blur-sm" : ""} onClick={() => isOverlayOn && setIsOverlayOn(false)}>
              <SearchItem lat={strLat ? parseFloat(strLat) : undefined}
                lng={strLng ? parseFloat(strLng) : undefined}
                product={product ?? undefined}
              />
              <div className='flex justify-evenly mt-[5vh] min-h-[60vh] max-h-[70vh]'>
                <Maps currMarker={currMarker} setSelectedMarker={setCurrMarker} />
                <div className='max-h-full max-w-[35vw]'>
                  <div className='flex flex-col'>
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
            <SearchItem lat={strLat ? parseFloat(strLat) : undefined}
              lng={strLng ? parseFloat(strLng) : undefined}
              product={product ?? undefined}
            />
          </>
        : <div>ok</div>
      }
    </>
  )

  function ListPrices() {
    return (
      <div className='mt-[5vh] overflow-y-auto'>
        {Array.from(prices.keys()).map(id => (
          <PriceCard key={id} item={prices.get(id) as FormattedPricesResponseType}
          />
        ))}
      </div>
    );
  }

  function PriceCard({ item }: { item: FormattedPricesResponseType, }) {

    const { product, price, address, isLiked, isDisliked, likes, dislikes, lat, lng, id } = item

    const handleFeedbackFunc = async (feedbackType: FeedbackType)
      : Promise<number> => {

      if (!(session?.user)) {
        router.push('http://localhost:3000/api/auth/signin')
        return NaN
      }

      return handleFeedback({ id, isLiked, isDisliked, prices, setPrices, feedbackType })
    }

    return <div
      onClick={() => {
        setSelectedItemKey(id)
        setCurrMarker({
          lng: lng,
          lat: lat,
          name: address
        })
      }}
      className={`border border-black h-fit py-[1vh] px-[3vw] flex ${id === selectedItemKey ? "bg-cyan-100" : "bg-transparent"}`}>
      <div>
        <h3>Item: {product}</h3>
        <h3>Price: {price}</h3>
        <h3>Address: {address}</h3>
      </div>
      <div className='relative'>
        <div className='w-14'>
          {
            isLiked ? (
              <Icons.BLACK_LIKE_ICON onClick={() => handleFeedbackFunc(FeedbackType.Like)} />
            )
              : <Icons.WHITE_LIKE_ICON onClick={async () => {
                const responseCode = await handleFeedbackFunc(FeedbackType.Like)
                responseCode === 200 && isDisliked && handleFeedbackFunc(FeedbackType.Dislike)
              }} />
          }
          {likes}
        </div>
        <div className='absolute bottom-0 w-14'>
          {
            isDisliked ? (
              <Icons.BLACK_DISLIKE_ICON onClick={() => handleFeedbackFunc(FeedbackType.Dislike)} />
            )
              : <Icons.WHITE_DISLIKE_ICON onClick={async () => {
                const responseCode = await handleFeedbackFunc(FeedbackType.Dislike)
                responseCode === 200 && isLiked && handleFeedbackFunc(FeedbackType.Like)
              }}
              />
          }
          {dislikes}
        </div>
      </div>
    </div>
  }
}