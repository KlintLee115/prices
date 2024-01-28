"use client"

import { useSession } from "next-auth/react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function Overlay({ isOverlayOn }: { isOverlayOn: boolean }) {

    const locationAutoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const locationInputRef = useRef<HTMLInputElement | null>(null);
    const [location, setLocation] = useState<google.maps.places.PlaceResult>()
    const { data: session } = useSession()

    function formSubmitted(e: FormEvent<HTMLFormElement>) {
        e.preventDefault(); // Prevent the default form submission behavior

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
                await fetch('http://localhost:3000/insertNewPrice', {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        by: session?.user?.email,
                        products, price, dateStr, lat, lng,
                        address: location?.address_components?.map(component => component.long_name).join(', '),
                    })
                })
            }
            catch (err) {
                throw err
            }
        })()
    }

    useEffect(() => {

        if (isOverlayOn) {

            if (session?.user?.email) {

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


                    const place = locationAutoCompleteRef.current?.getPlace();
                    setLocation(place)
                });

                return () => {
                    if (locationAutoCompleteRef.current) {
                        window.google.maps.event.clearInstanceListeners(locationAutoCompleteRef.current);
                    }
                };
            }
        }
    }), []

    function OverlayForm() {
        return (
            <form className="flex flex-col gap-[3vh]" onSubmit={formSubmitted}>
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
        isOverlayOn ? (
            <OverlayFrame>
                {session?.user?.email ? <OverlayForm /> : <Link href="http://localhost:3000/api/auth/signin">Sign in with Google</Link>}
            </OverlayFrame>
        )
            : <div></div>
    )
}

function OverlayFrame({ children }: { children: JSX.Element }) {
    return <div className="bg-white z-10 h-fit py-[5vh]
    fixed top-[10vh] shadow-black shadow-2xl
    left-0 right-0 mx-auto w-fit px-[5vw]">
        {children}
    </div>
}