import Sidebar from "../components/layout/Sidebar";


export default function HomePage() {
    return (
      <main className="w-full h-dvh mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[280px_1fr] bg-[#da9494]">
        <section>
          <Sidebar/>
        </section>
      </main>
    );
}