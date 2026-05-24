import Container from "../components/common/Container";


export default function ProductPage({
    product,
    relatedProducts = [],
    onAddCart,
    onToggleFavorite
}) {
    if (!product) {
        return (
            <main>
                <Container className="py-10">Product not found</Container>
            </main>
        );
    }

    return (
        <main>
            <Container className="py-8">
                <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="grid aspect-square place-content-center overflow-hidden rounded-xl bg-slate-50">
                            <img src={product.image} alt={product.title} className="h-full w-full object-cover"/>
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4F8A5B]">Product</p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">{product.title}</h1>
                    </section>
                </div>
            </Container>
        </main>
    );
}