import { BrowserRouter } from "react-router-dom";
import Header from "./components/layout/Header.jsx";


function App() {

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F7F8FF] text-[#111111]">
        <div className="h-36"></div>
        <Header />
        <main className="w-full h-dvh mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[280px_1fr] bg-[#da9494]"></main>
      </div>
    </BrowserRouter>
  );
}

export default App
