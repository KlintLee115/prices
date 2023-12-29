import { Button } from "./ui/button";

export default function InsertItem() {
    return <div className="border border-black p-10 pb-5">
        <h1 >Insert an expense</h1>
        <div className="mt-5 flex gap-4 items-center">
            <label htmlFor="">Location: </label><input type="text" className="outline h-min" />
            <label htmlFor="">Product: </label><input type="text" className="outline h-min" />
            <label htmlFor="">Amount: </label><input type="number" className="outline h-min" />
            <Button className="bg-black text-white rounded-xl">Submit</Button>
        </div>
    </div>
}