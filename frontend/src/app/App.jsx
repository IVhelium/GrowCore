import Header from "../widgets/layout/Header.jsx";


function App() {

  return (
    <div className="min-w-screen bg-[#F7F8FF] text-[#111111]">
      <Header />
      <main className="layout mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[280px_1fr] bg-[#FFFFFF]"></main>
    </div>
  );
}

export default App
