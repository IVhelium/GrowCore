import { BrowserRouter } from "react-router-dom";
import Header from "./components/layout/Header.jsx";


function App() {

  return (
    <BrowserRouter>
      <div className="min-w-screen min-h-screen bg-[#F7F8FF] text-[#111111]">
        <Header />
        <main className="layout mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[280px_1fr] bg-[#FFFFFF]"></main>
      </div>
    </BrowserRouter>
  );
}

export default App
