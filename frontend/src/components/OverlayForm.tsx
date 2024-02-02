"use client"

import { SessionInfo, URL_Endpoints } from "@/lib/general";
import Link from "next/link";
import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";

export default function Overlay({ isOverlayOn, setIsOverlayOn }: { isOverlayOn: boolean, setIsOverlayOn: Dispatch<SetStateAction<boolean>> }) {

    const locationAutoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const locationInputRef = useRef<HTMLInputElement | null>(null);
    const [location, setLocation] = useState<google.maps.places.PlaceResult>()

    function formSubmitted(e: FormEvent<HTMLFormElement>) {

        // Access the form element
        const formData = new FormData(e.currentTarget)

        const locationComp = location?.geometry?.location

        const lat = locationComp?.lat()
        const lng = locationComp?.lng()

        // Access form field values using their "name" attributes
        const products = formData.get("product")
        const price = parseFloat(formData.get("price") as string)
        const dateStr = formData.get("date");

        (async () => {
            try {
                await fetch(`${URL_Endpoints.BACKEND_URL}/insertNewPrice`, {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        by: SessionInfo.get("Email"),
                        products, price, dateStr, lat, lng,
                        address: location?.address_components?.map(component => component.long_name).join(', '),
                    })
                })
            }
            catch (err) {
                throw err
            }
        })()

        setIsOverlayOn(false)
    }

    useEffect(() => {

        if (isOverlayOn && SessionInfo.get("Email")) {

            if (!locationInputRef.current) return;

            const options: google.maps.places.AutocompleteOptions = {
                fields: ["address_components", "geometry", "icon", "name"],
                types: ["establishment"],
            }

            locationAutoCompleteRef.current = new google.maps.places.Autocomplete(
                locationInputRef.current,
                options
            );

            locationAutoCompleteRef.current.addListener("place_changed", () => {
                setLocation(locationAutoCompleteRef.current?.getPlace())
            });

            return () => {
                if (locationAutoCompleteRef.current) {
                    window.google.maps.event.clearInstanceListeners(locationAutoCompleteRef.current);
                }
            };
        }
    }), []

    function OverlayForm() {

        return (
            <form className='flex flex-col gap-[3vh]' onSubmit={formSubmitted}>
                <p className="text-xl font-bold">Insert a new item</p>
                <div className="flex justify-between">
                    <label htmlFor="">Location</label>
                    <input
                        ref={locationInputRef}
                        defaultValue={location?.address_components?.map(component => component.long_name).join(',')
                        } type="text" className="outline" />
                </div>
                <div>
                    <label>Product name</label>
                    <input name="product" required type="text" className="outline ml-[1vw]" />
                </div>
                <div>
                    <label>Price</label>
                    <input step={0.01} required name="price" type="number" className="outline float-right" />
                </div>
                <div>
                    <label>Date</label>
                    <input required name="date" type="date" className="outline w-fit float-right" />
                </div>

                <button type="submit"
                    className=" bg-black text-white rounded-md px-[1vw] mr-[0.5vw] text-lg">Submit</button>
            </form>
        )
    }

    return (
        <OverlayFrame isOverlayOn={isOverlayOn}>
            {SessionInfo.get("Email") ? <OverlayForm /> : <Link href={URL_Endpoints.AUTHENTICATION_URL}>Sign in with Google</Link>}
        </OverlayFrame>
    )
}

function OverlayFrame({ children, isOverlayOn }: { children: JSX.Element, isOverlayOn: boolean }) {

    return <div className={`bg-white z-10 h-fit py-[5vh]
    fixed inset-0 top-[10vh] shadow-black shadow-2xl
    mx-auto w-fit px-[5vw]  transition-all ${isOverlayOn ? 'scale-100' : 'scale-0'}`}>
        {children}
    </div>
}