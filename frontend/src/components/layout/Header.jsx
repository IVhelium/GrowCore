import { Search } from "lucide-react";


function header() {
    return (
        <header className="flex w-full justify-evenly items-center z-40">
            <h1>GrowCore</h1>
            <button className="hi"></button>
            <Search />
        </header>
    );
}

export default header