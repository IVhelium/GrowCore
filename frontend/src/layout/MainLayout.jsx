import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";


export default function MainLayout() {
    return <div className="min-h-screen bg-[#F7F8FF] text-[#111111]">
        <Header/>
        <Outlet/>
    </div>;
}