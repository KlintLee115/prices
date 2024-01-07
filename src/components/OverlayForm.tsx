"use client"

import { FormEvent, MutableRefObject, useEffect, useRef, useState } from "react";

export default function OverlayForm({ isOverlayOn }: { isOverlayOn: boolean }) {
    function formSubmitted(e: FormEvent<HTMLFormElement>, locationAutoCompleteRef: MutableRefObject<google.maps.places.Autocomplete | null>) {
        e.preventDefault(); // Prevent the default form submission behavior

        // Access the form element
        const formData = new FormData(e.currentTarget)
        const place = locationAutoCompleteRef.current?.getPlace();
        const address = place?.geometry?.location
        const lat = address?.lat()
        const lng = address?.lng()

        // Access form field values using their "name" attributes
        const products = formData.get("product")
        const price = parseFloat(formData.get("price") as string)
        const date = formData.get("date");

        async function submitData() {
            const response = await fetch('/api/', {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    products: products,
                    price: price,
                    dateStr: date,
                    address: location,
                    lat: lat,
                    lng: lng
                })
            })
            const status = await response.json()
            console.log(status)
        }

        submitData()
    }
    if (isOverlayOn) {
        const locationAutoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
        const locationInputRef = useRef<HTMLInputElement | null>(null);
        const [location, setLocation] = useState<string>("")

        useEffect(() => {

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
                const addressComponents = place?.address_components?.map(component => component.long_name)
                const address = addressComponents?.join(',')

                address && setLocation(address)

            });

            return () => {
                if (locationAutoCompleteRef.current) {
                    window.google.maps.event.clearInstanceListeners(locationAutoCompleteRef.current);
                }
            };
        }, [])

        return <form onSubmit={e => formSubmitted(e, locationAutoCompleteRef)} className="bg-white z-10 h-fit py-[5vh]
    fixed top-[10vh] shadow-black shadow-2xl
    left-0 right-0 mx-auto w-fit px-[5vw]">
            <p className="text-xl font-bold">Insert a new item</p>
            <div className="mt-[3vh] flex justify-between">
                <label htmlFor="">Location</label>
                <input
                    ref={locationInputRef}
                    onChange={e => setLocation(e.target.value)}
                    value={location} type="text" className="outline" />
            </div>
            <div className="mt-[3vh]">
                <label>Product name</label>
                <input name="product" required type="text" className="outline ml-[1vw]" />
            </div>
            <div className="mt-[3vh]">
                <label>Price</label>
                <input step={0.01} required name="price" type="number" className="outline float-right" />
            </div>

            <div className="my-[3vh]">
                <label>Date</label>
                <input required name="date" type="date" className="outline w-fit float-right" />
            </div>

            <button type="submit"
                className=" bg-black text-white rounded-md 
        px-[1vw] mr-[0.5vw] text-lg">Submit</button>

        </form>
    }

    else return <div></div>
}